import { createHash, randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string; label?: string };
    const plaintext = body.token?.trim();

    if (!plaintext || plaintext.length < 10) {
      return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(plaintext).digest("hex");
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    // Atomically consume the connect token in a single UPDATE.
    // If consumed_at IS NOT NULL or expires_at is past, the WHERE clause won't match
    // and maybeSingle() returns null — safe under concurrent requests.
    const { data: connectToken, error: consumeError } = await supabase
      .from("extension_connect_tokens")
      .update({ consumed_at: now })
      .eq("token_hash", tokenHash)
      .is("consumed_at", null)
      .gt("expires_at", now)
      .select("id, user_id, project_id")
      .maybeSingle();

    if (consumeError) {
      throw new Error(consumeError.message);
    }

    if (!connectToken) {
      return NextResponse.json(
        { error: "Token not found, expired, or already used" },
        { status: 401 },
      );
    }

    // Issue a persistent extension token (30-day expiry).
    const persistentPlaintext = randomBytes(32).toString("hex");
    const persistentHash = createHash("sha256").update(persistentPlaintext).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000).toISOString();

    const { data: extensionToken, error: insertError } = await supabase
      .from("extension_tokens")
      .insert({
        user_id: connectToken.user_id,
        project_id: connectToken.project_id,
        token_hash: persistentHash,
        label: body.label?.trim().slice(0, 80) || null,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      token: persistentPlaintext,
      tokenId: extensionToken.id,
      projectId: connectToken.project_id,
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

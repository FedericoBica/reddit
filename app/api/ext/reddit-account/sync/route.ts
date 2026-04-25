import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const plaintext = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!plaintext) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const body = (await request.json()) as { username?: string };
    const username = body.username?.trim();
    if (!username || username.length > 30) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(plaintext).digest("hex");
    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    const { data: token, error: tokenError } = await supabase
      .from("extension_tokens")
      .select("id, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (tokenError) throw new Error(tokenError.message);
    if (!token) return NextResponse.json({ error: "Invalid or revoked token" }, { status: 401 });
    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Only update reddit_username when unbound or already bound to the same account.
    // This prevents a token holder from overwriting a binding with an arbitrary username.
    const { data: updated, error: updateError } = await supabase
      .from("extension_tokens")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ reddit_username: username, reddit_verified_at: now, last_used_at: now } as any)
      .eq("id", token.id)
      .or(`reddit_username.is.null,reddit_username.eq.${username}`)
      .select("id")
      .maybeSingle();

    if (updateError) throw new Error(updateError.message);

    if (!updated) {
      return NextResponse.json(
        { error: "Token already bound to a different Reddit account" },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, username, verifiedAt: now });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

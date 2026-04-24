import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Resolves the extension token from the Authorization header and returns
// the connected project and user info.
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization") ?? "";
    const plaintext = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!plaintext) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const tokenHash = createHash("sha256").update(plaintext).digest("hex");
    const supabase = createSupabaseAdminClient();

    const { data: token, error } = await supabase
      .from("extension_tokens")
      .select("id, user_id, project_id, expires_at, revoked_at")
      .eq("token_hash", tokenHash)
      .is("revoked_at", null)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!token) {
      return NextResponse.json({ error: "Invalid or revoked token" }, { status: 401 });
    }

    if (token.expires_at && new Date(token.expires_at) < new Date()) {
      return NextResponse.json({ error: "Token expired" }, { status: 401 });
    }

    // Update last_used_at (fire-and-forget).
    supabase
      .from("extension_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id)
      .then(() => {});

    const { data: project } = await supabase
      .from("projects")
      .select("id, name, status")
      .eq("id", token.project_id)
      .single();

    return NextResponse.json({
      ok: true,
      userId: token.user_id,
      project: project ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

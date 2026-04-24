import "server-only";

import { createHash } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ExtAuthContext = {
  userId: string;
  projectId: string;
  tokenId: string;
};

export async function resolveExtToken(
  authHeader: string | null,
): Promise<ExtAuthContext | null> {
  const plaintext = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!plaintext) return null;

  const tokenHash = createHash("sha256").update(plaintext).digest("hex");
  const supabase = createSupabaseAdminClient();

  const { data: token } = await supabase
    .from("extension_tokens")
    .select("id, user_id, project_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (!token) return null;
  if (token.expires_at && new Date(token.expires_at) < new Date()) return null;

  // Fire-and-forget last_used_at update.
  supabase
    .from("extension_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", token.id)
    .then(() => {});

  return { userId: token.user_id, projectId: token.project_id, tokenId: token.id };
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function serverError(error: unknown) {
  return Response.json(
    { error: error instanceof Error ? error.message : "Internal error" },
    { status: 500 },
  );
}

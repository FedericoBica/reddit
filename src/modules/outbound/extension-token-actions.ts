"use server";

import { createHash, randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/modules/auth/server";
import { projectIdSchema } from "@/db/schemas/domain";

export async function generateConnectTokenFromForm(formData: FormData): Promise<void> {
  const user = await requireUser();
  const projectId = projectIdSchema.parse(formData.get("projectId"));

  const plaintext = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(plaintext).digest("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1_000).toISOString();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("extension_connect_tokens").insert({
    user_id: user.id,
    project_id: projectId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to generate connect token: ${error.message}`);
  }

  redirect(
    `/settings?projectId=${projectId}&tab=extension&connectToken=${plaintext}`,
  );
}

export async function revokeExtensionTokenFromForm(formData: FormData): Promise<void> {
  const user = await requireUser();
  const tokenId = String(formData.get("tokenId") ?? "");
  const projectId = projectIdSchema.parse(formData.get("projectId"));

  if (!tokenId) throw new Error("Missing tokenId");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("extension_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", tokenId)
    .eq("user_id", user.id)
    .eq("project_id", projectId)
    .is("revoked_at", null);

  if (error) {
    throw new Error(`Failed to revoke extension token: ${error.message}`);
  }

  revalidatePath("/settings");
}

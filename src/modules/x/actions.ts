"use server";

import { revalidatePath } from "next/cache";
import { updateXPostStatus } from "@/db/mutations/x";
import { requireUser } from "@/modules/auth/server";

export async function updateXPostStatusFromForm(formData: FormData) {
  await requireUser("/feed");

  const projectId = String(formData.get("projectId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!projectId || !postId || !status) return;

  await updateXPostStatus(projectId, postId, status);
  revalidatePath("/feed");
}

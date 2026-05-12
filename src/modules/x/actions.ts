"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateXPostStatus, requestXPostReplyGeneration, markXPostReplyUsed } from "@/db/mutations/x";
import { inngest } from "@/inngest/client";
import { requireUser } from "@/modules/auth/server";

export async function updateXPostStatusFromForm(formData: FormData) {
  await requireUser("/feed");

  const projectId = String(formData.get("projectId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  const status = String(formData.get("status") ?? "");
  const replyId = String(formData.get("replyId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");

  if (!projectId || !postId || !status) return;

  if (replyId) {
    await markXPostReplyUsed(projectId, replyId);
  }

  await updateXPostStatus(projectId, postId, status);
  revalidatePath("/feed");
  revalidatePath("/archive/replied");
  if (returnTo) redirect(returnTo);
}

export async function generateXReplyFromForm(formData: FormData) {
  const user = await requireUser("/feed");

  const projectId = String(formData.get("projectId") ?? "");
  const xPostId = String(formData.get("xPostId") ?? "");

  if (!projectId || !xPostId) return;

  const queued = await requestXPostReplyGeneration(projectId, xPostId);

  if (!queued) return;

  await inngest.send({
    name: "x/reply.generate.requested",
    data: { projectId, xPostId, userId: user.id },
  });

  revalidatePath("/feed");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/inngest/client";
import {
  failLeadReplyGeneration,
  markLeadReplyUsed,
  requestLeadReplyGeneration,
} from "@/db/mutations/lead-replies";
import { updateLeadStatus } from "@/db/mutations/leads";
import { leadStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";

export async function updateLeadStatusFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const status = leadStatusSchema.parse(String(formData.get("status") ?? ""));
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);

  await updateLeadStatus({
    projectId,
    leadId,
    status,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  redirect(returnTo);
}

export async function generateLeadRepliesFromForm(formData: FormData) {
  const user = await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);

  const queued = await requestLeadReplyGeneration({
    projectId,
    leadId,
  });

  if (!queued) {
    redirect(returnTo);
  }

  try {
    await inngest.send({
      name: "leads/replies.requested",
      data: {
        projectId,
        leadId,
        userId: user.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Inngest dispatch error";
    await failLeadReplyGeneration(projectId, leadId, message);
    throw error;
  }

  revalidatePath(`/leads/${leadId}`);
  redirect(returnTo);
}

export async function useLeadReplyFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const replyId = String(formData.get("replyId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);

  await markLeadReplyUsed({
    projectId,
    leadId,
    replyId,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  redirect(returnTo);
}

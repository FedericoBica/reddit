"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/inngest/client";
import {
  failLeadReplyGeneration,
  markLeadReplyUsed,
  requestLeadReplyGeneration,
} from "@/db/mutations/lead-replies";
import { snoozeLead, unsnoozeLead, updateLeadStatus } from "@/db/mutations/leads";
import { leadStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";

export async function updateLeadStatusFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const status = leadStatusSchema.parse(String(formData.get("status") ?? ""));
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);
  const wonValueRaw = formData.get("wonValue");
  const lostReason = formData.get("lostReason") ? String(formData.get("lostReason")) : undefined;

  const wonValue =
    wonValueRaw !== null && wonValueRaw !== ""
      ? Number(wonValueRaw)
      : undefined;

  await updateLeadStatus({
    projectId,
    leadId,
    status,
    wonValue: isNaN(wonValue as number) ? undefined : wonValue,
    lostReason,
  });

  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
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

export async function snoozeLeadFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const snoozedUntil = String(formData.get("snoozedUntil") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);

  if (!snoozedUntil) return;

  await snoozeLead(projectId, leadId, snoozedUntil);

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/dashboard?projectId=${projectId}`);
}

export async function unsnoozeLeadFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");

  await unsnoozeLead(projectId, leadId);

  revalidatePath("/dashboard");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}?projectId=${projectId}`);
}

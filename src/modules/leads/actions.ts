"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/inngest/client";
import {
  failLeadReplyGeneration,
  markLeadReplyUsed,
  requestLeadReplyGeneration,
} from "@/db/mutations/lead-replies";
import { recordAiReplyGeneration, assertAiReplyGenerationAvailable } from "@/modules/billing/reply-generation";
import { snoozeLead, unsnoozeLead, updateLeadStatus } from "@/db/mutations/leads";
import { leadStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { executeLeadReplyGenerationFlow } from "@/modules/replies/lead-reply-generation-flow";

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
  revalidatePath("/feed");
  revalidatePath(`/leads/${leadId}`);
  redirect(returnTo);
}

export async function generateLeadRepliesFromForm(formData: FormData) {
  const user = await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? `/leads/${leadId}?projectId=${projectId}`);

  const outcome = await executeLeadReplyGenerationFlow({
    assertAvailable: async () => {
      await assertAiReplyGenerationAvailable(user.id);
    },
    dispatchGeneration: async () => {
      await inngest.send({
        name: "leads/replies.requested",
        data: {
          projectId,
          leadId,
          userId: user.id,
        },
      });
    },
    failGeneration: async (message) => {
      await failLeadReplyGeneration(projectId, leadId, message);
    },
    recordUsage: async () => {
      await recordAiReplyGeneration(projectId, user.id, "lead");
    },
    requestGeneration: async () =>
      requestLeadReplyGeneration({
        projectId,
        leadId,
      }),
  });

  if (outcome.status === "limit_reached" || outcome.status === "dispatch_failed" || outcome.status === "not_queued") {
    revalidatePath("/feed");
    revalidatePath(`/leads/${leadId}`);
    redirect(returnTo);
  }

  revalidatePath("/feed");
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
  revalidatePath("/feed");
  revalidatePath(`/leads/${leadId}`);
  redirect(returnTo);
}

export async function snoozeLeadFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  const snoozedUntil = String(formData.get("snoozedUntil") ?? "");

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

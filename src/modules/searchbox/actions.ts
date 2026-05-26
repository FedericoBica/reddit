"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { inngest } from "@/inngest/client";
import { createLeadFromSearchboxResult, updateSearchboxResultStatus } from "@/db/mutations/searchbox";
import { getSearchboxResult } from "@/db/queries/searchbox";
import { failLeadReplyGeneration, requestLeadReplyGeneration } from "@/db/mutations/lead-replies";
import { searchboxResultStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { assertAiReplyGenerationAvailable, recordAiReplyGeneration } from "@/modules/billing/reply-generation";
import { executeLeadReplyGenerationFlow } from "@/modules/replies/lead-reply-generation-flow";

export async function generateSearchboxReplyFromForm(formData: FormData) {
  const user = await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const resultId = String(formData.get("resultId") ?? "");

  const result = await getSearchboxResult(projectId, resultId);
  if (!result) return;

  let leadId = result.lead_id;

  if (!leadId) {
    leadId = await createLeadFromSearchboxResult(result);
  }

  await executeLeadReplyGenerationFlow({
    assertAvailable: async () => {
      await assertAiReplyGenerationAvailable(user.id);
    },
    dispatchGeneration: async () => {
      await inngest.send({
        name: "leads/replies.requested",
        data: { projectId, leadId, userId: user.id },
      });
    },
    failGeneration: async (message) => {
      await failLeadReplyGeneration(projectId, leadId, message);
    },
    recordUsage: async () => {
      await recordAiReplyGeneration(projectId, user.id, "lead");
    },
    requestGeneration: async () => requestLeadReplyGeneration({ projectId, leadId }),
  });

  revalidatePath("/dashboard");
}

export async function updateSearchboxStatusFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const resultId = String(formData.get("resultId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "");
  const status = searchboxResultStatusSchema.parse(String(formData.get("status") ?? ""));

  await updateSearchboxResultStatus({ resultId, projectId, status });

  revalidatePath("/dashboard");
  if (returnTo) redirect(returnTo);
}

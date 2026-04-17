"use server";

import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";
import { createLeadFromSearchboxResult, updateSearchboxResultStatus } from "@/db/mutations/searchbox";
import { getSearchboxResult } from "@/db/queries/searchbox";
import { requestLeadReplyGeneration } from "@/db/mutations/lead-replies";
import { searchboxResultStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";

export async function generateSearchboxReplyFromForm(formData: FormData) {
  const user = await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const resultId = String(formData.get("resultId") ?? "");

  const result = await getSearchboxResult(projectId, resultId);
  if (!result) return;

  let leadId = result.lead_id;

  if (!leadId) {
    leadId = await createLeadFromSearchboxResult(result, user.id);
  }

  const queued = await requestLeadReplyGeneration({ projectId, leadId });

  if (queued) {
    await inngest.send({
      name: "leads/replies.requested",
      data: { projectId, leadId, userId: user.id },
    });
  }

  revalidatePath("/dashboard");
}

export async function updateSearchboxStatusFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  const resultId = String(formData.get("resultId") ?? "");
  const status = searchboxResultStatusSchema.parse(String(formData.get("status") ?? ""));

  await updateSearchboxResultStatus({ resultId, projectId, status });

  revalidatePath("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateDmContactStatusSchema } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { requireProjectAccess } from "@/modules/projects/access";

export async function updateContactStatusFromForm(formData: FormData): Promise<void> {
  await requireUser("/outbound/crm");

  const parsed = updateDmContactStatusSchema.parse({
    contactId: formData.get("contactId"),
    projectId: formData.get("projectId"),
    status: formData.get("status"),
  });

  await requireProjectAccess(parsed.projectId, "/outbound/crm");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("dm_contacts")
    .update({ status: parsed.status })
    .eq("id", parsed.contactId)
    .eq("project_id", parsed.projectId);

  if (error) throw new Error(`Failed to update contact status: ${error.message}`);

  revalidatePath("/outbound/crm");
}

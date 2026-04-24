import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, serverError } from "@/lib/ext-auth";
import { handleUpdateContactOutcome } from "@/modules/outbound/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: contactId } = await params;
    const result = await handleUpdateContactOutcome(
      request.headers.get("authorization"),
      contactId,
      await request.json(),
      {
        resolveAuth: resolveExtToken,
        updateContactStatus: async ({ contactId: id, projectId, status }) => {
          const supabase = createSupabaseAdminClient();
          const { error } = await supabase
            .from("dm_contacts")
            .update({ status })
            .eq("id", id)
            .eq("project_id", projectId);

          if (error) throw new Error(error.message);
        },
      },
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

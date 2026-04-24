import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, unauthorized, badRequest, serverError } from "@/lib/ext-auth";
import { dmContactStatusSchema } from "@/db/schemas/domain";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id: contactId } = await params;
    const body = (await request.json()) as { status?: unknown };
    const parsed = dmContactStatusSchema.safeParse(body.status);
    if (!parsed.success) return badRequest("Invalid status");

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("dm_contacts")
      .update({ status: parsed.data })
      .eq("id", contactId)
      .eq("project_id", auth.projectId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

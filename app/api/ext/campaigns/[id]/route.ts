import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, unauthorized, serverError } from "@/lib/ext-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id } = await params;
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("dm_campaigns")
      .select("*")
      .eq("id", id)
      .eq("project_id", auth.projectId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign: data });
  } catch (err) {
    return serverError(err);
  }
}

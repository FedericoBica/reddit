import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken } from "@/lib/ext-auth";

// Resolves the extension token from the Authorization header and returns
// the connected project and user info.
export async function GET(request: NextRequest) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) {
      return NextResponse.json({ error: "Invalid, expired, or unauthorized token" }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, status")
      .eq("id", auth.projectId)
      .single();

    return NextResponse.json({
      ok: true,
      userId: auth.userId,
      project: project ?? null,
      redditAccount: auth.redditUsername
        ? {
            username: auth.redditUsername,
            verifiedAt: auth.redditVerifiedAt,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

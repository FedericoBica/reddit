import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, serverError } from "@/lib/ext-auth";
import { createCampaign, seedLeadCampaignQueue } from "@/db/mutations/outbound";
import { handleCreateCampaign, handleListCampaigns } from "@/modules/outbound/api";

export async function GET(request: NextRequest) {
  try {
    const result = await handleListCampaigns(request.headers.get("authorization"), {
      resolveAuth: resolveExtToken,
      listCampaigns: async (projectId) => {
        const supabase = createSupabaseAdminClient();
        const { data, error } = await supabase
          .from("dm_campaigns")
          .select("id, name, type, status, sent_count, reply_count, failed_count, started_at, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        return data ?? [];
      },
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await handleCreateCampaign(
      request.headers.get("authorization"),
      await request.json(),
      {
        resolveAuth: resolveExtToken,
        createCampaign,
        seedLeadCampaignQueue,
      },
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

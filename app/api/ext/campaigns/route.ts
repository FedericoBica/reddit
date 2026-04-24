import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, unauthorized, serverError } from "@/lib/ext-auth";
import { createCampaign, seedLeadCampaignQueue } from "@/db/mutations/outbound";
import { createDmCampaignSchema } from "@/db/schemas/domain";

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("dm_campaigns")
      .select("id, name, type, status, sent_count, reply_count, failed_count, started_at, created_at")
      .eq("project_id", auth.projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return NextResponse.json({ campaigns: data });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const body = await request.json();
    const parsed = createDmCampaignSchema.parse({ ...body, projectId: auth.projectId });

    const campaign = await createCampaign({ ...parsed, createdBy: auth.userId });

    // For lead campaigns, seed the queue immediately.
    let seeded = { contactsCreated: 0, queueItemsCreated: 0 };
    if (parsed.type === "lead") {
      const cfg = (parsed.sourceConfig ?? {}) as Record<string, unknown>;
      seeded = await seedLeadCampaignQueue({
        campaignId: campaign.id,
        projectId: auth.projectId,
        minIntentScore: typeof cfg.minIntentScore === "number" ? cfg.minIntentScore : 40,
        maxLeads: typeof cfg.maxLeads === "number" ? cfg.maxLeads : 100,
        onlyNew: cfg.onlyNew !== false,
      });
    }

    return NextResponse.json({ campaign, seeded }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

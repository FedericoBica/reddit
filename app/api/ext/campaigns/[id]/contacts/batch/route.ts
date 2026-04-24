import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, unauthorized, badRequest, serverError } from "@/lib/ext-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id: campaignId } = await params;
    const body = (await request.json()) as { usernames?: unknown };

    if (!Array.isArray(body.usernames) || body.usernames.length === 0) {
      return badRequest("usernames must be a non-empty array");
    }

    const usernames: string[] = body.usernames
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => u.trim().replace(/^u\//i, "").replace(/^\/u\//i, ""))
      .slice(0, 500);

    if (usernames.length === 0) return badRequest("No valid usernames provided");

    const supabase = createSupabaseAdminClient();

    // Verify campaign belongs to project.
    const { data: campaign } = await supabase
      .from("dm_campaigns")
      .select("id, type")
      .eq("id", campaignId)
      .eq("project_id", auth.projectId)
      .single();

    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    // Find already-contacted usernames (skip them — no-recontact rule).
    const { data: existing } = await supabase
      .from("dm_contacts")
      .select("reddit_username, status")
      .eq("project_id", auth.projectId)
      .in("reddit_username", usernames);

    const alreadyActive = new Set(
      (existing ?? [])
        .filter((c) => c.status !== "queued")
        .map((c) => c.reddit_username),
    );
    const alreadyQueued = new Set(
      (existing ?? [])
        .filter((c) => c.status === "queued")
        .map((c) => c.reddit_username),
    );

    const newUsernames = usernames.filter(
      (u) => !alreadyActive.has(u) && !alreadyQueued.has(u),
    );

    if (newUsernames.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: usernames.length });
    }

    // Upsert contacts.
    await supabase.from("dm_contacts").upsert(
      newUsernames.map((u) => ({
        project_id: auth.projectId,
        reddit_username: u,
        source_type: campaign.type,
        first_campaign_id: campaignId,
        last_campaign_id: campaignId,
        status: "queued" as const,
      })),
      { onConflict: "project_id,reddit_username", ignoreDuplicates: true },
    );

    // Fetch inserted contact IDs.
    const { data: contacts } = await supabase
      .from("dm_contacts")
      .select("id")
      .eq("project_id", auth.projectId)
      .in("reddit_username", newUsernames);

    // Create queue items (ON CONFLICT DO NOTHING).
    if (contacts && contacts.length > 0) {
      await supabase.from("dm_queue").upsert(
        contacts.map((c) => ({
          campaign_id: campaignId,
          contact_id: c.id,
          priority: 0,
          status: "pending" as const,
          scheduled_at: new Date().toISOString(),
        })),
        { onConflict: "campaign_id,contact_id", ignoreDuplicates: true },
      );
    }

    return NextResponse.json({
      inserted: contacts?.length ?? 0,
      skipped: usernames.length - newUsernames.length,
    });
  } catch (err) {
    return serverError(err);
  }
}

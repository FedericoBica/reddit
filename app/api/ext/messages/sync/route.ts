import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken, unauthorized, badRequest, serverError } from "@/lib/ext-auth";

type InboundMessage = {
  redditMessageId: string;
  fromUsername: string;
  body: string;
  receivedAt: string;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const body = (await request.json()) as { messages?: unknown };
    if (!Array.isArray(body.messages)) return badRequest("messages must be an array");

    const messages = (body.messages as unknown[])
      .filter(
        (m): m is InboundMessage =>
          typeof m === "object" &&
          m !== null &&
          typeof (m as Record<string, unknown>).redditMessageId === "string" &&
          typeof (m as Record<string, unknown>).fromUsername === "string" &&
          typeof (m as Record<string, unknown>).body === "string",
      )
      .slice(0, 100);

    if (messages.length === 0) return NextResponse.json({ processed: 0, skipped: 0 });

    const supabase = createSupabaseAdminClient();

    // Find contacts we own in this project matching the senders.
    const usernames = [...new Set(messages.map((m) => m.fromUsername))];
    const { data: contacts, error: contactsError } = await supabase
      .from("dm_contacts")
      .select("id, reddit_username, status, last_campaign_id")
      .eq("project_id", auth.projectId)
      .in("reddit_username", usernames);

    if (contactsError) throw new Error(contactsError.message);

    const contactMap = new Map(
      (contacts ?? []).map((c) => [c.reddit_username, c]),
    );

    let processed = 0;
    let skipped = 0;

    for (const msg of messages) {
      const contact = contactMap.get(msg.fromUsername);
      if (!contact) { skipped++; continue; }

      const receivedAt = msg.receivedAt && !isNaN(Date.parse(msg.receivedAt))
        ? new Date(msg.receivedAt).toISOString()
        : new Date().toISOString();

      // Insert inbound message — unique index on (project_id, reddit_message_id) WHERE direction='in'
      // prevents duplicates from repeated polls.
      const { error: msgError } = await supabase.from("dm_messages").upsert(
        {
          project_id: auth.projectId,
          campaign_id: contact.last_campaign_id!,
          contact_id: contact.id,
          direction: "in" as const,
          body: msg.body.slice(0, 2000),
          reddit_message_id: msg.redditMessageId,
          received_at: receivedAt,
        },
        { onConflict: "reddit_message_id", ignoreDuplicates: true },
      );

      if (msgError) { skipped++; continue; }

      // Advance contact status to 'replied' only if it's currently 'sent'.
      await supabase
        .from("dm_contacts")
        .update({
          status: "replied",
          last_reply_at: receivedAt,
        })
        .eq("id", contact.id)
        .eq("status", "sent");

      // Increment campaign reply_count (best-effort).
      if (contact.last_campaign_id) {
        await supabase.rpc("increment_campaign_reply_count", {
          _campaign_id: contact.last_campaign_id,
        });
      }

      processed++;
    }

    return NextResponse.json({ processed, skipped });
  } catch (err) {
    return serverError(err);
  }
}

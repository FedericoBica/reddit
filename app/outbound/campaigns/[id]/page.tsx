import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { getCampaign, listContacts, listContactMessages } from "@/db/queries/outbound";
import type { DmCampaignDTO, DmContactDTO, DmContactStatus, DmMessageDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { updateContactStatusFromForm } from "@/modules/outbound/contact-actions";

export const metadata: Metadata = { title: "Campaign" };

type CampaignPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ projectId?: string; contactId?: string }>;
};

export default async function CampaignDetailPage({ params, searchParams }: CampaignPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;

  const projectState = await resolveCurrentProject(query?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const [campaign, contacts] = await Promise.all([
    getCampaign(id, currentProject.id),
    listContacts(currentProject.id, { campaignId: id }),
  ]);

  if (!campaign) notFound();

  const selectedContactId = query?.contactId ?? contacts[0]?.id ?? null;
  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

  const messages = selectedContact
    ? await listContactMessages(selectedContact.id)
    : [];

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p className="page-kicker">Outbound · Campaign</p>
            <h1 className="page-title">{campaign.name}</h1>
            <p className="page-copy">
              {campaign.type} · {campaign.sent_count} sent · {campaign.reply_count} replies · {campaign.failed_count} failed
            </p>
          </div>
          <CampaignStatusBadge status={campaign.status} />
        </header>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* Stats row */}
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginBottom: 24 }}>
            <StatMetric label="Sent" value={campaign.sent_count} />
            <StatMetric label="Replies" value={campaign.reply_count} />
            <StatMetric label="Failed" value={campaign.failed_count} />
            <StatMetric
              label="Response rate"
              value={
                campaign.sent_count > 0
                  ? `${Math.round((campaign.reply_count / campaign.sent_count) * 100)}%`
                  : "—"
              }
            />
          </div>

          {/* Message template */}
          {campaign.message_template && (
            <div style={{ background: "#FFF", border: "1px solid #EEEEED", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                Message template
              </p>
              <p style={{ fontSize: 13, color: "#1C1C1E", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {campaign.message_template}
              </p>
            </div>
          )}

          {/* Two-column: contact list + conversation */}
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>
            {/* Contact list */}
            <div style={{ background: "#FFF", border: "1px solid #EEEEED", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid #EEEEED" }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                  Contacts ({contacts.length})
                </p>
              </div>
              {contacts.length === 0 ? (
                <p style={{ padding: "20px 14px", fontSize: 12, color: "#AEAEB2" }}>No contacts yet.</p>
              ) : (
                <div style={{ overflowY: "auto", maxHeight: 520 }}>
                  {contacts.map((c) => (
                    <a
                      key={c.id}
                      href={`/outbound/campaigns/${campaign.id}?projectId=${currentProject.id}&contactId=${c.id}`}
                      style={{ textDecoration: "none" }}
                    >
                      <ContactListItem contact={c} isSelected={c.id === selectedContactId} />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation panel */}
            <div style={{ background: "#FFF", border: "1px solid #EEEEED", borderRadius: 12, overflow: "hidden" }}>
              {selectedContact ? (
                <>
                  <div style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #EEEEED",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1C1C1E" }}>
                        u/{selectedContact.reddit_username}
                      </p>
                      <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
                        {selectedContact.status} · {messages.length} messages
                      </p>
                    </div>
                    <OutcomeActions contact={selectedContact} projectId={currentProject.id} />
                  </div>

                  {/* Messages */}
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10, minHeight: 200, maxHeight: 400, overflowY: "auto" }}>
                    {messages.length === 0 ? (
                      <p style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", marginTop: 40 }}>No messages yet.</p>
                    ) : (
                      messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
                    )}
                  </div>
                </>
              ) : (
                <p style={{ padding: "40px", fontSize: 13, color: "#AEAEB2", textAlign: "center" }}>
                  Select a contact to view the conversation.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ─── Sub-components ─── */

function CampaignStatusBadge({ status }: { status: string }) {
  const color = {
    active: "#16A34A",
    paused: "#E07000",
    draft: "#AEAEB2",
    completed: "#6B6B6E",
    failed: "#DC2626",
  }[status] ?? "#AEAEB2";

  return (
    <span style={{
      fontSize: 11, fontWeight: 800, color,
      background: "#F5F5F3", borderRadius: 6,
      padding: "4px 10px", textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function StatMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 26 }}>{value}</div>
    </div>
  );
}

function ContactListItem({ contact, isSelected }: { contact: DmContactDTO; isSelected: boolean }) {
  const STATUS_COLORS: Partial<Record<DmContactStatus, string>> = {
    won: "#16A34A",
    interested: "#7C3AED",
    replied: "#2563EB",
    sent: "#E07000",
    lost: "#DC2626",
  };
  const dotColor = STATUS_COLORS[contact.status] ?? "#D1D1D6";

  return (
    <div style={{
      padding: "10px 14px",
      borderBottom: "1px solid #F5F5F3",
      background: isSelected ? "#FFF8F0" : "transparent",
      borderLeft: isSelected ? "3px solid #E07000" : "3px solid transparent",
      cursor: "pointer",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1C1C1E" }}>
          u/{contact.reddit_username}
        </span>
      </div>
      <p style={{ fontSize: 10, color: "#AEAEB2", marginTop: 3, paddingLeft: 14 }}>
        {contact.last_reply_at
          ? `Replied ${formatRelative(contact.last_reply_at)}`
          : contact.last_message_at
            ? `Sent ${formatRelative(contact.last_message_at)}`
            : "Queued"}
      </p>
    </div>
  );
}

function MessageBubble({ message }: { message: DmMessageDTO }) {
  const isOut = message.direction === "out";
  return (
    <div style={{
      display: "flex",
      justifyContent: isOut ? "flex-end" : "flex-start",
    }}>
      <div style={{
        maxWidth: "75%",
        background: isOut ? "#E07000" : "#F5F5F3",
        color: isOut ? "#FFF" : "#1C1C1E",
        borderRadius: isOut ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
        padding: "10px 14px",
        fontSize: 13,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
      }}>
        {message.body || <em style={{ opacity: 0.6 }}>(no content recorded)</em>}
        <p style={{ fontSize: 9, marginTop: 4, opacity: 0.65, textAlign: isOut ? "right" : "left" }}>
          {isOut ? "You" : `u/contact`} · {formatRelative(message.sent_at ?? message.received_at ?? message.created_at)}
        </p>
      </div>
    </div>
  );
}

const OUTCOME_TRANSITIONS: Partial<Record<DmContactStatus, DmContactStatus[]>> = {
  sent:       ["replied", "lost"],
  replied:    ["interested", "lost"],
  interested: ["won", "lost"],
};

function OutcomeActions({ contact, projectId }: { contact: DmContactDTO; projectId: string }) {
  const transitions = OUTCOME_TRANSITIONS[contact.status] ?? [];
  if (transitions.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {transitions.map((next) => (
        <form key={next} action={updateContactStatusFromForm}>
          <input type="hidden" name="contactId" value={contact.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="status" value={next} />
          <button
            type="submit"
            style={{
              fontSize: 11, fontWeight: 700,
              padding: "4px 12px", borderRadius: 7,
              border: "1px solid", cursor: "pointer",
              background: "none",
              ...(next === "won"
                ? { color: "#16A34A", borderColor: "#BBF7D0" }
                : next === "interested"
                  ? { color: "#7C3AED", borderColor: "#DDD6FE" }
                  : { color: "#DC2626", borderColor: "#FECACA" }),
            }}
          >
            Mark {next}
          </button>
        </form>
      ))}
    </div>
  );
}

/* ─── Utils ─── */

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listCampaigns, listContacts } from "@/db/queries/outbound";
import type { DmCampaignDTO, DmContactDTO, DmContactStatus } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { computeCrmStats, formatRelativeTime, getOutcomeTransitions } from "@/modules/outbound/logic";
import { resolveCurrentProject } from "@/modules/projects/current";
import { updateContactStatusFromForm } from "@/modules/outbound/contact-actions";

export const metadata: Metadata = { title: "Lead CRM" };

type CrmPageProps = {
  searchParams?: Promise<{ projectId?: string; status?: string; campaignId?: string }>;
};

const STATUS_OPTIONS: DmContactStatus[] = ["queued", "sent", "replied", "interested", "won", "lost"];

export default async function CrmPage({ searchParams }: CrmPageProps) {
  const user = await requireUser("/outbound/crm");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const selectedStatus = STATUS_OPTIONS.includes(params?.status as DmContactStatus)
    ? (params?.status as DmContactStatus)
    : undefined;
  const selectedCampaignId = params?.campaignId;

  const [campaigns, contacts] = await Promise.all([
    listCampaigns(currentProject.id),
    listContacts(currentProject.id, {
      status: selectedStatus,
      campaignId: selectedCampaignId,
    }),
  ]);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  // Overview stats.
  const allContacts = await listContacts(currentProject.id);
  const stats = computeCrmStats(allContacts, campaigns);

  function buildHref(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams({ projectId: currentProject.id });
    if ((overrides.status ?? selectedStatus) !== undefined)
      p.set("status", overrides.status ?? selectedStatus!);
    if ((overrides.campaignId ?? selectedCampaignId) !== undefined)
      p.set("campaignId", overrides.campaignId ?? selectedCampaignId!);
    return `/outbound/crm?${p.toString()}`;
  }

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">Outbound</p>
            <h1 className="page-title">Lead CRM</h1>
            <p className="page-copy">{allContacts.length} contacts · {stats.responseRate}% response rate</p>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* Overview metrics */}
          <div className="metric-grid" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))", marginBottom: 20 }}>
            <OverviewMetric label="Queued" value={stats.byStatus.queued} color="#6B6B6E" />
            <OverviewMetric label="Sent" value={stats.byStatus.sent} color="#E07000" />
            <OverviewMetric label="Replied" value={stats.byStatus.replied} color="#2563EB" />
            <OverviewMetric label="Interested" value={stats.byStatus.interested} color="#7C3AED" />
            <OverviewMetric label="Won" value={stats.byStatus.won} color="#16A34A" />
          </div>

          {/* Campaigns overview */}
          {campaigns.length > 0 && (
            <section style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 9, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Campaigns
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {campaigns.map((c) => (
                  <Link
                    key={c.id}
                    href={`/outbound/campaigns/${c.id}?projectId=${currentProject.id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <CampaignCard campaign={c} />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <Link
              href={buildHref({ status: undefined })}
              className={`filter-pill${!selectedStatus ? " filter-pill-active" : ""}`}
            >
              All
            </Link>
            {STATUS_OPTIONS.map((s) => (
              <Link
                key={s}
                href={buildHref({ status: s })}
                className={`filter-pill${selectedStatus === s ? " filter-pill-active" : ""}`}
              >
                {capitalize(s)}
              </Link>
            ))}
          </div>

          {/* CRM table */}
          <div style={{ background: "#FFF", border: "1px solid #EEEEED", borderRadius: 12, overflow: "hidden" }}>
            {contacts.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#AEAEB2", fontSize: 13 }}>
                No contacts yet.{" "}
                {campaigns.length === 0 ? "Create a campaign from the Chrome Extension to get started." : ""}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #EEEEED" }}>
                    {["Username", "Campaign", "Status", "Last message", "Last reply", "Outcome"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 800, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      campaignName={
                        campaignMap.get(contact.last_campaign_id ?? "")?.name ?? "—"
                      }
                      projectId={currentProject.id}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ─── Campaign card ─── */

function CampaignCard({ campaign }: { campaign: DmCampaignDTO }) {
  const statusColor = {
    active: "#16A34A",
    paused: "#E07000",
    draft: "#AEAEB2",
    completed: "#6B6B6E",
    failed: "#DC2626",
  }[campaign.status] ?? "#AEAEB2";

  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #EEEEED",
      borderRadius: 10,
      padding: "12px 14px",
      transition: "border-color 150ms ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{campaign.name}</p>
        <span style={{ fontSize: 9, fontWeight: 800, color: statusColor, textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
          {campaign.status}
        </span>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#8E8E93" }}>
        <span>{campaign.sent_count} sent</span>
        <span>{campaign.reply_count} replies</span>
        <span style={{ marginLeft: "auto", textTransform: "capitalize" }}>{campaign.type}</span>
      </div>
    </div>
  );
}

/* ─── Contact row ─── */

const TERMINAL_STATUSES: DmContactStatus[] = ["won", "lost"];

function ContactRow({
  contact,
  campaignName,
  projectId,
}: {
  contact: DmContactDTO;
  campaignName: string;
  projectId: string;
}) {
  const transitions = getOutcomeTransitions(contact.status);
  const isTerminal = TERMINAL_STATUSES.includes(contact.status);

  return (
    <tr style={{ borderBottom: "1px solid #F5F5F3" }}>
      <td style={{ padding: "10px 16px" }}>
        <a
          href={`https://reddit.com/user/${contact.reddit_username}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 13, fontWeight: 600, color: "#E07000", textDecoration: "none" }}
        >
          u/{contact.reddit_username}
        </a>
      </td>
      <td style={{ padding: "10px 16px", fontSize: 12, color: "#6B6B6E" }}>{campaignName}</td>
      <td style={{ padding: "10px 16px" }}>
        <StatusBadge status={contact.status} />
      </td>
      <td style={{ padding: "10px 16px", fontSize: 12, color: "#8E8E93" }}>
        {contact.last_message_at ? formatRelativeTime(contact.last_message_at) : "—"}
      </td>
      <td style={{ padding: "10px 16px", fontSize: 12, color: "#8E8E93" }}>
        {contact.last_reply_at ? formatRelativeTime(contact.last_reply_at) : "—"}
      </td>
      <td style={{ padding: "10px 16px" }}>
        {isTerminal ? (
          <StatusBadge status={contact.status} />
        ) : transitions.length > 0 ? (
          <div style={{ display: "flex", gap: 6 }}>
            {transitions.map((next) => (
              <form key={next} action={updateContactStatusFromForm}>
                <input type="hidden" name="contactId" value={contact.id} />
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="status" value={next} />
                <button
                  type="submit"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 6,
                    border: "1px solid",
                    cursor: "pointer",
                    background: "none",
                    ...(next === "won"
                      ? { color: "#16A34A", borderColor: "#BBF7D0" }
                      : next === "interested"
                        ? { color: "#7C3AED", borderColor: "#DDD6FE" }
                        : { color: "#DC2626", borderColor: "#FECACA" }),
                  }}
                >
                  {capitalize(next)}
                </button>
              </form>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: "#D1D1D6" }}>—</span>
        )}
      </td>
    </tr>
  );
}

/* ─── Helpers ─── */

function OverviewMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 26, color }}>{value}</div>
    </div>
  );
}

const STATUS_COLORS: Record<DmContactStatus, { bg: string; text: string }> = {
  queued:     { bg: "#F5F5F3", text: "#6B6B6E" },
  sent:       { bg: "#FFF4E6", text: "#E07000" },
  replied:    { bg: "#EFF6FF", text: "#2563EB" },
  interested: { bg: "#F5F3FF", text: "#7C3AED" },
  won:        { bg: "#F0FDF4", text: "#16A34A" },
  lost:       { bg: "#FFF5F5", text: "#DC2626" },
};

function StatusBadge({ status }: { status: DmContactStatus }) {
  const { bg, text } = STATUS_COLORS[status] ?? { bg: "#F5F5F3", text: "#6B6B6E" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
      background: bg, color: text, textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

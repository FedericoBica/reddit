import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { ReplyEditor } from "@/app/components/reply-editor";
import { RedditComments } from "@/app/components/reddit-comments";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getLeadById, listFreshProjectLeads, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import type { LeadDTO, LeadReplyDTO } from "@/db/schemas/domain";
import {
  generateLeadRepliesFromForm,
  updateLeadStatusFromForm,
} from "@/modules/leads/actions";
import { requireUser } from "@/modules/auth/server";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "New Opportunities",
};

const PAGE_SIZE = 10;

type OpportunitiesPageProps = {
  searchParams?: Promise<{ projectId?: string; leadId?: string; filter?: string; page?: string }>;
};

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const user = await requireUser("/opportunities");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;

  const plan = await getCurrentBillingPlan();
  const windowHours = plan.keywordSearchTimeWindow === "week" ? 168 : 24;

  const [freshLeadsRaw, allLeads] = await Promise.all([
    listFreshProjectLeads(currentProject.id, windowHours, 100),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const freshLeads = freshLeadsRaw.filter((l) => l.status !== "irrelevant");
  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;

  const requestedId = params?.leadId;
  const selectedLead = requestedId
    ? ((await getLeadById(currentProject.id, requestedId)) ?? freshLeads[0] ?? null)
    : freshLeads[0] ?? null;

  const replies = selectedLead
    ? await listLeadReplies(currentProject.id, selectedLead.id)
    : [];

  const isGenerating = selectedLead?.reply_generation_status === "generating";

  const pageFromParam = Math.max(0, parseInt(params?.page ?? "0") || 0);
  const selectedIndex = selectedLead ? freshLeads.findIndex((l) => l.id === selectedLead?.id) : -1;
  const autoPage = selectedIndex >= 0 ? Math.floor(selectedIndex / PAGE_SIZE) : 0;
  const currentPage = params?.leadId && !params?.page
    ? autoPage
    : Math.min(pageFromParam, Math.max(0, Math.ceil(freshLeads.length / PAGE_SIZE) - 1));
  const totalPages = Math.max(1, Math.ceil(freshLeads.length / PAGE_SIZE));
  const paginatedLeads = freshLeads.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const baseHref = (extra?: string) =>
    `/opportunities?projectId=${currentProject.id}${extra ?? ""}`;

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      {isGenerating && <AutoRefresh intervalMs={4000} />}

      <section className="searchbox-workspace">
        <header className="searchbox-header">
          <div>
            <h1 className="searchbox-title">
              <FlashIcon />
              New Opportunities
            </h1>
            <p className="searchbox-description">
              Reddit posts that matched your keywords —{" "}
              {windowHours >= 168 ? "last 7 days" : "last 24 hours"}.
              Replying to these posts gets your product in front of buyers actively looking for a solution.
            </p>
          </div>
        </header>

        <div className="searchbox-body">
          <section className="opportunity-column" aria-label="Fresh leads">
            <div className="opportunity-toolbar">
              <div className="opportunity-count">
                <span>{freshLeads.length} posts found</span>
              </div>
            </div>

            <div className="opportunity-list">
              {freshLeads.length > 0 ? (
                paginatedLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    active={lead.id === selectedLead?.id}
                    href={baseHref(`&leadId=${lead.id}`)}
                  />
                ))
              ) : (
                <EmptyFeed windowHours={windowHours} lastScrapedAt={currentProject.last_scraped_at} />
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ borderTop: "1px solid #F0F0EE", padding: "10px 14px", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                {currentPage > 0 ? (
                  <Link
                    href={`/opportunities?projectId=${currentProject.id}&page=${currentPage - 1}`}
                    style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textDecoration: "none", padding: "2px 8px", borderRadius: 5, border: "1px solid #E07000" }}
                  >
                    ←
                  </Link>
                ) : <span style={{ width: 30 }} />}
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6E" }}>{currentPage + 1} / {totalPages}</span>
                {currentPage < totalPages - 1 ? (
                  <Link
                    href={`/opportunities?projectId=${currentProject.id}&page=${currentPage + 1}`}
                    style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textDecoration: "none", padding: "2px 8px", borderRadius: 5, border: "1px solid #E07000" }}
                  >
                    →
                  </Link>
                ) : <span style={{ width: 30 }} />}
              </div>
            )}
          </section>

          <LeadDetail
            lead={selectedLead}
            replies={replies}
            projectId={currentProject.id}
          />
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Lead card ─────────────────────────────────────────────────

function LeadCard({
  lead,
  active,
  href,
}: {
  lead: LeadDTO;
  active: boolean;
  href: string;
}) {
  const ageMs = lead.created_at ? Number(new Date()) - new Date(lead.created_at).getTime() : null;
  const ageMinutes = ageMs !== null ? Math.floor(ageMs / 60_000) : null;

  return (
    <Link href={href} className={`opportunity-card${active ? " opportunity-card-active" : ""}`}>
      <div className="opportunity-meta">
        <span
          className="opportunity-dot"
          style={{
            background:
              lead.status === "new" ? "#E07000" :
              lead.status === "replied" ? "#16A34A" : "#AEAEB2",
          }}
        />
        <span>r/{lead.subreddit}</span>
        {ageMinutes !== null && <span>{formatAge(ageMinutes)}</span>}
        {lead.num_comments != null && <span>{lead.num_comments} comments</span>}
      </div>

      <h2 className="opportunity-heading">{lead.title}</h2>

      {lead.classification_reason && (
        <div style={{ marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A" }}>
            Relevance: {lead.intent_score ?? "–"}
          </span>
          <p style={{ fontSize: 11, color: "#16A34A", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
            {lead.classification_reason.slice(0, 120)}
          </p>
        </div>
      )}

      {(lead.status !== "new" || (lead.score ?? 0) > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {lead.status !== "new" ? <StatusPill status={lead.status} /> : <span />}
          {(lead.score ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>▲ {lead.score}</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Lead detail pane ──────────────────────────────────────────

function LeadDetail({
  lead,
  replies,
  projectId,
}: {
  lead: LeadDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
}) {
  if (!lead) {
    return (
      <section className="detail-pane">
        <div className="detail-content">
          <div className="empty-state">
            <p className="section-title">No leads yet</p>
            <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
              Posts that match your keywords will appear here. The scraper runs automatically.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isGenerating = lead.reply_generation_status === "generating";
  const hasFailed = lead.reply_generation_error;
  const returnTo = `/opportunities?projectId=${projectId}&leadId=${lead.id}`;
  const redditUrl = toRedditUrl(lead.permalink);

  return (
    <section className="detail-pane" aria-label="Lead detail">
      {/* Topbar */}
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" style={{
            background: lead.status === "new" ? "#E07000" : lead.status === "replied" ? "#16A34A" : "#AEAEB2",
          }} />
          <span>r/{lead.subreddit}</span>
          {lead.created_utc && <span>{formatDate(lead.created_utc)}</span>}
          {lead.author && <span>u/{lead.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="irrelevant" />
            <input type="hidden" name="returnTo" value={`/opportunities?projectId=${projectId}`} />
            <button className="btn-reject" type="submit">Reject Post</button>
          </form>
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="btn-replied" type="submit">
              <CheckIcon />
              Mark as Replied
            </button>
          </form>
        </div>
      </div>

      {/* Detail content */}
      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 900, color: "#1C1C1E" }}>
          {lead.title}
        </h2>

        {lead.keywords_matched?.length > 0 && (
          <p style={{ fontSize: 11, color: "#6B6B6E", fontWeight: 700, marginTop: 10 }}>
            Keywords: {lead.keywords_matched.slice(0, 3).join(", ")}{lead.keywords_matched.length > 3 ? ` +${lead.keywords_matched.length - 3}` : ""}
          </p>
        )}
      </div>

      {/* Post body */}
      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {lead.body?.trim() || "No body available. Open the post on Reddit to see the full context."}
        </p>

        <RedditComments permalink={lead.permalink} />

        <div className="post-stats-bar">
          {(lead.score ?? 0) > 0 && <span>▲ {lead.score} upvotes</span>}
          {lead.num_comments != null && <span>💬 {lead.num_comments} comments</span>}
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            View Post on Reddit →
          </a>
        </div>
      </article>

      {/* Reply section */}
      <div className="lead-comment-box">
        <p className="section-title" style={{ fontSize: 14, marginBottom: 12 }}>Write a comment:</p>

        {hasFailed && (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#991B1B", fontSize: 12, marginBottom: 12 }}>
            {hasFailed}
          </div>
        )}

        {isGenerating ? (
          <div style={{ padding: "14px 0", color: "#6B6B6E", fontSize: 13, fontWeight: 600 }}>
            Generating replies…
          </div>
        ) : (
          <ReplyEditor
            replies={replies}
            permalink={lead.permalink}
            projectId={projectId}
            leadId={lead.id}
            returnTo={returnTo}
            generateForm={
              <form action={generateLeadRepliesFromForm}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button
                  className="h-8 rounded-[8px] px-3 font-extrabold text-xs"
                  variant={replies.length > 0 ? "outline" : "default"}
                  style={replies.length === 0 ? { background: "#E07000" } : undefined}
                  type="submit"
                >
                  {replies.length > 0 ? "Regenerate" : "Generate Reply Suggestions"}
                </Button>
              </form>
            }
          />
        )}
      </div>
    </section>
  );
}


function StatusPill({ status }: { status: LeadDTO["status"] }) {
  const styles: Record<string, { bg: string; color: string }> = {
    new:        { bg: "#FFF3E8", color: "#C96500" },
    replied:    { bg: "#F0FDF4", color: "#15803D" },
    irrelevant: { bg: "#F5F5F3", color: "#8E8E93" },
  };
  const s = styles[status] ?? styles.irrelevant;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {status === "new" ? "New" : status === "replied" ? "Replied" : "Irrelevant"}
    </span>
  );
}

function EmptyFeed({ windowHours, lastScrapedAt }: { windowHours: number; lastScrapedAt: string | null }) {
  return (
    <div className="empty-state">
      <p className="section-title">No fresh posts</p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        No leads in {windowHours >= 168 ? "the last 7 days" : "the last 24 hours"}.{" "}
        {lastScrapedAt ? `Last scan ${formatDate(lastScrapedAt)}.` : "Scraper hasn't run yet."}
      </p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatAge(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { ReplyEditor } from "@/app/components/reply-editor";
import { RedditComments } from "@/app/components/reddit-comments";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listSearchboxResults, getSearchboxResult } from "@/db/queries/searchbox";
import type { SearchboxResultDTO, LeadReplyDTO, LeadDTO } from "@/db/schemas/domain";
import { generateSearchboxReplyFromForm, updateSearchboxStatusFromForm } from "@/modules/searchbox/actions";
import { requireUser } from "@/modules/auth/server";
import { isCurrentUserAdmin } from "@/modules/auth/admin";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";
import { KeywordsPillCollapsible } from "./keywords-pill-collapsible";

export const metadata: Metadata = { title: "Searchbox" };

const PAGE_SIZE = 10;

type SearchboxPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    resultId?: string;
    filter?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function SearchboxPage({ searchParams }: SearchboxPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    if (await isCurrentUserAdmin()) redirect("/admin");
    redirect("/signup/company");
  }

  const { currentProject } = projectState;

  const sort = params?.sort === "recent" ? "recent" : "relevance";

  const [allResults, allLeads] = await Promise.all([
    listSearchboxResults({ projectId: currentProject.id, sort, limit: 60 }),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const displayResults = allResults.filter((r) => r.status !== "dismissed");
  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;
  const newResultsCount = displayResults.filter((r) => r.status === "new").length;

  const requestedId = params?.resultId;
  const selectedResult = requestedId
    ? (await getSearchboxResult(currentProject.id, requestedId)) ?? displayResults[0] ?? null
    : displayResults[0] ?? null;

  const pageFromParam = Math.max(0, parseInt(params?.page ?? "0") || 0);
  const selectedIndex = selectedResult ? displayResults.findIndex((r) => r.id === selectedResult?.id) : -1;
  const autoPage = selectedIndex >= 0 ? Math.floor(selectedIndex / PAGE_SIZE) : 0;
  const currentPage = params?.resultId && !params?.page
    ? autoPage
    : Math.min(pageFromParam, Math.max(0, Math.ceil(displayResults.length / PAGE_SIZE) - 1));
  const totalPages = Math.max(1, Math.ceil(displayResults.length / PAGE_SIZE));
  const paginatedResults = displayResults.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  let selectedLead: LeadDTO | null = null;
  let replies: LeadReplyDTO[] = [];

  if (selectedResult?.lead_id) {
    [selectedLead, replies] = await Promise.all([
      getLeadById(currentProject.id, selectedResult.lead_id),
      listLeadReplies(currentProject.id, selectedResult.lead_id),
    ]);
  }

  const isGenerating = selectedLead?.reply_generation_status === "generating";
  const isNew = !currentProject.last_searchbox_at;

  const baseHref = (extra?: string) =>
    `/dashboard?projectId=${currentProject.id}${sort === "recent" ? "&sort=recent" : ""}${extra ?? ""}`;

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
      newSearchboxCount={newResultsCount}
    >
      {(isGenerating || isNew) && <AutoRefresh intervalMs={isNew ? 15000 : 4000} />}

      <section className="searchbox-workspace">
        <header className="searchbox-header">
          <div>
            <h1 className="searchbox-title">
              <SearchIcon />
              Searchbox
            </h1>
            <p className="searchbox-description">
              Reddit posts ranking on Google for your keywords. These have the highest intent —
              Google already validated them. Replying puts your product in front of buyers searching right now.
            </p>
          </div>
        </header>

        <div className="searchbox-body">
          <section className="opportunity-column" aria-label="Searchbox results">
            <div className="opportunity-toolbar">
              <div className="opportunity-count">
                <span>{displayResults.length} posts found</span>
                <Link
                  href={`/dashboard?projectId=${currentProject.id}&sort=${sort === "recent" ? "relevance" : "recent"}`}
                  style={{ color: "#E07000", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                >
                  {sort === "recent" ? "Sort by Intent" : "Sort by Recent"}
                </Link>
              </div>
            </div>

            <div className="opportunity-list">
              {allResults.length > 0 ? (
                paginatedResults.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    active={result.id === selectedResult?.id}
                    baseHref={baseHref(`&resultId=${result.id}`)}
                  />
                ))
              ) : (
                <EmptyState isNew={isNew} />
              )}
            </div>

            {totalPages > 1 && (
              <div style={{ borderTop: "1px solid #F0F0EE", padding: "10px 14px", display: "flex", justifyContent: "center", alignItems: "center", gap: 10 }}>
                {currentPage > 0 ? (
                  <Link
                    href={`/dashboard?projectId=${currentProject.id}${sort === "recent" ? "&sort=recent" : ""}&page=${currentPage - 1}`}
                    style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textDecoration: "none", padding: "2px 8px", borderRadius: 5, border: "1px solid #E07000" }}
                  >
                    ←
                  </Link>
                ) : <span style={{ width: 30 }} />}
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B6E" }}>{currentPage + 1} / {totalPages}</span>
                {currentPage < totalPages - 1 ? (
                  <Link
                    href={`/dashboard?projectId=${currentProject.id}${sort === "recent" ? "&sort=recent" : ""}&page=${currentPage + 1}`}
                    style={{ fontSize: 11, fontWeight: 800, color: "#E07000", textDecoration: "none", padding: "2px 8px", borderRadius: 5, border: "1px solid #E07000" }}
                  >
                    →
                  </Link>
                ) : <span style={{ width: 30 }} />}
              </div>
            )}
          </section>

          <ResultDetail
            result={selectedResult}
            lead={selectedLead}
            replies={replies}
            projectId={currentProject.id}
            isNew={isNew}
          />
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Result card ───────────────────────────────────────────────

function ResultCard({
  result,
  active,
  baseHref,
}: {
  result: SearchboxResultDTO;
  active: boolean;
  baseHref: string;
}) {
  return (
    <Link href={baseHref} className={`opportunity-card${active ? " opportunity-card-active" : ""}`}>
      <div className="opportunity-meta">
        <span
          className="opportunity-dot"
          style={{
            background: result.status === "new" ? "#E07000" : result.status === "replied" ? "#16A34A" : "#AEAEB2",
          }}
        />
        <span>r/{result.subreddit}</span>
        <span>{formatRelative(result.created_at)}</span>
        {result.reddit_num_comments !== null && <span>{result.reddit_num_comments} comments</span>}
        <span style={{ display: "inline-flex", padding: "1px 6px", borderRadius: 5, fontSize: 9, fontWeight: 800, background: "#EEF2FF", color: "#4338CA" }}>
          Google #{result.google_rank}
        </span>
      </div>

      <h2 className="opportunity-heading">{result.title}</h2>

      {result.classification_reason && (
        <div>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#16A34A" }}>
            Relevance: {result.intent_score ?? "–"}
          </span>
          <p style={{ fontSize: 11, color: "#16A34A", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
            {result.classification_reason.slice(0, 120)}
          </p>
        </div>
      )}

      {(result.status !== "new" || result.reddit_score !== null) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {result.status !== "new" ? <StatusPill status={result.status} /> : <span />}
          {result.reddit_score !== null && (
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>▲ {result.reddit_score}</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Result detail ─────────────────────────────────────────────

function ResultDetail({
  result,
  lead,
  replies,
  projectId,
  isNew,
}: {
  result: SearchboxResultDTO | null;
  lead: LeadDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
  isNew?: boolean;
}) {
  if (!result) {
    return (
      <section className="detail-pane">
        <div className="detail-content">
          <EmptyState isNew={isNew} />
        </div>
      </section>
    );
  }

  const isGenerating = lead?.reply_generation_status === "generating";
  const hasFailed = lead?.reply_generation_error;
  const returnTo = `/dashboard?projectId=${projectId}&resultId=${result.id}`;
  const redditUrl = toRedditUrl(result.permalink);

  return (
    <section className="detail-pane" aria-label="Detalle del resultado">
      {/* Topbar */}
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" style={{
            background: result.status === "new" ? "#E07000" : result.status === "replied" ? "#16A34A" : "#AEAEB2",
          }} />
          <span>r/{result.subreddit}</span>
          {result.reddit_created_utc && <span>{formatDate(result.reddit_created_utc)}</span>}
          {result.author && <span>u/{result.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <form action={updateSearchboxStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="resultId" value={result.id} />
            <input type="hidden" name="status" value="dismissed" />
            <input type="hidden" name="returnTo" value={`/dashboard?projectId=${projectId}`} />
            <button className="btn-reject" type="submit">Reject Post</button>
          </form>
          <form action={updateSearchboxStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="resultId" value={result.id} />
            <input type="hidden" name="status" value="replied" />
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
          {result.title}
        </h2>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, background: "#EEF2FF", color: "#4338CA" }}>
            Google #{result.google_rank}
          </span>
          <KeywordsPill keywords={result.google_keywords?.length ? result.google_keywords : [result.google_keyword]} expanded />
        </div>
      </div>

      {/* Post body */}
      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {result.body?.trim() || "No body available. Open the post on Reddit to see the full context."}
        </p>

        <RedditComments permalink={result.permalink} />

        <div className="post-stats-bar">
          {result.reddit_score !== null && <span>▲ {result.reddit_score} upvotes</span>}
          {result.reddit_num_comments !== null && <span>💬 {result.reddit_num_comments} comments</span>}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#4338CA", background: "#EEF2FF", padding: "2px 8px", borderRadius: 6 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Visible in Google Search
          </span>
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
            permalink={result.permalink}
            projectId={projectId}
            leadId={lead?.id ?? ""}
            returnTo={returnTo}
            generateForm={
              <form action={generateSearchboxReplyFromForm}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="resultId" value={result.id} />
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

// ── Shared small components ───────────────────────────────────

function KeywordsPill({ keywords, expanded = false }: { keywords: string[]; expanded?: boolean }) {
  if (!keywords.length) return null;

  if (expanded) {
    return (
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
        {keywords.map((kw) => (
          <span key={kw} style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: "#F5F5F3", color: "#6B6B6E" }}>
            {kw}
          </span>
        ))}
      </div>
    );
  }

  return <KeywordsPillCollapsible keywords={keywords} />;
}

function StatusPill({ status }: { status: SearchboxResultDTO["status"] }) {
  const styles = {
    new:       { bg: "#FFF3E8", color: "#C96500" },
    replied:   { bg: "#F0FDF4", color: "#15803D" },
    dismissed: { bg: "#F5F5F3", color: "#8E8E93" },
  };
  const s = styles[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {status === "new" ? "New" : status === "replied" ? "Replied" : "Dismissed"}
    </span>
  );
}

function EmptyState({ isNew }: { isNew?: boolean }) {
  if (isNew) {
    return (
      <div className="empty-state">
        <p className="section-title" style={{ fontSize: 15 }}>Scanning Reddit now…</p>
        <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
          We're finding posts with buyer intent for your keywords. Results appear in a few minutes — refresh shortly.
        </p>
      </div>
    );
  }
  return (
    <div className="empty-state">
      <p className="section-title">No results yet</p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        Searchbox finds Reddit posts ranking on Google for your keywords. It refreshes every 2 weeks.
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

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

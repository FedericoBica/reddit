import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { ReplyEditor } from "@/app/components/reply-editor";
import { RedditComments } from "@/app/components/reddit-comments";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listSearchboxResults, getSearchboxResult } from "@/db/queries/searchbox";
import type { SearchboxResultDTO, LeadReplyDTO, LeadDTO } from "@/db/schemas/domain";
import { generateSearchboxReplyFromForm, updateSearchboxStatusFromForm } from "@/modules/searchbox/actions";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "Searchbox" };

type SearchboxPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    resultId?: string;
    filter?: string;
    sort?: string;
  }>;
};

export default async function SearchboxPage({ searchParams }: SearchboxPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/signup/company");

  const { currentProject, projects } = projectState;

  const activeFilter = parseFilter(params?.filter);
  const sort = params?.sort === "recent" ? "recent" : "relevance";

  const statusFilter =
    activeFilter === "high_intent" || activeFilter === undefined
      ? undefined
      : activeFilter;

  const [allResults, allLeads] = await Promise.all([
    listSearchboxResults({ projectId: currentProject.id, sort, limit: 60 }),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const results =
    activeFilter === "high_intent"
      ? allResults.filter((r) => (r.intent_score ?? 0) >= 70)
      : statusFilter
        ? allResults.filter((r) => r.status === statusFilter)
        : allResults;

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;
  const newResultsCount = allResults.filter((r) => r.status === "new").length;
  const highIntentCount = allResults.filter((r) => (r.intent_score ?? 0) >= 70).length;

  const requestedId = params?.resultId;
  const selectedResult = requestedId
    ? (await getSearchboxResult(currentProject.id, requestedId)) ?? results[0] ?? null
    : results[0] ?? null;

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

  const FILTERS = [
    { label: "All", value: undefined },
    { label: "High Intent", value: "high_intent" },
    { label: "New", value: "new" },
    { label: "Replied", value: "replied" },
    { label: "Dismissed", value: "dismissed" },
  ] as const;

  const baseHref = (extra?: string) =>
    `/dashboard?projectId=${currentProject.id}${activeFilter ? `&filter=${activeFilter}` : ""}${sort === "recent" ? "&sort=recent" : ""}${extra ?? ""}`;

  return (
    <DashboardShell
      user={user}
      projects={projects}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {highIntentCount > 0 && (
              <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
                {highIntentCount} high intent
              </Badge>
            )}
            {newResultsCount > 0 && (
              <Badge variant="outline" className="rounded-[7px] font-extrabold text-[#6B6B6E]">
                {newResultsCount} new
              </Badge>
            )}
          </div>
        </header>

        <div className="searchbox-body">
          <section className="opportunity-column" aria-label="Searchbox results">
            <div className="opportunity-toolbar">
              <div className="filter-row" style={{ marginBottom: 0 }}>
                {FILTERS.map((f) => {
                  const isActive = activeFilter === f.value || (!activeFilter && !f.value);
                  const href = f.value
                    ? `/dashboard?projectId=${currentProject.id}&filter=${f.value}${sort === "recent" ? "&sort=recent" : ""}`
                    : `/dashboard?projectId=${currentProject.id}${sort === "recent" ? "&sort=recent" : ""}`;
                  return (
                    <Link key={f.label} href={href} className={`filter-pill${isActive ? " filter-pill-active" : ""}`}>
                      {f.label}
                    </Link>
                  );
                })}
              </div>
              <div className="opportunity-count">
                <span>{results.length} posts found</span>
                <Link
                  href={`/dashboard?projectId=${currentProject.id}${activeFilter ? `&filter=${activeFilter}` : ""}&sort=${sort === "recent" ? "relevance" : "recent"}`}
                  style={{ color: "#E07000", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                >
                  {sort === "recent" ? "Sort by Intent" : "Sort by Recent"}
                </Link>
              </div>
            </div>

            <div className="opportunity-list">
              {results.length > 0 ? (
                results.map((result) => (
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

            <div style={{ borderTop: "1px solid #F0F0EE", padding: "10px 14px", color: "#AEAEB2", fontSize: 11, fontWeight: 700 }}>
              {currentProject.last_searchbox_at
                ? `Last scan ${formatDate(currentProject.last_searchbox_at)}`
                : "Scan pending — runs every 2 weeks"}
            </div>
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
  const postUrl = `https://reddit.com${result.permalink}`;
  const truncatedUrl = postUrl.length > 52 ? postUrl.slice(0, 49) + "…" : postUrl;

  return (
    <Link href={baseHref} className={`opportunity-card${active ? " opportunity-card-active" : ""}`}>
      <div className="opportunity-meta" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            className="opportunity-dot"
            style={{
              background: result.status === "new" ? "#E07000" : result.status === "replied" ? "#16A34A" : "#AEAEB2",
            }}
          />
          <span>r/{result.subreddit}</span>
          <span>{formatRelative(result.created_at)}</span>
          {result.reddit_num_comments !== null && <span>{result.reddit_num_comments} comments</span>}
        </div>
        <ScorePill score={result.intent_score} />
      </div>

      <h2 className="opportunity-heading">{result.title}</h2>

      <p style={{ fontSize: 10, color: "#AEAEB2", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {truncatedUrl}
      </p>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: "#EEF2FF", color: "#4338CA" }}>
          Google #{result.google_rank}
        </span>
        <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, background: "#F5F5F3", color: "#6B6B6E" }}>
          {result.google_keyword}
        </span>
      </div>

      {result.classification_reason && (
        <p className="opportunity-reason">
          {result.classification_reason.slice(0, 110)}
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
        <StatusPill status={result.status} />
        {result.reddit_score !== null && (
          <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>▲ {result.reddit_score}</span>
        )}
      </div>
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
  const redditUrl = `https://reddit.com${result.permalink}`;

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
          <span className="intent-badge" style={{
            background: (result.intent_score ?? 0) >= 80 ? "#E07000" : (result.intent_score ?? 0) >= 60 ? "#FF9F40" : "#E5E5EA",
            color: (result.intent_score ?? 0) >= 60 ? "#FFF" : "#6B6B6E",
          }}>
            🎯 Intent Score: {result.intent_score ?? "–"}
          </span>
          <span style={{ display: "inline-flex", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 800, background: "#EEF2FF", color: "#4338CA" }}>
            Google #{result.google_rank} · {result.google_keyword}
          </span>
        </div>

        {result.classification_reason && (
          <p style={{ fontSize: 13, color: "#6B6B6E", lineHeight: 1.5, marginTop: 14, padding: "10px 14px", background: "#F5F5F3", borderRadius: 8 }}>
            {result.classification_reason}
          </p>
        )}
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

function ScorePill({ score }: { score: number | null }) {
  const val = score ?? 0;
  let bg = "#E5E5EA", color = "#8E8E93";
  if (val >= 80) { bg = "#E07000"; color = "#FFF"; }
  else if (val >= 60) { bg = "#FF9F40"; color = "#FFF"; }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, padding: "3px 10px", borderRadius: 7, fontSize: 12, fontWeight: 900, background: bg, color }}>
      {score ?? "–"}
    </span>
  );
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

function parseFilter(f?: string): "high_intent" | SearchboxResultDTO["status"] | undefined {
  if (f === "high_intent") return "high_intent";
  if (f === "new" || f === "replied" || f === "dismissed") return f;
  return undefined;
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

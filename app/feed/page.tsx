import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { KeywordsDropdown } from "@/app/components/keywords-dropdown";
import { ReplyEditor } from "@/app/components/reply-editor";
import { RedditComments } from "@/app/components/reddit-comments";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { ReadMarker } from "@/app/components/read-marker";
import { MentionReplyGenerator } from "@/app/mentions/mention-reply-generator";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listBrandMentions } from "@/db/queries/brand-mentions";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listProjectKeywords } from "@/db/queries/settings";
import { listProjectXPosts } from "@/db/queries/x";
import type { BrandMentionDTO, BrandMentionSentiment, KeywordDTO, LeadDTO, LeadReplyDTO, XPostDTO } from "@/db/schemas/domain";
import { generateLeadRepliesFromForm, updateLeadStatusFromForm } from "@/modules/leads/actions";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Leads" };

const PAGE_SIZE = 10;

type FeedType = "all" | "opportunities" | "mentions" | "x";

type FeedItem =
  | { kind: "opportunity"; data: LeadDTO; sortKey: number }
  | { kind: "mention"; data: BrandMentionDTO; sortKey: number };

type FeedPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    type?: string;
    itemId?: string;
    itemType?: string;
    page?: string;
    // mention-specific filters
    target?: string;
    sentiment?: string;
    sort?: string;
  }>;
};

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireUser("/feed");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;

  const rawFeedType = parseFeedType(params?.type);

  const [allLeads, allMentionsRaw, keywords, allXPosts] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
    listBrandMentions({ projectId: currentProject.id }),
    listProjectKeywords(currentProject.id),
    listProjectXPosts(currentProject.id),
  ]);

  const feedLeads = allLeads.filter((l) => l.status !== "irrelevant");
  const competitors = keywords.filter((k) => k.type === "competitor" && k.is_active);
  const xPosts = allXPosts.filter((p) => p.status !== "irrelevant");

  const feedType = rawFeedType;

  // Mention-specific filters — only applied when type=mentions
  const selectedTarget =
    feedType === "mentions"
      ? resolveTarget(params?.target, currentProject.name, competitors)
      : "all";
  const selectedSentiment =
    feedType === "mentions" ? parseSentiment(params?.sentiment) : "all";
  const selectedSort =
    feedType === "mentions" ? (params?.sort === "recent" ? "recent" : "relevant") : "recent";

  const visibleMentions =
    feedType === "mentions"
      ? sortMentions(
          filterBySentiment(
            filterByTarget(allMentionsRaw, selectedTarget, currentProject.name),
            selectedSentiment,
          ),
          selectedSort,
        )
      : allMentionsRaw;

  const sentimentStats = computeSentimentStats(
    filterByTarget(allMentionsRaw, selectedTarget, currentProject.name),
  );

  // Build combined feed
  const allItems: FeedItem[] = [
    ...feedLeads.map((lead): FeedItem => ({
      kind: "opportunity",
      data: lead,
      sortKey: lead.created_at ? new Date(lead.created_at).getTime() : 0,
    })),
    ...visibleMentions.map((mention): FeedItem => ({
      kind: "mention",
      data: mention,
      sortKey: mention.created_at ? new Date(mention.created_at).getTime() : 0,
    })),
  ];

  const filteredItems = filterByType(allItems, feedType);
  const sortedItems =
    feedType === "mentions"
      ? filteredItems
      : [...filteredItems].sort((a, b) => b.sortKey - a.sortKey);

  // X tab: separate sorted list
  const sortedXPosts = feedType === "x"
    ? [...xPosts].sort((a, b) => (b.intent_score ?? 0) - (a.intent_score ?? 0))
    : [];

  // Resolve selected item
  const requestedId = params?.itemId;
  const requestedKind =
    params?.itemType === "mention" ? "mention" : "opportunity";

  const selectedXPost: XPostDTO | null = feedType === "x"
    ? (requestedId ? (sortedXPosts.find((p) => p.id === requestedId) ?? sortedXPosts[0] ?? null) : sortedXPosts[0] ?? null)
    : null;

  const selectedFromList: FeedItem | null = feedType !== "x"
    ? (requestedId
        ? (sortedItems.find((item) => item.data.id === requestedId && item.kind === requestedKind) ?? sortedItems[0] ?? null)
        : sortedItems[0] ?? null)
    : null;

  const selectedLead: LeadDTO | null =
    selectedFromList?.kind === "opportunity"
      ? ((await getLeadById(currentProject.id, selectedFromList.data.id)) ?? selectedFromList.data)
      : null;

  const selectedMention: BrandMentionDTO | null =
    selectedFromList?.kind === "mention" ? selectedFromList.data : null;

  const replies: LeadReplyDTO[] = selectedLead
    ? await listLeadReplies(currentProject.id, selectedLead.id)
    : [];

  const isGenerating = selectedLead?.reply_generation_status === "generating";

  // Pagination
  const pageFromParam = Math.max(0, parseInt(params?.page ?? "0") || 0);
  const activeList = feedType === "x" ? sortedXPosts : sortedItems;
  const selectedIndex = feedType === "x"
    ? (selectedXPost ? sortedXPosts.findIndex((p) => p.id === selectedXPost.id) : -1)
    : (selectedFromList ? sortedItems.findIndex((item) => item.data.id === selectedFromList.data.id && item.kind === selectedFromList.kind) : -1);
  const autoPage = selectedIndex >= 0 ? Math.floor(selectedIndex / PAGE_SIZE) : 0;
  const currentPage =
    params?.itemId && !params?.page
      ? autoPage
      : Math.min(pageFromParam, Math.max(0, Math.ceil(activeList.length / PAGE_SIZE) - 1));
  const totalPages = Math.max(1, Math.ceil(activeList.length / PAGE_SIZE));
  const paginatedItems = feedType !== "x"
    ? sortedItems.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : [];
  const paginatedXPosts = feedType === "x"
    ? sortedXPosts.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
    : [];

  // Shared href builder — preserves all active filter state
  const filterBase = buildFilterBase({
    projectId: currentProject.id,
    feedType,
    target: selectedTarget,
    sentiment: selectedSentiment,
    sort: selectedSort,
  });
  const baseHref = (extra?: string) => `/feed?${filterBase}${extra ?? ""}`;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      {isGenerating && <AutoRefresh intervalMs={4000} />}

      <section className="searchbox-workspace">
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <div className="ds-topbar-icon">✦</div>
            <div className="ds-topbar-titles">
              <h1 className="ds-topbar-title"><em>Leads</em></h1>
              <div className="ds-topbar-sub">
                <span><strong>{feedType === "x" ? xPosts.length : sortedItems.length}</strong> posts</span>
                <span className="ds-topbar-sep">·</span>
                <span>
                  {feedType === "all"
                    ? `${feedLeads.length} opportunities · ${allMentionsRaw.length} mentions`
                    : feedType === "opportunities"
                    ? `${feedLeads.length} leads`
                    : feedType === "x"
                    ? `${xPosts.length} X leads`
                    : "brand + competitors"}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="searchbox-body">
          {/* gridTemplateRows overrides opportunity-column's default "1fr auto" so the
              header wrapper stays auto-height and only the list takes the remaining space */}
          <section
            className="opportunity-column"
            style={{ gridTemplateRows: "auto 1fr auto" }}
            aria-label="Leads feed"
          >
            {/* Header: type pills + optional mention triage controls — always auto-height */}
            <div style={{ background: "#F6F7F8", borderBottom: "1px solid #DAE0E6" }}>
              {/* Type pills */}
              <div
                style={{
                  padding: "10px 10px 8px",
                  borderBottom: feedType === "mentions" ? "1px solid #E5E7EB" : "none",
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                {(["all", "opportunities", "mentions", "x"] as const).map((type) => {
                  const active = feedType === type;
                  const count =
                    type === "all"
                      ? feedLeads.length + allMentionsRaw.length
                      : type === "opportunities"
                      ? feedLeads.length
                      : type === "mentions"
                      ? allMentionsRaw.length
                      : xPosts.length;
                  const href = `/feed?projectId=${currentProject.id}${type !== "all" ? `&type=${type}` : ""}`;
                  const label = type === "all" ? "All" : type === "opportunities" ? "Opportunities" : type === "mentions" ? "Mentions" : "X";
                  return (
                    <Link
                      key={type}
                      href={href}
                      className={`filter-pill${active ? " filter-pill-active" : ""}`}
                    >
                      {label}
                      {" "}
                      <span style={{ fontWeight: 700, opacity: 0.7 }}>({count})</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mention triage controls — only when type=mentions */}
              {feedType === "mentions" && (
                <div style={{ padding: "8px 10px 10px", display: "grid", gap: 10 }}>
                  <TargetDropdown
                    projectId={currentProject.id}
                    companyName={currentProject.name}
                    competitors={competitors}
                    selectedTarget={selectedTarget}
                    sentiment={selectedSentiment}
                    sort={selectedSort}
                    selectedItemId={selectedFromList?.kind === "mention" ? selectedFromList.data.id : undefined}
                  />
                  <SentimentBar
                    projectId={currentProject.id}
                    target={selectedTarget}
                    selectedSentiment={selectedSentiment}
                    selectedSort={selectedSort}
                    stats={sentimentStats}
                  />
                  <SortControl
                    projectId={currentProject.id}
                    target={selectedTarget}
                    sentiment={selectedSentiment}
                    selectedSort={selectedSort}
                  />
                </div>
              )}
            </div>

            <div className="opportunity-list">
              {feedType === "x" ? (
                paginatedXPosts.length === 0 ? (
                  <EmptyFeed feedType={feedType} lastScrapedAt={currentProject.last_scraped_at} projectId={currentProject.id} />
                ) : (
                  paginatedXPosts.map((post) => (
                    <XPostCard
                      key={post.id}
                      post={post}
                      active={selectedXPost?.id === post.id}
                      href={`/feed?projectId=${currentProject.id}&type=x&itemId=${post.id}`}
                    />
                  ))
                )
              ) : paginatedItems.length === 0 ? (
                <EmptyFeed feedType={feedType} lastScrapedAt={currentProject.last_scraped_at} projectId={currentProject.id} />
              ) : (
                paginatedItems.map((item) =>
                  item.kind === "opportunity" ? (
                    <LeadCard
                      key={`opp-${item.data.id}`}
                      lead={item.data}
                      active={
                        selectedFromList?.kind === "opportunity" &&
                        selectedFromList.data.id === item.data.id
                      }
                      href={baseHref(`&itemId=${item.data.id}&itemType=opportunity`)}
                    />
                  ) : (
                    <MentionCard
                      key={`mention-${item.data.id}`}
                      mention={item.data}
                      active={
                        selectedFromList?.kind === "mention" &&
                        selectedFromList.data.id === item.data.id
                      }
                      href={baseHref(`&itemId=${item.data.id}&itemType=mention`)}
                    />
                  ),
                )
              )}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  borderTop: "1px solid #DAE0E6",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {currentPage > 0 ? (
                  <Link
                    href={`/feed?${filterBase}&page=${currentPage - 1}`}
                    style={{ fontSize: 11, fontWeight: 700, color: "#FF4500", textDecoration: "none", padding: "2px 8px", borderRadius: 99, border: "1px solid #FF4500" }}
                  >
                    ←
                  </Link>
                ) : (
                  <span style={{ width: 30 }} />
                )}
                <span style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83" }}>
                  {currentPage + 1} / {totalPages}
                </span>
                {currentPage < totalPages - 1 ? (
                  <Link
                    href={`/feed?${filterBase}&page=${currentPage + 1}`}
                    style={{ fontSize: 11, fontWeight: 700, color: "#FF4500", textDecoration: "none", padding: "2px 8px", borderRadius: 99, border: "1px solid #FF4500" }}
                  >
                    →
                  </Link>
                ) : (
                  <span style={{ width: 30 }} />
                )}
              </div>
            )}
          </section>

          <DetailPane
            lead={selectedLead}
            mention={selectedMention}
            xPost={selectedXPost}
            replies={replies}
            projectId={currentProject.id}
            filterBase={filterBase}
          />
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Lead card ─────────────────────────────────────────────────

function LeadCard({ lead, active, href }: { lead: LeadDTO; active: boolean; href: string }) {
  const ageMs = lead.created_at ? Date.now() - new Date(lead.created_at).getTime() : null;
  const ageMinutes = ageMs !== null ? Math.floor(ageMs / 60_000) : null;
  const isUnread = lead.opened_at === null;

  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { boxShadow: "inset 3px 0 0 #FF4500" } : undefined}
    >
      <div className="opportunity-meta">
        <TypeDot kind="opportunity" />
        <span>r/{lead.subreddit}</span>
        {ageMinutes !== null && <span>{formatAge(ageMinutes)}</span>}
        {lead.num_comments != null && <span>{lead.num_comments} comments</span>}
      </div>

      <h2 className="opportunity-heading">{lead.title}</h2>

      {lead.classification_reason && (
        <div style={{ marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#46A758" }}>
            Relevance: {lead.intent_score ?? "–"}
          </span>
          <p style={{ fontSize: 11, color: "#46A758", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
            {lead.classification_reason.slice(0, 120)}
          </p>
        </div>
      )}

      {(lead.status !== "new" || (lead.score ?? 0) > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {lead.status !== "new" ? <StatusPill status={lead.status} /> : <span />}
          {(lead.score ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#B0B0B5", fontWeight: 700 }}>▲ {lead.score}</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Mention card ──────────────────────────────────────────────

function MentionCard({ mention, active, href }: { mention: BrandMentionDTO; active: boolean; href: string }) {
  const isUnread = mention.opened_at === null;

  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { boxShadow: "inset 3px 0 0 #4F46E5" } : undefined}
    >
      <div className="opportunity-meta">
        <TypeDot kind="mention" />
        <TargetBadge type={mention.target_type} label={mention.target_label} />
        <span>r/{mention.subreddit}</span>
        {mention.posted_at && <span>{formatRelative(mention.posted_at)}</span>}
        {mention.num_comments != null && <span>{mention.num_comments} comments</span>}
      </div>

      <h2 className="opportunity-heading">{mention.title}</h2>

      {mention.sentiment_reason && (
        <p className="opportunity-reason">{mention.sentiment_reason}</p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <SentimentPill sentiment={mention.sentiment} />
        <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 700 }}>▲ {mention.reddit_score}</span>
      </div>
    </Link>
  );
}

// ── Detail pane ───────────────────────────────────────────────

function DetailPane({
  lead,
  mention,
  xPost,
  replies,
  projectId,
  filterBase,
}: {
  lead: LeadDTO | null;
  mention: BrandMentionDTO | null;
  xPost: XPostDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
  filterBase: string;
}) {
  if (lead) return <LeadDetail lead={lead} replies={replies} projectId={projectId} filterBase={filterBase} />;
  if (mention) return <MentionDetail mention={mention} projectId={projectId} />;
  if (xPost) return <XPostDetail post={xPost} />;

  return (
    <section className="detail-pane">
      <div className="detail-content">
        <div className="empty-state">
          <p className="section-title">No items yet</p>
          <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
            Opportunities and mentions will appear here as the pipelines run.
          </p>
        </div>
      </div>
    </section>
  );
}

function LeadDetail({
  lead,
  replies,
  projectId,
  filterBase,
}: {
  lead: LeadDTO;
  replies: LeadReplyDTO[];
  projectId: string;
  filterBase: string;
}) {
  const isGenerating = lead.reply_generation_status === "generating";
  const hasFailed = lead.reply_generation_error;
  const returnTo = `/feed?${filterBase}&itemId=${lead.id}&itemType=opportunity`;
  const redditUrl = toRedditUrl(lead.permalink);

  return (
    <section className="detail-pane" aria-label="Lead detail">
      <ReadMarker itemId={lead.id} itemType="lead" projectId={projectId} />
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span
            className="opportunity-dot"
            style={{
              background:
                lead.status === "new" ? "#FF4500" : lead.status === "replied" ? "#46A758" : "#B0B0B5",
            }}
          />
          <span>r/{lead.subreddit}</span>
          {lead.created_utc && <span>{formatDate(lead.created_utc)}</span>}
          {lead.author && <span>u/{lead.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          {lead.keywords_matched?.length > 0 && (
            <KeywordsDropdown keywords={lead.keywords_matched} />
          )}
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="irrelevant" />
            <input type="hidden" name="returnTo" value={`/feed?${filterBase}`} />
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

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#1A1A1B" }}>
          {lead.title}
        </h2>
        {lead.keywords_matched?.length > 0 && (
          <p style={{ fontSize: 11, color: "#7C7C83", fontWeight: 600, marginTop: 10 }}>
            Keywords: {lead.keywords_matched.slice(0, 3).join(", ")}
            {lead.keywords_matched.length > 3 ? ` +${lead.keywords_matched.length - 3}` : ""}
          </p>
        )}
      </div>

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

      <div className="lead-comment-box">
        {hasFailed && (
          <div style={{ padding: "10px 12px", borderRadius: 4, background: "#FBE2E5", border: "1px solid #F2B7BD", color: "#EA0027", fontSize: 12, marginBottom: 12 }}>
            {hasFailed}
          </div>
        )}
        {isGenerating ? (
          <div style={{ padding: "14px 0", color: "#7C7C83", fontSize: 13, fontWeight: 600 }}>
            Generating replies…
          </div>
        ) : (
          <ReplyEditor
            key={lead.id}
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
                <button
                  type="submit"
                  className={`composer-btn${replies.length === 0 ? " composer-btn-accent" : ""}`}
                >
                  {replies.length > 0 ? "⥁ Regenerate" : "✦ Generate Reply Suggestions"}
                </button>
              </form>
            }
          />
        )}
      </div>
    </section>
  );
}

function MentionDetail({ mention, projectId }: { mention: BrandMentionDTO; projectId: string }) {
  const redditUrl = toRedditUrl(mention.permalink);

  return (
    <section className="detail-pane" aria-label="Mention detail">
      <ReadMarker itemId={mention.id} itemType="mention" projectId={projectId} />
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <TargetBadge type={mention.target_type} label={mention.target_label} />
          <span>r/{mention.subreddit}</span>
          {mention.posted_at && <span>{formatDate(mention.posted_at)}</span>}
          {mention.author && <span>u/{mention.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <SentimentPill sentiment={mention.sentiment} />
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em", fontWeight: 700, color: "#1A1A1B" }}>
          {mention.title}
        </h2>
        {mention.sentiment_reason && (
          <p style={{ fontSize: 12, color: "#7C7C83", fontWeight: 600, marginTop: 10 }}>
            {mention.sentiment_reason}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {mention.body?.trim() || "No body available. Open the post on Reddit to see the full context."}
        </p>
        <RedditComments permalink={mention.permalink} />
        <div className="post-stats-bar">
          {mention.reddit_score > 0 && <span>▲ {mention.reddit_score} upvotes</span>}
          <span>💬 {mention.num_comments} comments</span>
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            View Post on Reddit →
          </a>
        </div>
      </article>

      <div className="lead-comment-box">
        <MentionReplyGenerator
          key={mention.id}
          projectId={projectId}
          mentionId={mention.id}
          permalink={mention.permalink}
        />
      </div>
    </section>
  );
}


// ── X post card ───────────────────────────────────────────────

function XPostCard({ post, active, href }: { post: XPostDTO; active: boolean; href: string }) {
  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
    >
      <div className="opportunity-meta">
        <span className="opportunity-dot" style={{ background: "#000" }} />
        {post.author_username && <span>@{post.author_username}</span>}
        {post.posted_at && <span>{formatRelative(post.posted_at)}</span>}
        {post.like_count != null && <span>♥ {post.like_count}</span>}
      </div>
      <h2 className="opportunity-heading" style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
        {post.text.length > 160 ? `${post.text.slice(0, 160)}…` : post.text}
      </h2>
      {post.classification_reason && (
        <p style={{ fontSize: 11, color: "#46A758", fontWeight: 500, lineHeight: 1.4, marginTop: 4 }}>
          {post.classification_reason.slice(0, 100)}
        </p>
      )}
      {post.intent_score != null && (
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#46A758" }}>
            Score: {post.intent_score}
          </span>
        </div>
      )}
    </Link>
  );
}

// ── X post detail ─────────────────────────────────────────────

function XPostDetail({ post }: { post: XPostDTO }) {
  return (
    <section className="detail-pane" aria-label="X post detail">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" style={{ background: "#000" }} />
          {post.author_name && <span>{post.author_name}</span>}
          {post.author_username && <span>@{post.author_username}</span>}
          {post.posted_at && <span>{formatDate(post.posted_at)}</span>}
        </div>
        {post.permalink && (
          <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none",
              padding: "5px 14px", borderRadius: 20, border: "1px solid #000",
              flexShrink: 0,
            }}
          >
            View on X →
          </a>
        )}
      </div>

      <div className="detail-content">
        <p style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 400, color: "#1A1A1B", whiteSpace: "pre-wrap" }}>
          {post.text}
        </p>

        {post.keywords_matched && post.keywords_matched.length > 0 && (
          <p style={{ fontSize: 11, color: "#7C7C83", fontWeight: 600, marginTop: 16 }}>
            Keywords: {post.keywords_matched.join(", ")}
          </p>
        )}
      </div>

      <article className="lead-post">
        <div className="post-stats-bar">
          {post.like_count != null && <span>♥ {post.like_count} likes</span>}
          {post.retweet_count != null && <span>↺ {post.retweet_count} retweets</span>}
          {post.reply_count != null && <span>💬 {post.reply_count} replies</span>}
          {post.impression_count != null && <span>👁 {post.impression_count} views</span>}
        </div>

        {post.classification_reason && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F6F7F8", borderRadius: 8, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83", marginBottom: 4 }}>AI ANALYSIS</p>
            <p style={{ fontSize: 13, color: "#1A1A1B", lineHeight: 1.5 }}>{post.classification_reason}</p>
            {post.intent_score != null && (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#46A758", marginTop: 6 }}>
                Intent score: {post.intent_score}/100
              </p>
            )}
          </div>
        )}
      </article>
    </section>
  );
}

// ── Mention triage controls ───────────────────────────────────

function TargetDropdown({
  projectId,
  companyName,
  competitors,
  selectedTarget,
  sentiment,
  sort,
  selectedItemId,
}: {
  projectId: string;
  companyName: string;
  competitors: KeywordDTO[];
  selectedTarget: string;
  sentiment: BrandMentionSentiment | "all";
  sort: string;
  selectedItemId?: string;
}) {
  const targets = [
    { id: "all", label: "All mentions" },
    { id: companyName, label: companyName },
    ...competitors.map((c) => ({ id: c.term, label: c.term })),
  ];

  const selectedLabel = targets.find((t) => t.id === selectedTarget)?.label ?? "All mentions";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 700, flexShrink: 0 }}>Target</span>
      <details style={{ position: "relative" }}>
        <summary
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px 4px 12px",
            borderRadius: 20,
            border: "1px solid #DAE0E6",
            background: selectedTarget !== "all" ? "#FFF3EC" : "#fff",
            color: selectedTarget !== "all" ? "#E03D00" : "#1A1A1B",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            listStyle: "none",
            userSelect: "none",
          }}
        >
          {selectedLabel}
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5 }}>
            <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </summary>
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {targets.map((t) => {
            const active = selectedTarget === t.id;
            const href = buildMentionHref({
              projectId,
              target: t.id === "all" ? undefined : t.id,
              sentiment: sentiment === "all" ? undefined : sentiment,
              sort: sort === "relevant" ? undefined : sort,
              itemId: selectedItemId,
            });
            return (
              <Link
                key={t.id}
                href={href}
                style={{
                  display: "block",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 400,
                  color: active ? "#FF4500" : "#1A1A1B",
                  background: active ? "#FFF3EC" : "transparent",
                  textDecoration: "none",
                  borderBottom: "1px solid #F5F5F5",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function SortControl({
  projectId,
  target,
  sentiment,
  selectedSort,
}: {
  projectId: string;
  target: string;
  sentiment: BrandMentionSentiment | "all";
  selectedSort: string;
}) {
  const options = [
    { value: "relevant", label: "Most discussed" },
    { value: "recent",   label: "Most recent" },
  ] as const;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "#8E8E93", fontWeight: 700 }}>Sort</span>
      <div style={{ display: "flex", alignItems: "center", gap: 0, borderRadius: 6, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {options.map((opt, i) => {
          const active = selectedSort === opt.value;
          const href = buildMentionHref({
            projectId,
            target: target === "all" ? undefined : target,
            sentiment: sentiment === "all" ? undefined : sentiment,
            sort: opt.value === "relevant" ? undefined : opt.value,
          });
          return (
            <Link
              key={opt.value}
              href={href}
              style={{
                display: "inline-block",
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: active ? 700 : 500,
                color: active ? "#fff" : "#6B7280",
                background: active ? "#1A1A1B" : "transparent",
                textDecoration: "none",
                borderLeft: i > 0 ? "1px solid #E5E7EB" : "none",
                transition: "background 0.1s",
              }}
            >
              {opt.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function SentimentBar({
  projectId,
  target,
  selectedSentiment,
  selectedSort,
  stats,
}: {
  projectId: string;
  target: string;
  selectedSentiment: BrandMentionSentiment | "all";
  selectedSort: string;
  stats: Record<string, number>;
}) {
  const items: Array<{ value: BrandMentionSentiment | "all"; label: string }> = [
    { value: "all", label: "All" },
    { value: "positive", label: "Positive" },
    { value: "neutral", label: "Neutral" },
    { value: "negative", label: "Negative" },
  ];

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {items.map((item) => {
        const count = item.value === "all" ? stats.all : (stats[item.value] ?? 0);
        const active = selectedSentiment === item.value;
        const cfg = item.value !== "all" ? SENTIMENT_CONFIG[item.value] : null;
        return (
          <Link
            key={item.value}
            href={buildMentionHref({ projectId, target: target === "all" ? undefined : target, sentiment: item.value === "all" ? undefined : item.value, sort: selectedSort === "relevant" ? undefined : selectedSort })}
            className={`filter-pill${active ? " filter-pill-active" : ""}`}
            style={active && cfg ? { borderColor: cfg.color, color: cfg.color, background: cfg.bg } : {}}
          >
            {item.label} <span style={{ fontWeight: 700, opacity: 0.7 }}>({count})</span>
          </Link>
        );
      })}
    </div>
  );
}

// ── Small UI pieces ───────────────────────────────────────────

function TypeDot({ kind }: { kind: "opportunity" | "mention" }) {
  return (
    <span
      className="opportunity-dot"
      style={{ background: kind === "opportunity" ? "#FF4500" : "#7C7C83" }}
    />
  );
}

function TargetBadge({ type, label }: { type: string; label: string }) {
  const isCompany = type === "company";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        padding: "2px 7px",
        borderRadius: 5,
        background: isCompany ? "#FFF3EC" : "#F3F4F6",
        color: isCompany ? "#FF4500" : "#7C7C83",
        border: isCompany ? "1px solid rgba(224,112,0,0.2)" : "1px solid #E5E7EB",
      }}
    >
      {label}
    </span>
  );
}

const SENTIMENT_CONFIG: Record<BrandMentionSentiment, { label: string; color: string; bg: string }> = {
  positive: { label: "Positive", color: "#059669", bg: "#ECFDF5" },
  negative: { label: "Negative", color: "#DC2626", bg: "#FEF2F2" },
  neutral:  { label: "Neutral",  color: "#7C7C83", bg: "#F8F8F7" },
};

function SentimentPill({ sentiment }: { sentiment: BrandMentionSentiment }) {
  const cfg = SENTIMENT_CONFIG[sentiment];
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatusPill({ status }: { status: LeadDTO["status"] }) {
  const styles: Record<string, { bg: string; color: string }> = {
    new:        { bg: "#FFF3EC", color: "#E03D00" },
    replied:    { bg: "#DEF2E2", color: "#46A758" },
    irrelevant: { bg: "#EDEFF1", color: "#7C7C83" },
  };
  const s = styles[status] ?? styles.irrelevant;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {status === "new" ? "New" : status === "replied" ? "Replied" : "Irrelevant"}
    </span>
  );
}

function EmptyFeed({
  feedType,
  lastScrapedAt,
  projectId,
}: {
  feedType: FeedType;
  lastScrapedAt: string | null;
  projectId: string;
}) {

  return (
    <div className="empty-state">
      <p className="section-title">
        {feedType === "mentions" ? "No mentions match this filter" : "No leads yet"}
      </p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        {feedType === "mentions"
          ? "Try adjusting the target or sentiment filters above."
          : lastScrapedAt
          ? `Last scan ${formatDate(lastScrapedAt)}. New posts will appear here automatically.`
          : "Scraper hasn't run yet."}
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

// ── Helpers ───────────────────────────────────────────────────

function parseFeedType(value: string | undefined): FeedType {
  if (value === "opportunities" || value === "mentions" || value === "x") return value;
  return "all";
}

function parseSentiment(value: string | undefined): BrandMentionSentiment | "all" {
  if (value === "positive" || value === "negative" || value === "neutral") return value;
  return "all";
}

function resolveTarget(
  target: string | undefined,
  companyName: string,
  competitors: KeywordDTO[],
): string {
  if (!target || target === "all") return "all";
  if (target === companyName) return companyName;
  if (competitors.some((c) => c.term === target)) return target;
  return "all";
}

function filterByType(items: FeedItem[], feedType: FeedType): FeedItem[] {
  if (feedType === "opportunities") return items.filter((i) => i.kind === "opportunity");
  if (feedType === "mentions") return items.filter((i) => i.kind === "mention");
  return items;
}

function filterByTarget(
  mentions: BrandMentionDTO[],
  target: string,
  companyName: string,
): BrandMentionDTO[] {
  if (target === "all") return mentions;
  if (target === companyName) return mentions.filter((m) => m.target_type === "company");
  return mentions.filter((m) => m.target_label === target);
}

function filterBySentiment(
  mentions: BrandMentionDTO[],
  sentiment: BrandMentionSentiment | "all",
): BrandMentionDTO[] {
  if (sentiment === "all") return mentions;
  return mentions.filter((m) => m.sentiment === sentiment);
}

function sortMentions(mentions: BrandMentionDTO[], sort: string): BrandMentionDTO[] {
  return [...mentions].sort((a, b) =>
    sort === "recent"
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : (b.num_comments ?? 0) - (a.num_comments ?? 0),
  );
}

function computeSentimentStats(mentions: BrandMentionDTO[]) {
  return mentions.reduce(
    (acc, m) => { acc.all++; acc[m.sentiment] = (acc[m.sentiment] ?? 0) + 1; return acc; },
    { all: 0, positive: 0, neutral: 0, negative: 0 } as Record<string, number>,
  );
}

function buildFilterBase({
  projectId,
  feedType,
  target,
  sentiment,
  sort,
}: {
  projectId: string;
  feedType: FeedType;
  target: string;
  sentiment: BrandMentionSentiment | "all";
  sort: string;
}): string {
  const p = new URLSearchParams({ projectId });
  if (feedType !== "all") p.set("type", feedType);
  if (feedType === "mentions") {
    if (target !== "all") p.set("target", target);
    if (sentiment !== "all") p.set("sentiment", sentiment);
    if (sort !== "relevant") p.set("sort", sort);
  }
  return p.toString();
}

function buildMentionHref({
  projectId,
  target,
  sentiment,
  sort,
  itemId,
}: {
  projectId: string;
  target?: string;
  sentiment?: string;
  sort?: string;
  itemId?: string;
}): string {
  const p = new URLSearchParams({ projectId, type: "mentions" });
  if (target) p.set("target", target);
  if (sentiment) p.set("sentiment", sentiment);
  if (sort) p.set("sort", sort);
  if (itemId) { p.set("itemId", itemId); p.set("itemType", "mention"); }
  return `/feed?${p.toString()}`;
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

function formatAge(minutes: number): string {
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}


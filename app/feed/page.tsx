import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { KeywordsDropdown } from "@/app/components/keywords-dropdown";
import { ReplyEditor } from "@/app/components/reply-editor";
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
import { updateMentionStatusFromForm } from "@/modules/mentions/actions";
import { updateXPostStatusFromForm } from "@/modules/x/actions";
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
  const locale = await getLocale();
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;
  const isEs = locale.startsWith("es");
  const isPt = locale.startsWith("pt");
  const copy = {
    headerOpportunities: isEs ? "Nuevas oportunidades" : isPt ? "Novas oportunidades" : "New Opportunities",
    headerMentions: isEs ? "Menciones" : isPt ? "Menções" : "Mentions",
    headerX: isEs ? "Leads de X" : isPt ? "Leads de X" : "X Leads",
    descOpportunities: isEs ? "Encontrá posts de Reddit con keywords relevantes para tu negocio. Participá en esas conversaciones para aumentar tu visibilidad y llegar a clientes potenciales." : isPt ? "Encontre posts do Reddit com palavras-chave relevantes para o seu negócio. Participe dessas conversas para aumentar sua visibilidade e alcançar clientes potenciais." : "Find Reddit posts that contain keywords relevant to your business. Engage with these posts to increase your visibility and reach potential customers.",
    descMentions: isEs ? "Posts de Reddit donde se menciona tu empresa o competidores. Descubrí qué piensan las personas sobre tu producto, seguí las conversaciones y respondé cuando tenga sentido." : isPt ? "Posts do Reddit que mencionam sua empresa ou concorrentes. Descubra o que as pessoas pensam sobre seu produto, acompanhe as conversas e responda quando fizer sentido." : "Reddit posts mentioning your company or competitors. Find out what people think about your product. Keep track of mentions, and respond to them.",
    descX: isEs ? "Posts de X clasificados por intención para outreach manual." : isPt ? "Posts do X classificados por intenção para outreach manual." : "X posts classified by intent for manual outreach.",
    postsFound: isEs ? "posts encontrados" : isPt ? "posts encontrados" : "posts found",
    backToList: isEs ? "Volver a la lista" : isPt ? "Voltar para a lista" : "Back to list",
    noItemsYet: isEs ? "Todavía no hay items" : isPt ? "Ainda não há itens" : "No items yet",
    noItemsBody: isEs ? "Las oportunidades y menciones van a aparecer acá cuando corran los pipelines." : isPt ? "Oportunidades e menções aparecerão aqui quando os pipelines rodarem." : "Opportunities and mentions will appear here as the pipelines run.",
    reject: isEs ? "Descartar post" : isPt ? "Descartar post" : "Reject Post",
    markReplied: isEs ? "Marcar como respondido" : isPt ? "Marcar como respondido" : "Mark as Replied",
    viewReddit: isEs ? "Ver post en Reddit →" : isPt ? "Ver post no Reddit →" : "View Post on Reddit →",
    generatingReplies: isEs ? "Generando respuestas…" : isPt ? "Gerando respostas…" : "Generating replies…",
    regenerate: isEs ? "⥁ Regenerar" : isPt ? "⥁ Gerar novamente" : "⥁ Regenerate",
    generateReplySuggestions: isEs ? "✦ Generar sugerencias de respuesta" : isPt ? "✦ Gerar sugestões de resposta" : "✦ Generate Reply Suggestions",
    viewX: isEs ? "Ver en X →" : isPt ? "Ver no X →" : "View on X →",
    aiAnalysis: isEs ? "ANÁLISIS IA" : isPt ? "ANÁLISE IA" : "AI ANALYSIS",
    noMentions: isEs ? "No hay menciones para este filtro" : isPt ? "Nenhuma menção corresponde a este filtro" : "No mentions match this filter",
    noLeads: isEs ? "Todavía no hay leads" : isPt ? "Ainda não há leads" : "No leads yet",
    scraperNotRun: isEs ? "El scraper todavía no corrió." : isPt ? "O scraper ainda não foi executado." : "Scraper hasn't run yet.",
    statusReplied: isEs ? "✓ Respondido" : isPt ? "✓ Respondido" : "✓ Replied",
    intentScore: isEs ? "Score de intención" : isPt ? "Pontuação de intenção" : "Intent score",
    keywords: isEs ? "Keywords" : isPt ? "Palavras-chave" : "Keywords",
    noBodyReddit: isEs ? "No hay cuerpo disponible. Abrí el post en Reddit para ver el contexto completo." : isPt ? "Não há corpo disponível. Abra o post no Reddit para ver o contexto completo." : "No body available. Open the post on Reddit to see the full context.",
    upvotes: isEs ? "upvotes" : isPt ? "upvotes" : "upvotes",
    comments: isEs ? "comentarios" : isPt ? "comentários" : "comments",
    likes: isEs ? "likes" : isPt ? "curtidas" : "likes",
    retweets: isEs ? "retweets" : isPt ? "retweets" : "retweets",
    replies: isEs ? "respuestas" : isPt ? "respostas" : "replies",
    views: isEs ? "vistas" : isPt ? "visualizações" : "views",
    adjustFilters: isEs ? "Probá ajustar los filtros de target o sentimiento." : isPt ? "Tente ajustar os filtros de alvo ou sentimento." : "Try adjusting the target or sentiment filters above.",
    lastScan: isEs ? "Último escaneo" : isPt ? "Última varredura" : "Last scan",
    newPostsAppear: isEs ? "Los nuevos posts van a aparecer acá automáticamente." : isPt ? "Novos posts aparecerão aqui automaticamente." : "New posts will appear here automatically.",
    feedAria: isEs ? "Feed de leads" : isPt ? "Feed de leads" : "Leads feed",
    relevance: isEs ? "Relevancia" : isPt ? "Relevância" : "Relevance",
    unknownAuthor: isEs ? "desconocido" : isPt ? "desconhecido" : "unknown",
    viewOnRedditShort: isEs ? "Ver en Reddit ↗" : isPt ? "Ver no Reddit ↗" : "View on Reddit ↗",
    allMentions: isEs ? "Todas las menciones" : isPt ? "Todas as menções" : "All mentions",
    sentiment: isEs ? "Sentimiento" : isPt ? "Sentimento" : "Sentiment",
    mostlyPositive: isEs ? "Mayormente positivo" : isPt ? "Majoritariamente positivo" : "Mostly Positive",
    mostlyNegative: isEs ? "Mayormente negativo" : isPt ? "Majoritariamente negativo" : "Mostly Negative",
    mixed: isEs ? "Mixto" : isPt ? "Misto" : "Mixed",
    myCompany: isEs ? "Mi empresa" : isPt ? "Minha empresa" : "My Company",
    sortedBy: isEs ? "ordenado por" : isPt ? "ordenado por" : "sorted by",
    date: isEs ? "fecha" : isPt ? "data" : "date",
    activity: isEs ? "actividad" : isPt ? "atividade" : "activity",
    sortByActivity: isEs ? "Sort: Actividad" : isPt ? "Sort: Atividade" : "Sort: Activity",
    sortByRecent: isEs ? "Sort: Recientes" : isPt ? "Sort: Recentes" : "Sort: Recent",
    positive: isEs ? "Positivo" : isPt ? "Positivo" : "Positive",
    neutral: isEs ? "Neutral" : isPt ? "Neutro" : "Neutral",
    negative: isEs ? "Negativo" : isPt ? "Negativo" : "Negative",
    statusNew: isEs ? "Nuevo" : isPt ? "Novo" : "New",
    statusIrrelevant: isEs ? "Irrelevante" : isPt ? "Irrelevante" : "Irrelevant",
    minutesAgo: isEs ? "m atrás" : isPt ? "min atrás" : "m ago",
    hoursAgo: isEs ? "h atrás" : isPt ? "h atrás" : "h ago",
    daysAgo: isEs ? "d atrás" : isPt ? "d atrás" : "d ago",
    justNow: isEs ? "recién" : isPt ? "agora há pouco" : "just now",
    dateLocale: isEs ? "es" : isPt ? "pt" : "en",
  };

  const rawFeedType = parseFeedType(params?.type);

  const [allLeads, allMentionsRaw, keywords, allXPosts] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
    listBrandMentions({ projectId: currentProject.id }),
    listProjectKeywords(currentProject.id),
    listProjectXPosts(currentProject.id),
  ]);

  const feedLeads = allLeads.filter((l) => l.status !== "irrelevant" && l.status !== "replied");
  const competitors = keywords.filter((k) => k.type === "competitor" && k.is_active);
  const xPosts = allXPosts.filter((p) => p.status !== "irrelevant" && p.status !== "replied");

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
            filterByTarget(allMentionsRaw.filter((m) => m.status !== "replied"), selectedTarget, currentProject.name),
            selectedSentiment,
          ),
          selectedSort,
        )
      : allMentionsRaw.filter((m) => m.status !== "replied");

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
        {/* Full-width page header — sits above both panes */}
        <header className="feed-page-header">
          <h1 className="feed-page-title">
            {feedType === "opportunities" ? copy.headerOpportunities : feedType === "mentions" ? copy.headerMentions : copy.headerX}
          </h1>
          {feedType !== "all" && (
            <p className="feed-page-desc">
              {feedType === "opportunities" ? copy.descOpportunities : feedType === "mentions" ? copy.descMentions : copy.descX}
            </p>
          )}
        </header>

        <div className="searchbox-body" data-has-selected={String(!!(selectedFromList || selectedXPost))}>
          <section
            className="opportunity-column"
            aria-label={copy.feedAria}
          >
            {/* Column header: count + optional mention filters */}
            <div className="feed-col-header">
              {feedType !== "mentions" && (
                <div className="feed-col-meta">
                  <span>
                    {feedType === "x" ? xPosts.length : feedLeads.length}
                    {" "}{copy.postsFound}
                  </span>
                </div>
              )}

              {feedType === "mentions" && (
                <MentionControls
                  projectId={currentProject.id}
                  companyName={currentProject.name}
                  competitors={competitors}
                  selectedTarget={selectedTarget}
                  selectedSentiment={selectedSentiment}
                  selectedSort={selectedSort}
                  stats={sentimentStats}
                  totalCount={visibleMentions.length}
                  selectedItemId={selectedFromList?.kind === "mention" ? selectedFromList.data.id : undefined}
                  copy={copy}
                />
              )}
            </div>

            <div className="opportunity-list">
              {feedType === "x" ? (
                paginatedXPosts.length === 0 ? (
                  <EmptyFeed feedType={feedType} lastScrapedAt={currentProject.last_scraped_at} copy={copy} />
                ) : (
                  paginatedXPosts.map((post) => (
                    <XPostCard
                      key={post.id}
                      post={post}
                      active={selectedXPost?.id === post.id}
                      href={`/feed?projectId=${currentProject.id}&type=x&itemId=${post.id}`}
                      copy={copy}
                    />
                  ))
                )
              ) : paginatedItems.length === 0 ? (
                <EmptyFeed feedType={feedType} lastScrapedAt={currentProject.last_scraped_at} copy={copy} />
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
                      copy={copy}
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
                      copy={copy}
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

          <div className="detail-col">
            <Link href={`/feed?${filterBase}`} className="detail-mobile-back">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {copy.backToList}
            </Link>
            <DetailPane
              lead={selectedLead}
              mention={selectedMention}
              xPost={selectedXPost}
              replies={replies}
              projectId={currentProject.id}
              replyLength={(currentProject.reply_length ?? "medium") as import("@/db/schemas/domain").ReplyLength}
              filterBase={filterBase}
              copy={copy}
            />
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Feed description ──────────────────────────────────────────

const FEED_META: Record<Exclude<FeedType, "all">, { title: string; description: string }> = {
  opportunities: {
    title: "Opportunities",
    description:
      "Reddit posts where users are actively looking for a solution like yours. Each lead is ranked by buyer intent — the higher the score, the closer they are to making a decision. Reply early, reply human.",
  },
  mentions: {
    title: "Mentions",
    description:
      "Conversations where your brand or competitors come up organically. Track sentiment, spot criticism before it spreads, and jump in when it makes sense. Filter by target or sentiment to triage faster.",
  },
  x: {
    title: "X Leads",
    description:
      "Posts on X/Twitter that match your tracked keywords. These are people voicing pain points or needs your product solves — a fast reply with real value can turn a tweet into a customer.",
  },
};

// ── Lead card ─────────────────────────────────────────────────

function LeadCard({ lead, active, href, copy }: { lead: LeadDTO; active: boolean; href: string; copy: Record<string, string> }) {
  const ageMs = lead.created_utc ? Date.now() - new Date(lead.created_utc).getTime() : null;
  const ageMinutes = ageMs !== null ? Math.floor(ageMs / 60_000) : null;
  const isUnread = lead.opened_at === null;

  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { borderLeftColor: "#FF4500" } : undefined}
    >
      <div className="opportunity-meta">
        <TypeDot kind="opportunity" />
        <span>r/{lead.subreddit}</span>
        {ageMinutes !== null && <span>{formatAge(ageMinutes, copy)}</span>}
        {lead.num_comments != null && <span>{lead.num_comments} {copy.comments}</span>}
      </div>

      <h2 className="opportunity-heading">{lead.title}</h2>

      {lead.classification_reason && (
        <div style={{ marginTop: 5 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#46A758" }}>
            {copy.relevance}: {lead.intent_score ?? "–"}
          </span>
          <p style={{ fontSize: 11, color: "#46A758", fontWeight: 500, lineHeight: 1.4, marginTop: 2 }}>
            {lead.classification_reason.slice(0, 120)}
          </p>
        </div>
      )}

      {(lead.status !== "new" || (lead.score ?? 0) > 0) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          {lead.status !== "new" ? <StatusPill status={lead.status} copy={copy} /> : <span />}
          {(lead.score ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#B0B0B5", fontWeight: 700 }}>▲ {lead.score}</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ── Mention card ──────────────────────────────────────────────

const COMPETITOR_COLORS = ["#4F46E5", "#059669", "#D97706", "#0EA5E9", "#7C3AED"];

const SENTIMENT_SUMMARY_COLOR: Record<BrandMentionSentiment, string> = {
  positive: "#059669",
  neutral:  "#D97706",
  negative: "#DC2626",
};

function highlightMention(text: string, term: string): React.ReactNode {
  if (!term.trim()) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark
        key={i}
        style={{
          background: "rgba(255,69,0,0.10)",
          color: "#C04A00",
          textDecoration: "underline",
          textDecorationColor: "rgba(255,69,0,0.5)",
          borderRadius: 2,
          padding: "0 1px",
          fontStyle: "normal",
        }}
      >
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function MentionCard({ mention, active, href, copy }: { mention: BrandMentionDTO; active: boolean; href: string; copy: Record<string, string> }) {
  const isUnread = mention.opened_at === null;
  const cfg = getSentimentConfig(copy)[mention.sentiment];
  const summaryColor = SENTIMENT_SUMMARY_COLOR[mention.sentiment];
  const redditUrl = mention.permalink ? toRedditUrl(mention.permalink) : null;
  const displayUrl = redditUrl
    ? redditUrl.length > 62 ? `${redditUrl.slice(0, 59)}...` : redditUrl
    : null;
  const bodyText = mention.body
    ? (mention.body.length > 320 ? `${mention.body.slice(0, 317)}…` : mention.body)
    : null;

  return (
    <Link
      href={href}
      className={`opportunity-card mc-card${active ? " opportunity-card-active" : ""}`}
      style={isUnread && !active ? { borderLeftColor: "#4F46E5" } : undefined}
    >
      {/* Header: subreddit · date · comments | sentiment pill */}
      <div className="mc-header">
        <div className="mc-meta">
          <span className="mc-subreddit">r/{mention.subreddit}</span>
          {mention.posted_at && (
            <>
              <span className="mc-sep">·</span>
              <span>{formatRelative(mention.posted_at, copy)}</span>
            </>
          )}
          {mention.num_comments != null && (
            <>
              <span className="mc-sep">·</span>
              <span>{mention.num_comments} {copy.comments}</span>
            </>
          )}
        </div>
        <SentimentPill sentiment={mention.sentiment} copy={copy} />
      </div>

      {/* Thread title */}
      <h2 className="mc-title">{mention.title}</h2>

      {/* Reddit URL */}
      {displayUrl && <p className="mc-url">{displayUrl}</p>}

      <div className="mc-divider" />

      {/* Comment block — contained box */}
      {bodyText && (
        <div style={{ padding: "10px 14px 10px 16px" }}>
          <div
            style={{
              background: "#F8F9FA",
              border: "1px solid #E8EAED",
              borderRadius: 8,
              padding: "10px 12px",
              display: "grid",
              gap: 8,
            }}
          >
            {/* Author row */}
            <div className="mc-author-row">
              <div className="mc-avatar-circle">
                <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="mc-author">{mention.author ?? copy.unknownAuthor}</span>
              <span className="mc-author-date">{mention.posted_at ? formatDate(mention.posted_at, copy) : ""}</span>
            </div>

            {/* Body with highlighted mention */}
            <p className="mc-body">
              {highlightMention(bodyText, mention.target_label)}
            </p>

            {/* Target badge */}
            <div className="mc-tags">
              <TargetBadge type={mention.target_type} label={mention.target_label} />
            </div>

            {/* Footer: sentiment + view link */}
            <div className="mc-comment-footer">
              <span className="mc-sent-label" style={{ color: cfg.color }}>● {cfg.label}</span>
              {redditUrl && <span className="mc-view">{copy.viewOnRedditShort}</span>}
            </div>
          </div>
        </div>
      )}

      {/* AI summary — colored by sentiment */}
      {mention.summary && (
        <p
          className="mc-summary"
          style={{ color: summaryColor, fontWeight: 600 }}
        >
          {mention.summary}
        </p>
      )}
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
  replyLength,
  filterBase,
  copy,
}: {
  lead: LeadDTO | null;
  mention: BrandMentionDTO | null;
  xPost: XPostDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
  replyLength: import("@/db/schemas/domain").ReplyLength;
  filterBase: string;
  copy: Record<string, string>;
}) {
  if (lead) return <LeadDetail lead={lead} replies={replies} projectId={projectId} replyLength={replyLength} filterBase={filterBase} copy={copy} />;
  if (mention) return <MentionDetail mention={mention} projectId={projectId} copy={copy} />;
  if (xPost) return <XPostDetail post={xPost} projectId={projectId} copy={copy} />;

  return (
    <section className="detail-pane" style={{ background: "#fff" }}>
      <div className="detail-content" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <svg width="96" height="96" viewBox="0 0 96 96" fill="none" aria-hidden="true">
          <rect x="12" y="28" width="72" height="52" rx="6" stroke="#E2E4E8" strokeWidth="3" fill="#F8F9FA" />
          <path d="M12 40l36 22 36-22" stroke="#E2E4E8" strokeWidth="3" strokeLinejoin="round" />
          <rect x="30" y="14" width="36" height="20" rx="4" fill="#fff" stroke="#E2E4E8" strokeWidth="2.5" />
          <line x1="37" y1="21" x2="59" y2="21" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
          <line x1="37" y1="27" x2="52" y2="27" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}

function LeadDetail({
  lead,
  replies,
  projectId,
  replyLength,
  filterBase,
  copy,
}: {
  lead: LeadDTO;
  replies: LeadReplyDTO[];
  projectId: string;
  replyLength: import("@/db/schemas/domain").ReplyLength;
  filterBase: string;
  copy: Record<string, string>;
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
          {lead.created_utc && <span>{formatDate(lead.created_utc, copy)}</span>}
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
            <button className="btn-reject" type="submit">{copy.reject}</button>
          </form>
          <form action={updateLeadStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="btn-replied" type="submit">
              <CheckIcon />
              {copy.markReplied}
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
            {copy.keywords}: {lead.keywords_matched.slice(0, 3).join(", ")}
            {lead.keywords_matched.length > 3 ? ` +${lead.keywords_matched.length - 3}` : ""}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {lead.body?.trim() || copy.noBodyReddit}
        </p>
        <div className="post-stats-bar">
          {(lead.score ?? 0) > 0 && <span>▲ {lead.score} {copy.upvotes}</span>}
          {lead.num_comments != null && <span>💬 {lead.num_comments} {copy.comments}</span>}
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            {copy.viewReddit}
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
            {copy.generatingReplies}
          </div>
        ) : (
          <ReplyEditor
            key={lead.id}
            replies={replies}
            permalink={lead.permalink}
            projectId={projectId}
            leadId={lead.id}
            returnTo={returnTo}
            replyLength={replyLength}
            generateForm={
              <form action={generateLeadRepliesFromForm}>
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button
                  type="submit"
                  className={`composer-btn${replies.length === 0 ? " composer-btn-accent" : ""}`}
                >
                  {replies.length > 0 ? copy.regenerate : copy.generateReplySuggestions}
                </button>
              </form>
            }
          />
        )}
      </div>
    </section>
  );
}

function MentionDetail({ mention, projectId, copy }: { mention: BrandMentionDTO; projectId: string; copy: Record<string, string> }) {
  const redditUrl = toRedditUrl(mention.permalink);

  return (
    <section className="detail-pane" aria-label="Mention detail">
      <ReadMarker itemId={mention.id} itemType="mention" projectId={projectId} />
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <TargetBadge type={mention.target_type} label={mention.target_label} />
          <span>r/{mention.subreddit}</span>
          {mention.posted_at && <span>{formatDate(mention.posted_at, copy)}</span>}
          {mention.author && <span>u/{mention.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <SentimentPill sentiment={mention.sentiment} copy={copy} />
          <form action={updateMentionStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="mentionId" value={mention.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={`/feed?type=mentions&projectId=${projectId}`} />
            <button className="btn-replied" type="submit">{copy.statusReplied}</button>
          </form>
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
          {mention.body?.trim() || copy.noBodyReddit}
        </p>
        <div className="post-stats-bar">
          {mention.reddit_score > 0 && <span>▲ {mention.reddit_score} {copy.upvotes}</span>}
          <span>💬 {mention.num_comments} {copy.comments}</span>
          <a href={redditUrl} target="_blank" rel="noreferrer" className="post-stats-link">
            {copy.viewReddit}
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

function XPostCard({ post, active, href, copy }: { post: XPostDTO; active: boolean; href: string; copy: Record<string, string> }) {
  return (
    <Link
      href={href}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
    >
      <div className="opportunity-meta">
        <span className="opportunity-dot" style={{ background: "#000" }} />
        {post.author_username && <span>@{post.author_username}</span>}
        {post.posted_at && <span>{formatRelative(post.posted_at, copy)}</span>}
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

function XPostDetail({ post, projectId, copy }: { post: XPostDTO; projectId: string; copy: Record<string, string> }) {
  return (
    <section className="detail-pane" aria-label="X post detail">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" style={{ background: "#000" }} />
          {post.author_name && <span>{post.author_name}</span>}
          {post.author_username && <span>@{post.author_username}</span>}
        {post.posted_at && <span>{formatDate(post.posted_at, copy)}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12, fontWeight: 700, color: "#000", textDecoration: "none",
                padding: "5px 14px", borderRadius: 20, border: "1px solid #000",
              }}
            >
              {copy.viewX}
            </a>
          )}
          <form action={updateXPostStatusFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="status" value="replied" />
            <input type="hidden" name="returnTo" value={`/feed?type=x&projectId=${projectId}`} />
            <button className="btn-replied" type="submit">{copy.statusReplied}</button>
          </form>
        </div>
      </div>

      <div className="detail-content">
        <p style={{ fontSize: 18, lineHeight: 1.6, fontWeight: 400, color: "#1A1A1B", whiteSpace: "pre-wrap" }}>
          {post.text}
        </p>

        {post.keywords_matched && post.keywords_matched.length > 0 && (
          <p style={{ fontSize: 11, color: "#7C7C83", fontWeight: 600, marginTop: 16 }}>
            {copy.keywords}: {post.keywords_matched.join(", ")}
          </p>
        )}
      </div>

      <article className="lead-post">
        <div className="post-stats-bar">
          {post.like_count != null && <span>♥ {post.like_count} {copy.likes}</span>}
          {post.retweet_count != null && <span>↺ {post.retweet_count} {copy.retweets}</span>}
          {post.reply_count != null && <span>💬 {post.reply_count} {copy.replies}</span>}
          {post.impression_count != null && <span>👁 {post.impression_count} {copy.views}</span>}
        </div>

        {post.classification_reason && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#F6F7F8", borderRadius: 8, border: "1px solid #E5E7EB" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#7C7C83", marginBottom: 4 }}>{copy.aiAnalysis}</p>
            <p style={{ fontSize: 13, color: "#1A1A1B", lineHeight: 1.5 }}>{post.classification_reason}</p>
            {post.intent_score != null && (
              <p style={{ fontSize: 11, fontWeight: 700, color: "#46A758", marginTop: 6 }}>
                {copy.intentScore}: {post.intent_score}/100
              </p>
            )}
          </div>
        )}
      </article>
    </section>
  );
}

// ── Mention controls (unified bar) ───────────────────────────

function MentionControls({
  projectId,
  companyName,
  competitors,
  selectedTarget,
  selectedSentiment,
  selectedSort,
  stats,
  totalCount,
  selectedItemId,
  copy,
}: {
  projectId: string;
  companyName: string;
  competitors: KeywordDTO[];
  selectedTarget: string;
  selectedSentiment: BrandMentionSentiment | "all";
  selectedSort: string;
  stats: Record<string, number>;
  totalCount: number;
  selectedItemId?: string;
  copy: Record<string, string>;
}) {
  const total = stats.all ?? 0;
  const hasData = total > 0;
  const positive = stats.positive ?? 0;
  const negative = stats.negative ?? 0;
  // Net score: +1 = all positive, 0 = neutral/mixed, -1 = all negative
  const netScore = hasData ? (positive - negative) / total : 0;
  // Bar: 0% = fully negative, 50% = neutral, 100% = fully positive
  const barPct = hasData ? Math.round(((netScore + 1) / 2) * 100) : 50;
  const sentimentLabel = !hasData
    ? copy.neutral
    : netScore > 0.25
    ? copy.mostlyPositive
    : netScore < -0.25
    ? copy.mostlyNegative
    : (stats.neutral ?? 0) > positive + negative
    ? copy.neutral
    : copy.mixed;
  const sentimentColor = !hasData
    ? "#7C7C83"
    : netScore > 0.25
    ? "#10B981"
    : netScore < -0.25
    ? "#DC2626"
    : "#F59E0B";
  const sentimentEmoji = !hasData ? "😐" : netScore > 0.25 ? "😊" : netScore < -0.25 ? "😔" : "😐";

  const isCompanySelected = selectedTarget === companyName;
  const companyHref = buildMentionHref({
    projectId,
    target: companyName,
    sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
    sort: selectedSort === "relevant" ? undefined : selectedSort,
    itemId: selectedItemId,
  });

  const competitorTargets = [
    { id: "all", label: copy.allMentions },
    ...competitors.map((c) => ({ id: c.term, label: c.term })),
  ];
  const dropdownSelectedLabel =
    competitorTargets.find((t) => t.id === selectedTarget)?.label ?? copy.allMentions;

  const sortToggleHref = buildMentionHref({
    projectId,
    target: selectedTarget === "all" ? undefined : selectedTarget,
    sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
    sort: selectedSort === "recent" ? undefined : "recent",
    itemId: selectedItemId,
  });

  const sentimentOptions: Array<{ value: BrandMentionSentiment | "all"; label: string }> = [
    { value: "all", label: copy.allMentions },
    { value: "positive", label: copy.positive },
    { value: "neutral", label: copy.neutral },
    { value: "negative", label: copy.negative },
  ];

  return (
    <div className="mention-controls">
      <div className="mc-pills-row">

        {/* Sentiment filter pill */}
        <details className="mc-ctrl-details">
          <summary className={`mc-ctrl-summary filter-pill${selectedSentiment !== "all" ? " filter-pill-active" : ""}`}>
            {selectedSentiment === "all" ? copy.sentiment : getSentimentConfig(copy)[selectedSentiment].label}
            <Chevron />
          </summary>
          <div className="mc-ctrl-dropdown">
            {sentimentOptions.map((opt) => {
              const isActive = selectedSentiment === opt.value;
              const href = buildMentionHref({
                projectId,
                target: selectedTarget === "all" ? undefined : selectedTarget,
                sentiment: opt.value === "all" ? undefined : opt.value,
                sort: selectedSort === "relevant" ? undefined : selectedSort,
                itemId: selectedItemId,
              });
              return (
                <Link key={opt.value} href={href} className={`mc-ctrl-option${isActive ? " mc-ctrl-option-active" : ""}`}>
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </details>

        {/* My Company toggle pill */}
        <Link href={companyHref} className={`filter-pill${isCompanySelected ? " filter-pill-active" : ""}`}>
          {copy.myCompany}
        </Link>

        {/* Competitor dropdown pill */}
        {competitors.length > 0 && (
          <details className="mc-ctrl-details">
            <summary className={`mc-ctrl-summary filter-pill${selectedTarget !== "all" && !isCompanySelected ? " filter-pill-active" : ""}`}>
              {dropdownSelectedLabel}
              <Chevron />
            </summary>
            <div className="mc-ctrl-dropdown">
              {competitorTargets.map((t, i) => {
                const isActive = selectedTarget === t.id;
                const href = buildMentionHref({
                  projectId,
                  target: t.id === "all" ? undefined : t.id,
                  sentiment: selectedSentiment === "all" ? undefined : selectedSentiment,
                  sort: selectedSort === "relevant" ? undefined : selectedSort,
                  itemId: selectedItemId,
                });
                return (
                  <Link key={t.id} href={href} className={`mc-ctrl-option${isActive ? " mc-ctrl-option-active" : ""}`}>
                    {t.id !== "all" && (
                      <span className="mc-ctrl-option-dot" style={{ background: COMPETITOR_COLORS[(i - 1) % COMPETITOR_COLORS.length] }} />
                    )}
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </details>
        )}

      </div>

      <div className="feed-col-meta">
        <span>{totalCount} {copy.postsFound}</span>
        <Link href={sortToggleHref} className="filter-pill" style={{ fontSize: 11 }}>
          {selectedSort === "recent" ? copy.sortByRecent : copy.sortByActivity}
          <Chevron />
        </Link>
      </div>
    </div>
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
        const cfg = item.value !== "all"
          ? {
              positive: { color: "#059669", bg: "#ECFDF5" },
              neutral: { color: "#7C7C83", bg: "#F8F8F7" },
              negative: { color: "#DC2626", bg: "#FEF2F2" },
            }[item.value]
          : null;
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

function getSentimentConfig(copy: Record<string, string>): Record<BrandMentionSentiment, { label: string; color: string; bg: string }> {
  return {
    positive: { label: copy.positive, color: "#059669", bg: "#ECFDF5" },
    negative: { label: copy.negative, color: "#DC2626", bg: "#FEF2F2" },
    neutral: { label: copy.neutral, color: "#7C7C83", bg: "#F8F8F7" },
  };
}

function SentimentPill({ sentiment, copy }: { sentiment: BrandMentionSentiment; copy: Record<string, string> }) {
  const cfg = getSentimentConfig(copy)[sentiment];
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 6, color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function StatusPill({ status, copy }: { status: LeadDTO["status"]; copy: Record<string, string> }) {
  const styles: Record<string, { bg: string; color: string }> = {
    new:        { bg: "#FFF3EC", color: "#E03D00" },
    replied:    { bg: "#DEF2E2", color: "#46A758" },
    irrelevant: { bg: "#EDEFF1", color: "#7C7C83" },
  };
  const s = styles[status] ?? styles.irrelevant;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 7, fontSize: 11, fontWeight: 800, background: s.bg, color: s.color }}>
      {status === "new" ? copy.statusNew : status === "replied" ? copy.statusReplied.replace("✓ ", "") : copy.statusIrrelevant}
    </span>
  );
}

function EmptyFeed({
  feedType,
  lastScrapedAt,
  copy,
}: {
  feedType: FeedType;
  lastScrapedAt: string | null;
  copy: Record<string, string>;
}) {

  return (
    <div className="empty-state">
      <p className="section-title">
        {feedType === "mentions" ? copy.noMentions : copy.noLeads}
      </p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        {feedType === "mentions"
          ? copy.adjustFilters
          : lastScrapedAt
          ? `${copy.lastScan} ${formatDate(lastScrapedAt, copy)}. ${copy.newPostsAppear}`
          : copy.scraperNotRun}
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

function Chevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ marginLeft: 2, opacity: 0.5 }}>
      <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function formatDate(date: string, copy: Record<string, string>) {
  return new Intl.DateTimeFormat(copy.dateLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatRelative(dateStr: string, copy: Record<string, string>) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}${copy.minutesAgo}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${copy.hoursAgo}`;
  return `${Math.floor(hours / 24)}${copy.daysAgo}`;
}

function formatAge(minutes: number, copy: Record<string, string>): string {
  if (minutes < 1) return copy.justNow;
  if (minutes < 60) return `${minutes}${copy.minutesAgo}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${copy.hoursAgo}`;
  return `${Math.floor(hours / 24)}${copy.daysAgo}`;
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function formatFollowers(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

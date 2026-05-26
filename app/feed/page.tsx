import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listBrandMentions } from "@/db/queries/brand-mentions";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listProjectKeywords } from "@/db/queries/settings";
import { listProjectXPosts } from "@/db/queries/x";
import type { BrandMentionDTO, LeadDTO, LeadReplyDTO, XPostDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import {
  type FeedType,
  type FeedItem,
  parseFeedType,
  parseSentiment,
  resolveTarget,
  filterByType,
  filterByTarget,
  filterBySentiment,
  sortMentions,
  computeSentimentStats,
  buildFilterBase,
} from "./feed-utils";
import { EmptyFeed } from "./components/feed-ui";
import { LeadCard } from "./components/lead-card";
import { MentionCard } from "./components/mention-card";
import { MentionControls } from "./components/mention-controls";
import { DetailPane } from "./components/detail-pane";
import { XPostCard } from "./components/x-post";
import { XUpgradeGate } from "./components/x-upgrade-gate";

type FeedPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    type?: string;
    itemId?: string;
    itemType?: string;
    page?: string;
    target?: string;
    sentiment?: string;
    sort?: string;
  }>;
};

export async function generateMetadata({ searchParams }: FeedPageProps): Promise<Metadata> {
  const params = await searchParams;
  const type = parseFeedType(params?.type);
  const titles: Record<FeedType, string> = {
    all: "Feed",
    opportunities: "Opportunities",
    mentions: "Mentions",
    x: "X Leads",
  };
  return { title: titles[type] };
}

const PAGE_SIZE = 10;

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireUser("/feed");
  const params = await searchParams;
  const locale = await getLocale();
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;

  const plan = await getCurrentBillingPlan();
  if (!plan) redirect("/signup/plan");

  const rawFeedTypeEarly = parseFeedType(params?.type);
  if (rawFeedTypeEarly === "x") {
    if (plan.maxXKeywords === null) {
      return (
        <DashboardShell user={user} currentProject={currentProject}>
          <XUpgradeGate projectId={currentProject.id} />
        </DashboardShell>
      );
    }
  }

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
    retryGeneration: isEs ? "Reintentar generación" : isPt ? "Tentar novamente" : "Retry generation",
    errorLimit: isEs ? "Alcanzaste el límite mensual de respuestas IA. Mejorá tu plan o esperá al próximo mes." : isPt ? "Você atingiu o limite mensal de respostas IA. Faça upgrade do seu plano ou aguarde o próximo mês." : "You've reached your monthly AI reply limit. Upgrade your plan or wait until next month.",
    errorConfiguration: isEs ? "La generación de respuestas IA no está disponible temporalmente. Por favor, intentá de nuevo más tarde." : isPt ? "A geração de respostas de IA está temporariamente indisponível. Por favor, tente novamente mais tarde." : "AI reply generation is temporarily unavailable. Please try again later.",
    errorTemporary: isEs ? "No pudimos generar respuestas en este momento. Por favor, intentá de nuevo." : isPt ? "Não conseguimos gerar respostas agora. Por favor, tente novamente." : "We couldn't generate replies right now. Please try again.",
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

  const feedType = parseFeedType(params?.type);

  const [allLeads, allMentionsRaw, keywords, allXPosts] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
    listBrandMentions({ projectId: currentProject.id }),
    listProjectKeywords(currentProject.id),
    listProjectXPosts(currentProject.id),
  ]);

  const feedLeads = allLeads.filter((l) => l.status !== "irrelevant" && l.status !== "replied");
  const competitors = keywords.filter((k) => k.type === "competitor" && k.is_active);
  const xPosts = allXPosts.filter((p) => p.status !== "irrelevant" && p.status !== "replied");

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

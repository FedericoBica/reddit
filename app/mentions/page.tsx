import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { MentionTargetSwitcher, type MentionTargetOption } from "@/app/mentions/mention-target-switcher";
import { listAllProjectLeads, listProjectLeads } from "@/db/queries/leads";
import { listProjectKeywords } from "@/db/queries/settings";
import type { KeywordDTO } from "@/db/schemas/domain";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Mentions",
};

type MentionsPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    subreddit?: string;
    mentionTarget?: string;
    sentiment?: string;
    sort?: string;
  }>;
};

export default async function MentionsPage({ searchParams }: MentionsPageProps) {
  const user = await requireUser("/mentions");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;


  const [allLeads, recentLeads, keywords] = await Promise.all([
    listAllProjectLeads(currentProject.id, 500),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
    listProjectKeywords(currentProject.id),
  ]);

  const newLeadsCount = recentLeads.filter((l) => l.status === "new").length;
  const competitors = keywords.filter((keyword) => keyword.type === "competitor" && keyword.is_active);
  const selectedTargetId = resolveSelectedTarget(params?.mentionTarget, competitors);
  const targetLeads = filterLeadsByMentionTarget(allLeads, selectedTargetId, competitors);
  const selectedSentiment = parseSentimentFilter(params?.sentiment);
  const selectedSort = parseMentionSort(params?.sort);
  const sentimentStats = computeSentimentStats(targetLeads);
  const visibleTargetLeads = filterLeadsBySentiment(targetLeads, selectedSentiment);
  const subredditStats = computeSubredditStats(visibleTargetLeads);
  const mentionTargetOptions = buildMentionTargetOptions({
    projectId: currentProject.id,
    currentProjectName: currentProject.name,
    competitors,
    selectedTargetId,
  });

  // Selected subreddit filter
  const selectedSub = params?.subreddit ?? null;
  const filteredLeads = sortMentionLeads(
    selectedSub ? visibleTargetLeads.filter((l) => l.subreddit === selectedSub) : visibleTargetLeads,
    selectedSort,
  );

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        {/* Header */}
        <header className="page-header">
          <div>
            <p className="page-kicker">Mentions</p>
            <h1 className="page-title">Actividad por comunidad</h1>
            <p className="page-copy">
              Subreddits donde {selectedTargetId === "company" ? currentProject.name : selectedTargetLabel(selectedTargetId, competitors)} genera más señales de intención. Hacé click en una comunidad para ver sus leads.
            </p>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 8,
              background: "#FFF3E8",
              border: "1px solid rgba(224,112,0,0.15)",
              fontSize: 13,
              fontWeight: 800,
              color: "#E07000",
            }}
          >
            {subredditStats.length} comunidades
          </div>
        </header>

        <div className="content-flow">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div style={{ maxWidth: 320, flex: "1 1 260px" }}>
              <MentionTargetSwitcher options={mentionTargetOptions} />
            </div>
            <SortByControl
              projectId={currentProject.id}
              mentionTarget={selectedTargetId}
              subreddit={selectedSub}
              sentiment={selectedSentiment}
              selectedSort={selectedSort}
            />
          </div>

          {targetLeads.length === 0 ? (
            <EmptyMentions />
          ) : (
            <>
              <SentimentBar
                projectId={currentProject.id}
                mentionTarget={selectedTargetId}
                subreddit={selectedSub}
                selectedSentiment={selectedSentiment}
                selectedSort={selectedSort}
                stats={sentimentStats}
              />

              {/* ── Subreddit cards grid ── */}
              {!selectedSub && subredditStats.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: 14,
                    marginBottom: 32,
                  }}
                >
                  {subredditStats.map((sub) => (
                    <SubredditCard
                      key={sub.subreddit}
                      {...sub}
                      projectId={currentProject.id}
                      mentionTarget={selectedTargetId}
                      sentiment={selectedSentiment}
                      sort={selectedSort}
                      selected={selectedSub === sub.subreddit}
                    />
                  ))}
                </div>
              )}

              {/* ── Leads for selected subreddit ── */}
              {selectedSub && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          letterSpacing: "-0.02em",
                          color: "#1C1C1E",
                        }}
                      >
                        r/{selectedSub}
                      </h2>
                      <p style={{ fontSize: 13, color: "#6B6B6E", marginTop: 3 }}>
                        {filteredLeads.length} mention{filteredLeads.length !== 1 ? "s" : ""} · {selectedSort === "recent" ? "más recientes primero" : "más relevantes primero"}
                      </p>
                    </div>
                    <Link
                      href={buildMentionsHref({
                        projectId: currentProject.id,
                        mentionTarget: selectedTargetId,
                        sentiment: selectedSentiment,
                        sort: selectedSort,
                      })}
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#6B6B6E",
                        textDecoration: "none",
                      }}
                    >
                      ← Todas las comunidades
                    </Link>
                  </div>

                  <div className="opportunity-list" style={{ overflowY: "visible", padding: 0 }}>
                    {filteredLeads.map((lead) => (
                      <MentionLeadRow
                        key={lead.id}
                        lead={lead}
                        projectId={currentProject.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {subredditStats.length === 0 && (
                <div className="empty-state">
                  <p className="section-title">No hay mentions con este sentiment</p>
                  <p className="section-copy" style={{ maxWidth: 420, margin: "10px auto 0" }}>
                    Probá con otro filtro de sentiment o volvé a All para ver todas las menciones.
                  </p>
                </div>
              )}

              {/* ── Full breakdown table ── */}
              {!selectedSub && subredditStats.length > 0 && (
                <div className="panel">
                  <div
                    style={{
                      padding: "14px 18px",
                      borderBottom: "1px solid #F0F0EE",
                    }}
                  >
                    <p className="section-title">Ranking completo de comunidades</p>
                  </div>
                  <div style={{ padding: "4px 0" }}>
                    {subredditStats.map((sub, i) => (
                      <SubredditTableRow
                        key={sub.subreddit}
                        rank={i + 1}
                        {...sub}
                        projectId={currentProject.id}
                        mentionTarget={selectedTargetId}
                        sentiment={selectedSentiment}
                        sort={selectedSort}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function SentimentBar({
  projectId,
  mentionTarget,
  subreddit,
  selectedSentiment,
  selectedSort,
  stats,
}: {
  projectId: string;
  mentionTarget: string;
  subreddit: string | null;
  selectedSentiment: SentimentFilter;
  selectedSort: MentionSort;
  stats: SentimentStats;
}) {
  const total = Math.max(1, stats.all);

  return (
    <section
      className="panel"
      style={{
        padding: 14,
        marginBottom: 18,
      }}
      aria-label="Sentiment of all mentions"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <p className="section-title">Sentiment of all mentions</p>
          <p className="section-copy" style={{ marginTop: 3 }}>
            {stats.all} mentions clasificadas por tono detectado.
          </p>
        </div>
        <Link
          href={buildMentionsHref({
            projectId,
            mentionTarget,
            subreddit,
            sentiment: "all",
            sort: selectedSort,
          })}
          className={`filter-pill${selectedSentiment === "all" ? " filter-pill-active" : ""}`}
        >
          All
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 8,
        }}
      >
        {SENTIMENT_FILTERS.filter((item) => item.value !== "all").map((item) => {
          const count = stats[item.value];
          const active = selectedSentiment === item.value;

          return (
            <Link
              key={item.value}
              href={buildMentionsHref({
                projectId,
                mentionTarget,
                subreddit,
                sentiment: item.value,
                sort: selectedSort,
              })}
              style={{
                minWidth: 0,
                padding: "10px 10px 9px",
                border: active ? `1px solid ${item.color}` : "1px solid #F0F0EE",
                borderRadius: 8,
                background: active ? item.bg : "#FFFFFF",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: "#F0F0EE",
                  overflow: "hidden",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: `${Math.round((count / total) * 100)}%`,
                    height: "100%",
                    background: item.color,
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: active ? item.color : "#1C1C1E",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </p>
              <p style={{ fontSize: 10, color: "#8E8E93", marginTop: 2, fontWeight: 700 }}>
                {count} · {Math.round((count / total) * 100)}%
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SortByControl({
  projectId,
  mentionTarget,
  subreddit,
  sentiment,
  selectedSort,
}: {
  projectId: string;
  mentionTarget: string;
  subreddit: string | null;
  sentiment: SentimentFilter;
  selectedSort: MentionSort;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <span style={{ fontSize: 12, color: "#8E8E93", fontWeight: 800 }}>Sort by</span>
      {SORT_OPTIONS.map((option) => (
        <Link
          key={option.value}
          href={buildMentionsHref({
            projectId,
            mentionTarget,
            subreddit,
            sentiment,
            sort: option.value,
          })}
          className={`filter-pill${selectedSort === option.value ? " filter-pill-active" : ""}`}
        >
          {option.label}
        </Link>
      ))}
    </div>
  );
}

function SubredditCard({
  subreddit,
  count,
  avgScore,
  highIntentCount,
  latestLead,
  projectId,
  mentionTarget,
  sentiment,
  sort,
  selected,
}: SubredditStat & {
  projectId: string;
  mentionTarget: string;
  sentiment: SentimentFilter;
  sort: MentionSort;
  selected: boolean;
}) {
  return (
    <Link
      href={buildMentionsHref({ projectId, mentionTarget, subreddit, sentiment, sort })}
      style={{
        display: "block",
        background: selected ? "#FFFDFB" : "#FFFFFF",
        border: selected ? "2px solid #E07000" : "1px solid #F0F0EE",
        borderRadius: 12,
        padding: "18px 18px 16px",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
        boxShadow: selected ? "0 4px 18px rgba(224,112,0,0.10)" : "none",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "#1C1C1E",
              letterSpacing: "-0.01em",
            }}
          >
            r/{subreddit}
          </p>
          {latestLead && (
            <p style={{ fontSize: 10, color: "#AEAEB2", fontWeight: 700, marginTop: 2 }}>
              último: {formatRelative(latestLead)}
            </p>
          )}
        </div>
        <span
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#E07000",
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      </div>

      {/* Metrics row */}
      <div style={{ display: "flex", gap: 12 }}>
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Avg score
          </p>
          <p
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: avgScore >= 80 ? "#E07000" : avgScore >= 60 ? "#FF9F40" : "#6B6B6E",
              letterSpacing: "-0.03em",
            }}
          >
            {avgScore}
          </p>
        </div>
        <div style={{ borderLeft: "1px solid #F0F0EE", paddingLeft: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            High intent
          </p>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#1C1C1E", letterSpacing: "-0.03em" }}>
            {highIntentCount}
          </p>
        </div>
        <div style={{ borderLeft: "1px solid #F0F0EE", paddingLeft: 12 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Tasa H.I.
          </p>
          <p style={{ fontSize: 16, fontWeight: 900, color: "#1C1C1E", letterSpacing: "-0.03em" }}>
            {count > 0 ? Math.round((highIntentCount / count) * 100) : 0}%
          </p>
        </div>
      </div>
    </Link>
  );
}

function SubredditTableRow({
  rank,
  subreddit,
  count,
  avgScore,
  highIntentCount,
  wonCount,
  projectId,
  mentionTarget,
  sentiment,
  sort,
}: SubredditStat & {
  rank: number;
  projectId: string;
  mentionTarget: string;
  sentiment: SentimentFilter;
  sort: MentionSort;
}) {
  return (
    <Link
      href={buildMentionsHref({ projectId, mentionTarget, subreddit, sentiment, sort })}
      style={{
        display: "grid",
        gridTemplateColumns: "32px 1fr 80px 80px 80px 80px",
        alignItems: "center",
        gap: 12,
        padding: "11px 18px",
        textDecoration: "none",
        color: "inherit",
        borderBottom: "1px solid #F5F5F3",
        transition: "background 0.12s",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 800, color: "#AEAEB2" }}>
        {rank}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
        r/{subreddit}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#E07000", textAlign: "center" }}>
        {count}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          textAlign: "center",
          color: avgScore >= 80 ? "#E07000" : avgScore >= 60 ? "#FF9F40" : "#6B6B6E",
        }}
      >
        {avgScore}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#6B6B6E", textAlign: "center" }}>
        {highIntentCount}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#22C55E", textAlign: "center" }}>
        {wonCount}
      </span>
    </Link>
  );
}

function MentionLeadRow({
  lead,
  projectId,
}: {
  lead: LeadDTO;
  projectId: string;
}) {
  const score = lead.intent_score ?? 0;

  return (
    <Link
      href={`/leads/${lead.id}?projectId=${projectId}`}
      className="opportunity-card"
    >
      <div className="opportunity-meta">
        <span className="opportunity-dot" />
        <span>r/{lead.subreddit}</span>
        <span>{lead.created_at ? formatRelative(lead.created_at) : ""}</span>
        <span>{lead.author ? `u/${lead.author}` : "autor desconocido"}</span>
        <span>{lead.num_comments ?? 0} comentarios</span>
        <SentimentPill sentiment={getMentionSentimentBucket(lead)} />
      </div>
      <h2 className="opportunity-heading">{lead.title}</h2>
      <p className="opportunity-reason">
        Intent score: {lead.intent_score ?? "-"} ·{" "}
        {lead.classification_reason?.slice(0, 132) ??
          "Mention detectada por keywords y señales de intención."}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          className="badge"
          style={{
            background: "#FFF3E8",
            color: "#E07000",
          }}
        >
          {translateStatus(lead.status)}
        </span>
        <ScorePill score={score} />
      </div>
    </Link>
  );
}

function ScorePill({ score }: { score: number }) {
  const background = score >= 80 ? "#E07000" : score >= 60 ? "#FF9F40" : "#8E8E93";

  return (
    <span
      style={{
        background,
        color: "#FFF",
        fontSize: 13,
        fontWeight: 900,
        padding: "4px 10px",
        borderRadius: 7,
        minWidth: 36,
        textAlign: "center",
        letterSpacing: "-0.02em",
      }}
    >
      {score || "-"}
    </span>
  );
}

function SentimentPill({ sentiment }: { sentiment: Exclude<SentimentFilter, "all"> }) {
  const config = SENTIMENT_FILTERS.find((item) => item.value === sentiment) ?? SENTIMENT_FILTERS[3];

  return (
    <span
      style={{
        color: config.color,
        background: config.bg,
        borderRadius: 5,
        padding: "2px 6px",
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {config.label}
    </span>
  );
}

function EmptyMentions() {
  return (
    <div className="empty-state">
      <SignalIcon />
      <p className="section-title" style={{ marginTop: 14 }}>Sin menciones todavía</p>
      <p className="section-copy" style={{ maxWidth: 380, margin: "10px auto 0" }}>
        Las menciones aparecen automáticamente cuando el scraper detecta leads en subreddits relevantes.
      </p>
    </div>
  );
}

// ── Analytics helpers ─────────────────────────────────────────

type SentimentFilter =
  | "all"
  | "negative"
  | "mostly-negative"
  | "neutral"
  | "mostly-positive"
  | "positive";

type MentionSort = "recent" | "relevant";

type SentimentStats = Record<SentimentFilter, number>;

const SENTIMENT_FILTERS: Array<{
  value: SentimentFilter;
  label: string;
  color: string;
  bg: string;
}> = [
  { value: "all", label: "All", color: "#6B6B6E", bg: "#F3F4F6" },
  { value: "negative", label: "Negative", color: "#DC2626", bg: "#FEF2F2" },
  { value: "mostly-negative", label: "Mostly negative", color: "#F97316", bg: "#FFF7ED" },
  { value: "neutral", label: "Neutral", color: "#6B6B6E", bg: "#F8F8F7" },
  { value: "mostly-positive", label: "Mostly positive", color: "#65A30D", bg: "#F7FEE7" },
  { value: "positive", label: "Positive", color: "#059669", bg: "#ECFDF5" },
];

const SORT_OPTIONS: Array<{ value: MentionSort; label: string }> = [
  { value: "recent", label: "Most recent" },
  { value: "relevant", label: "Most relevant" },
];

type SubredditStat = {
  subreddit: string;
  count: number;
  avgScore: number;
  highIntentCount: number;
  wonCount: number;
  latestLead: string | null;
};

function parseSentimentFilter(value: string | undefined): SentimentFilter {
  return SENTIMENT_FILTERS.some((item) => item.value === value)
    ? (value as SentimentFilter)
    : "all";
}

function parseMentionSort(value: string | undefined): MentionSort {
  return value === "recent" ? "recent" : "relevant";
}

function buildMentionsHref({
  projectId,
  mentionTarget,
  subreddit,
  sentiment,
  sort,
}: {
  projectId: string;
  mentionTarget: string;
  subreddit?: string | null;
  sentiment?: SentimentFilter;
  sort?: MentionSort;
}) {
  const params = new URLSearchParams({
    projectId,
    mentionTarget,
  });

  if (subreddit) params.set("subreddit", subreddit);
  if (sentiment && sentiment !== "all") params.set("sentiment", sentiment);
  if (sort && sort !== "relevant") params.set("sort", sort);

  return `/mentions?${params.toString()}`;
}

function getMentionSentimentBucket(lead: LeadDTO): Exclude<SentimentFilter, "all"> {
  const score = lead.intent_score ?? 0;

  if (lead.sentiment === "negative") {
    return score >= 70 ? "negative" : "mostly-negative";
  }

  if (lead.sentiment === "positive") {
    return score >= 70 ? "positive" : "mostly-positive";
  }

  return "neutral";
}

function filterLeadsBySentiment(leads: LeadDTO[], sentiment: SentimentFilter) {
  if (sentiment === "all") {
    return leads;
  }

  return leads.filter((lead) => getMentionSentimentBucket(lead) === sentiment);
}

function sortMentionLeads(leads: LeadDTO[], sort: MentionSort) {
  return [...leads].sort((a, b) => {
    if (sort === "recent") {
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    }

    return (b.intent_score ?? 0) - (a.intent_score ?? 0);
  });
}

function computeSentimentStats(leads: LeadDTO[]): SentimentStats {
  const stats: SentimentStats = {
    all: leads.length,
    negative: 0,
    "mostly-negative": 0,
    neutral: 0,
    "mostly-positive": 0,
    positive: 0,
  };

  for (const lead of leads) {
    stats[getMentionSentimentBucket(lead)]++;
  }

  return stats;
}

function resolveSelectedTarget(target: string | undefined, competitors: KeywordDTO[]) {
  if (!target || target === "company") {
    return "company";
  }

  return competitors.some((competitor) => competitor.id === target) ? target : "company";
}

function buildMentionTargetOptions({
  projectId,
  currentProjectName,
  competitors,
  selectedTargetId,
}: {
  projectId: string;
  currentProjectName: string;
  competitors: KeywordDTO[];
  selectedTargetId: string;
}): MentionTargetOption[] {
  return [
    {
      id: "company",
      label: currentProjectName,
      description: "Mentions de tu empresa",
      href: `/mentions?projectId=${projectId}&mentionTarget=company`,
      active: selectedTargetId === "company",
    },
    ...competitors.map((competitor) => ({
      id: competitor.id,
      label: competitor.term,
      description: "Mentions de competidor",
      href: `/mentions?projectId=${projectId}&mentionTarget=${encodeURIComponent(competitor.id)}`,
      active: selectedTargetId === competitor.id,
    })),
  ];
}

function filterLeadsByMentionTarget(
  leads: LeadDTO[],
  selectedTargetId: string,
  competitors: KeywordDTO[],
) {
  if (selectedTargetId === "company") {
    const competitorTerms = new Set(competitors.map((competitor) => normalizeTerm(competitor.term)));
    return leads.filter((lead) =>
      lead.keywords_matched.every((keyword) => !competitorTerms.has(normalizeTerm(keyword))),
    );
  }

  const competitor = competitors.find((item) => item.id === selectedTargetId);

  if (!competitor) {
    return leads;
  }

  const term = normalizeTerm(competitor.term);
  return leads.filter((lead) =>
    lead.keywords_matched.some((keyword) => normalizeTerm(keyword) === term),
  );
}

function selectedTargetLabel(selectedTargetId: string, competitors: KeywordDTO[]) {
  return competitors.find((competitor) => competitor.id === selectedTargetId)?.term ?? "el competidor";
}

function normalizeTerm(value: string) {
  return value.trim().toLocaleLowerCase();
}

function computeSubredditStats(leads: LeadDTO[]): SubredditStat[] {
  const map = new Map<
    string,
    { count: number; scoreSum: number; highIntent: number; won: number; latest: string | null }
  >();

  for (const l of leads) {
    const e = map.get(l.subreddit) ?? { count: 0, scoreSum: 0, highIntent: 0, won: 0, latest: null };
    e.count++;
    e.scoreSum += l.intent_score ?? 0;
    if ((l.intent_score ?? 0) >= 80) e.highIntent++;
    if (l.status === "won") e.won++;
    if (!e.latest || (l.created_at && l.created_at > e.latest)) {
      e.latest = l.created_at ?? null;
    }
    map.set(l.subreddit, e);
  }

  return Array.from(map.entries())
    .map(([subreddit, e]) => ({
      subreddit,
      count: e.count,
      avgScore: e.count > 0 ? Math.round(e.scoreSum / e.count) : 0,
      highIntentCount: e.highIntent,
      wonCount: e.won,
      latestLead: e.latest,
    }))
    .sort((a, b) => b.count - a.count);
}

function translateStatus(status: LeadDTO["status"]) {
  const map: Record<LeadDTO["status"], string> = {
    new: "Nuevo",
    reviewing: "Revisando",
    replied: "Respondido",
    won: "Ganado",
    lost: "Perdido",
    irrelevant: "Irrelevante",
  };
  return map[status] ?? status;
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Icons ─────────────────────────────────────────────────────

function SignalIcon() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      style={{ margin: "0 auto", display: "block" }}
    >
      <rect width="44" height="44" rx="12" fill="#FFF3E8" />
      <path d="M22 31v-18M17 28a8 8 0 0 1 0-12M27 16a8 8 0 0 1 0 12M13 33a14 14 0 0 1 0-22M31 11a14 14 0 0 1 0 22" stroke="#E07000" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { CopyButton } from "@/app/components/copy-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listSearchboxResults, getSearchboxResult } from "@/db/queries/searchbox";
import type { SearchboxResultDTO, LeadReplyDTO, LeadDTO } from "@/db/schemas/domain";
import { generateSearchboxReplyFromForm, updateSearchboxStatusFromForm } from "@/modules/searchbox/actions";
import { useLeadReplyFromForm } from "@/modules/leads/actions";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = { title: "Searchbox" };

type SearchboxPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    resultId?: string;
    status?: string;
    sort?: string;
  }>;
};

export default async function SearchboxPage({ searchParams }: SearchboxPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/signup/company");

  const { currentProject, projects } = projectState;

  const filterStatus = parseStatus(params?.status);
  const sort = params?.sort === "recent" ? "recent" : "relevance";

  const [results, allLeads] = await Promise.all([
    listSearchboxResults({
      projectId: currentProject.id,
      status: filterStatus,
      sort,
      limit: 60,
    }),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;
  const newResultsCount = results.filter((r) => r.status === "new").length;
  const highIntentCount = results.filter((r) => (r.intent_score ?? 0) >= 80).length;

  // Determine selected result
  const requestedId = params?.resultId;
  const selectedResult = requestedId
    ? (await getSearchboxResult(currentProject.id, requestedId)) ?? results[0] ?? null
    : results[0] ?? null;

  // Load lead + replies for selected result if a lead was already generated
  let selectedLead: LeadDTO | null = null;
  let replies: LeadReplyDTO[] = [];

  if (selectedResult?.lead_id) {
    [selectedLead, replies] = await Promise.all([
      getLeadById(currentProject.id, selectedResult.lead_id),
      listLeadReplies(currentProject.id, selectedResult.lead_id),
    ]);
  }

  const isGenerating = selectedLead?.reply_generation_status === "generating";

  const FILTERS = [
    { label: "All", value: undefined },
    { label: "New", value: "new" },
    { label: "Replied", value: "replied" },
    { label: "Dismissed", value: "dismissed" },
  ];

  const baseHref = (extra?: string) =>
    `/dashboard?projectId=${currentProject.id}${filterStatus ? `&status=${filterStatus}` : ""}${sort === "recent" ? "&sort=recent" : ""}${extra ?? ""}`;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      {isGenerating && <AutoRefresh intervalMs={4000} />}
      <section className="searchbox-workspace">
        <header className="searchbox-header">
          <div>
            <h1 className="searchbox-title">
              <SearchIcon />
              Searchbox
            </h1>
            <p className="searchbox-description">
              Posts de Reddit que aparecen en Google para tus keywords. Alta intención — Google ya los validó.
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
          {/* Left column — result list */}
          <section className="opportunity-column" aria-label="Searchbox results">
            <div className="opportunity-toolbar">
              <div className="filter-row" style={{ marginBottom: 0 }}>
                {FILTERS.map((f) => {
                  const active = filterStatus === f.value || (!filterStatus && !f.value);
                  const href = f.value
                    ? `/dashboard?projectId=${currentProject.id}&status=${f.value}${sort === "recent" ? "&sort=recent" : ""}`
                    : `/dashboard?projectId=${currentProject.id}${sort === "recent" ? "&sort=recent" : ""}`;
                  return (
                    <Link key={f.label} href={href} className={`filter-pill${active ? " filter-pill-active" : ""}`}>
                      {f.label}
                    </Link>
                  );
                })}
              </div>
              <div className="opportunity-count">
                <span>{results.length} results</span>
                <Link
                  href={`/dashboard?projectId=${currentProject.id}${filterStatus ? `&status=${filterStatus}` : ""}&sort=${sort === "recent" ? "relevance" : "recent"}`}
                  style={{ color: "#E07000", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
                >
                  {sort === "recent" ? "Ordenar por intención" : "Ordenar por recientes"}
                </Link>
              </div>
            </div>

            <div className="opportunity-list">
              {results.length > 0 ? (
                results.map((result) => (
                  <ResultCard
                    key={result.id}
                    result={result}
                    projectId={currentProject.id}
                    active={result.id === selectedResult?.id}
                    baseHref={baseHref(`&resultId=${result.id}`)}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>

            <div style={{ borderTop: "1px solid #F0F0EE", padding: "10px 14px", color: "#AEAEB2", fontSize: 11, fontWeight: 700 }}>
              {currentProject.last_searchbox_at
                ? `Último scan ${formatDate(currentProject.last_searchbox_at)}`
                : "Scan pendiente — se ejecuta cada 2 semanas"}
            </div>
          </section>

          {/* Right column — detail + reply generation */}
          <ResultDetail
            result={selectedResult}
            lead={selectedLead}
            replies={replies}
            projectId={currentProject.id}
          />
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Result card ───────────────────────────────────────────────

function ResultCard({
  result,
  projectId,
  active,
  baseHref,
}: {
  result: SearchboxResultDTO;
  projectId: string;
  active: boolean;
  baseHref: string;
}) {
  return (
    <Link href={baseHref} className={`opportunity-card${active ? " opportunity-card-active" : ""}`}>
      <div className="opportunity-meta">
        <span className="opportunity-dot" style={{ background: result.status === "new" ? "#E07000" : result.status === "replied" ? "#16A34A" : "#AEAEB2" }} />
        <span>r/{result.subreddit}</span>
        <span>{formatRelative(result.created_at)}</span>
        {result.reddit_num_comments !== null && (
          <span>{result.reddit_num_comments} comentarios</span>
        )}
      </div>
      <h2 className="opportunity-heading">{result.title}</h2>
      <p className="opportunity-reason">
        {result.google_keyword} ·{" "}
        {result.classification_reason?.slice(0, 120) ?? "Post detectado por Google para tu keyword."}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <StatusPill status={result.status} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {result.reddit_score !== null && (
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>
              ▲ {result.reddit_score}
            </span>
          )}
          <ScorePill score={result.intent_score} />
        </div>
      </div>
    </Link>
  );
}

// ── Result detail + reply generation ─────────────────────────

function ResultDetail({
  result,
  lead,
  replies,
  projectId,
}: {
  result: SearchboxResultDTO | null;
  lead: LeadDTO | null;
  replies: LeadReplyDTO[];
  projectId: string;
}) {
  if (!result) {
    return (
      <section className="detail-pane">
        <div className="detail-content">
          <EmptyState />
        </div>
      </section>
    );
  }

  const isGenerating = lead?.reply_generation_status === "generating";
  const hasFailed = lead?.reply_generation_error;

  return (
    <section className="detail-pane" aria-label="Detalle del resultado">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" />
          <span>r/{result.subreddit}</span>
          {result.reddit_created_utc && <span>{formatDate(result.reddit_created_utc)}</span>}
          {result.author && <span>u/{result.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
            Google · {result.google_keyword}
          </Badge>
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 900, color: "#1C1C1E" }}>
          {result.title}
        </h2>

        {/* Engagement row */}
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {result.reddit_score !== null && (
            <EngagementStat icon="▲" value={String(result.reddit_score)} label="upvotes" />
          )}
          {result.reddit_num_comments !== null && (
            <EngagementStat icon="💬" value={String(result.reddit_num_comments)} label="comentarios" />
          )}
          <EngagementStat icon="🔍" value={`#${result.google_rank}`} label="en Google" />
          <EngagementStat icon="🎯" value={String(result.intent_score ?? "–")} label="intent score" />
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
          {result.body?.trim() || "Sin cuerpo disponible. Abrí el post en Reddit para ver el contexto completo."}
        </p>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
          <a
            href={`https://reddit.com${result.permalink}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#E07000", fontSize: 12, fontWeight: 800, textDecoration: "none" }}
          >
            Ver en Reddit →
          </a>
        </div>
      </article>

      {/* Reply generation */}
      <div className="lead-comment-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="section-title" style={{ fontSize: 14 }}>Reply Generator</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusSelector result={result} projectId={projectId} />
          </div>
        </div>

        {hasFailed && (
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "#FEF2F2", border: "1px solid #FEE2E2", color: "#991B1B", fontSize: 12, marginBottom: 12 }}>
            {hasFailed}
          </div>
        )}

        {isGenerating ? (
          <div style={{ padding: "14px 0", color: "#6B6B6E", fontSize: 13, fontWeight: 600 }}>
            Generando respuestas…
          </div>
        ) : replies.length > 0 ? (
          <div style={{ display: "grid", gap: 10 }}>
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} lead={lead!} projectId={projectId} />
            ))}
            <form action={generateSearchboxReplyFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="resultId" value={result.id} />
              <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
                Regenerar
              </Button>
            </form>
          </div>
        ) : (
          <div className="comment-surface" style={{ marginBottom: 10 }}>
            Generá una respuesta humana y contextual. ReddProwl prepara variantes por tono antes de abrir Reddit.
          </div>
        )}

        {!isGenerating && replies.length === 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <form action={generateSearchboxReplyFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="resultId" value={result.id} />
              <Button className="h-8 rounded-[8px] px-3 font-extrabold" type="submit">
                Generar respuesta
              </Button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

function ReplyCard({ reply, lead, projectId }: { reply: LeadReplyDTO; lead: LeadDTO; projectId: string }) {
  return (
    <Card className="gap-0 rounded-[10px] border-[#F0F0EE] bg-[#FFFDFB] py-0 ring-0" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <CardContent className="p-4">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
            {reply.style}
          </Badge>
          {reply.was_used && (
            <Badge variant="secondary" className="rounded-[7px] bg-[#D1FAE5] font-extrabold text-[#065F46]">
              Usada
            </Badge>
          )}
        </div>
        <p className="reddit-body" style={{ fontSize: 13 }}>{reply.content}</p>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <CopyButton text={reply.content} permalink={lead.permalink} />
          <form action={useLeadReplyFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <input type="hidden" name="replyId" value={reply.id} />
            <input type="hidden" name="returnTo" value={`/dashboard?projectId=${projectId}`} />
            <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
              Marcar como usada
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusSelector({ result, projectId }: { result: SearchboxResultDTO; projectId: string }) {
  const OPTIONS = [
    { value: "new", label: "New" },
    { value: "replied", label: "Replied" },
    { value: "dismissed", label: "Dismissed" },
  ] as const;

  return (
    <form action={updateSearchboxStatusFromForm} style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="resultId" value={result.id} />
      <select className="select" name="status" defaultValue={result.status} style={{ fontSize: 12, height: 32, padding: "0 8px" }}>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
        Actualizar
      </Button>
    </form>
  );
}

// ── Helpers & small components ────────────────────────────────

function EngagementStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52, padding: "8px 10px", background: "#F5F5F3", borderRadius: 8 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color: "#1C1C1E", lineHeight: 1.2, marginTop: 2 }}>{value}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty-state">
      <p className="section-title">Sin resultados todavía</p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        Searchbox encuentra posts de Reddit rankeados en Google para tus keywords. Se refresca cada 2 semanas.
      </p>
    </div>
  );
}

function ScorePill({ score }: { score: number | null }) {
  const val = score ?? 0;
  let bg = "#E5E5EA", color = "#8E8E93";
  if (val >= 80) { bg = "#E07000"; color = "#FFF"; }
  else if (val >= 60) { bg = "#FF9F40"; color = "#FFF"; }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 34, padding: "3px 8px", borderRadius: 7, fontSize: 12, fontWeight: 900, background: bg, color }}>
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

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.9" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function parseStatus(s?: string): SearchboxResultDTO["status"] | undefined {
  if (s === "new" || s === "replied" || s === "dismissed") return s;
  return undefined;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { CopyButton } from "@/app/components/copy-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLeadById, listFreshProjectLeads, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import type { LeadDTO, LeadReplyDTO } from "@/db/schemas/domain";
import {
  generateLeadRepliesFromForm,
  updateLeadStatusFromForm,
  useLeadReplyFromForm,
} from "@/modules/leads/actions";
import { requireUser } from "@/modules/auth/server";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "New Opportunities",
};

type OpportunitiesPageProps = {
  searchParams?: Promise<{ projectId?: string; leadId?: string; status?: string }>;
};

export default async function OpportunitiesPage({ searchParams }: OpportunitiesPageProps) {
  const user = await requireUser("/opportunities");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;

  const plan = await getCurrentBillingPlan();
  const windowHours = plan.keywordSearchTimeWindow === "week" ? 168 : 24;

  const filterStatus = parseStatus(params?.status);

  const [freshLeads, allLeads] = await Promise.all([
    listFreshProjectLeads(currentProject.id, windowHours, 100),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;
  const newFreshCount = freshLeads.filter((l) => l.status === "new").length;

  const filteredLeads = filterStatus
    ? freshLeads.filter((l) => l.status === filterStatus)
    : freshLeads;

  // Determine selected lead
  const requestedId = params?.leadId;
  const selectedLead = requestedId
    ? ((await getLeadById(currentProject.id, requestedId)) ?? filteredLeads[0] ?? null)
    : filteredLeads[0] ?? null;

  const replies = selectedLead
    ? await listLeadReplies(currentProject.id, selectedLead.id)
    : [];

  const isGenerating = selectedLead?.reply_generation_status === "generating";

  const FILTERS = [
    { label: "All", value: undefined },
    { label: "New", value: "new" },
    { label: "Replied", value: "replied" },
    { label: "Irrelevant", value: "irrelevant" },
  ] as const;

  const baseHref = (extra?: string) =>
    `/opportunities?projectId=${currentProject.id}${filterStatus ? `&status=${filterStatus}` : ""}${extra ?? ""}`;

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
              <FlashIcon />
              New Opportunities
            </h1>
            <p className="searchbox-description">
              Posts recientes que matchearon tus keywords —{" "}
              {windowHours >= 168 ? "últimos 7 días" : "últimas 24 horas"}.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {newFreshCount > 0 && (
              <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
                {newFreshCount} new
              </Badge>
            )}
            <Badge variant="outline" className="rounded-[7px] font-extrabold text-[#6B6B6E]">
              {freshLeads.length} total
            </Badge>
          </div>
        </header>

        <div className="searchbox-body">
          {/* Left column — lead list */}
          <section className="opportunity-column" aria-label="Fresh leads">
            <div className="opportunity-toolbar">
              <div className="filter-row" style={{ marginBottom: 0 }}>
                {FILTERS.map((f) => {
                  const active = filterStatus === f.value || (!filterStatus && !f.value);
                  const href = f.value
                    ? `/opportunities?projectId=${currentProject.id}&status=${f.value}`
                    : `/opportunities?projectId=${currentProject.id}`;
                  return (
                    <Link key={f.label} href={href} className={`filter-pill${active ? " filter-pill-active" : ""}`}>
                      {f.label}
                    </Link>
                  );
                })}
              </div>
              <div className="opportunity-count">
                <span>{filteredLeads.length} results</span>
              </div>
            </div>

            <div className="opportunity-list">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    projectId={currentProject.id}
                    active={lead.id === selectedLead?.id}
                    href={baseHref(`&leadId=${lead.id}`)}
                  />
                ))
              ) : (
                <EmptyFeed windowHours={windowHours} lastScrapedAt={currentProject.last_scraped_at} />
              )}
            </div>

            <div style={{ borderTop: "1px solid #F0F0EE", padding: "10px 14px", color: "#AEAEB2", fontSize: 11, fontWeight: 700 }}>
              {currentProject.last_scraped_at
                ? `Último scan ${formatDate(currentProject.last_scraped_at)}`
                : "Scan pendiente"}
            </div>
          </section>

          {/* Right column — lead detail */}
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
  projectId,
  active,
  href,
}: {
  lead: LeadDTO;
  projectId: string;
  active: boolean;
  href: string;
}) {
  const score = lead.intent_score ?? 0;
  const ageMs = lead.created_at ? Date.now() - new Date(lead.created_at).getTime() : null;
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
        {lead.num_comments != null && <span>{lead.num_comments} comentarios</span>}
      </div>
      <h2 className="opportunity-heading">{lead.title}</h2>
      <p className="opportunity-reason">
        {lead.keywords_matched?.[0] ?? ""}{lead.keywords_matched?.length > 1 ? ` +${lead.keywords_matched.length - 1}` : ""}{" "}
        {lead.classification_reason ? `· ${lead.classification_reason.slice(0, 100)}` : ""}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <StatusPill status={lead.status} />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {(lead.score ?? 0) > 0 && (
            <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 700 }}>
              ▲ {lead.score}
            </span>
          )}
          <ScorePill score={lead.intent_score} />
        </div>
      </div>
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
            <p className="section-title">Sin leads todavía</p>
            <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
              Los posts que matcheen tus keywords aparecen aquí. El scraper corre automáticamente.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isGenerating = lead.reply_generation_status === "generating";
  const hasFailed = lead.reply_generation_error;
  const returnTo = `/opportunities?projectId=${projectId}&leadId=${lead.id}`;

  const STATUS_OPTIONS: { value: LeadDTO["status"]; label: string }[] = [
    { value: "new", label: "New" },
    { value: "replied", label: "Replied" },
    { value: "irrelevant", label: "Irrelevant" },
  ];

  return (
    <section className="detail-pane" aria-label="Lead detail">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" />
          <span>r/{lead.subreddit}</span>
          {lead.created_utc && <span>{formatDate(lead.created_utc)}</span>}
          {lead.author && <span>u/{lead.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ScorePill score={lead.intent_score} />
        </div>
      </div>

      <div className="detail-content">
        <h2 style={{ fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.03em", fontWeight: 900, color: "#1C1C1E" }}>
          {lead.title}
        </h2>

        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
          {(lead.score ?? 0) > 0 && (
            <EngagementStat icon="▲" value={String(lead.score)} label="upvotes" />
          )}
          {lead.num_comments != null && (
            <EngagementStat icon="💬" value={String(lead.num_comments)} label="comentarios" />
          )}
          <EngagementStat icon="🎯" value={String(lead.intent_score ?? "–")} label="intent score" />
        </div>

        {lead.classification_reason && (
          <p style={{ fontSize: 13, color: "#6B6B6E", lineHeight: 1.5, marginTop: 14, padding: "10px 14px", background: "#F5F5F3", borderRadius: 8 }}>
            {lead.classification_reason}
          </p>
        )}
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {lead.body?.trim() || "Sin cuerpo disponible. Abrí el post en Reddit para ver el contexto completo."}
        </p>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14 }}>
          <a
            href={`https://reddit.com${lead.permalink}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#E07000", fontSize: 12, fontWeight: 800, textDecoration: "none" }}
          >
            Ver en Reddit →
          </a>
        </div>
      </article>

      <div className="lead-comment-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="section-title" style={{ fontSize: 14 }}>Reply Generator</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <form action={updateLeadStatusFromForm} style={{ display: "flex", gap: 6 }}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <select className="select" name="status" defaultValue={lead.status} style={{ fontSize: 12, height: 32, padding: "0 8px" }}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
                Actualizar
              </Button>
            </form>
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
              <ReplyCard key={reply.id} reply={reply} lead={lead} projectId={projectId} returnTo={returnTo} />
            ))}
            <form action={generateLeadRepliesFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
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
            <form action={generateLeadRepliesFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
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

function ReplyCard({
  reply,
  lead,
  projectId,
  returnTo,
}: {
  reply: LeadReplyDTO;
  lead: LeadDTO;
  projectId: string;
  returnTo: string;
}) {
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
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button variant="outline" className="h-8 rounded-[8px] font-extrabold text-xs" type="submit">
              Marcar como usada
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Empty & helper components ─────────────────────────────────

function EmptyFeed({ windowHours, lastScrapedAt }: { windowHours: number; lastScrapedAt: string | null }) {
  return (
    <div className="empty-state">
      <p className="section-title">No hay posts frescos</p>
      <p className="section-copy" style={{ maxWidth: 480, margin: "10px auto 0" }}>
        No hay leads en {windowHours >= 168 ? "los últimos 7 días" : "las últimas 24 horas"}.{" "}
        {lastScrapedAt ? `Último scan ${formatDate(lastScrapedAt)}.` : "El scraper aún no corrió."}
      </p>
    </div>
  );
}

function EngagementStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52, padding: "8px 10px", background: "#F5F5F3", borderRadius: 8 }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 900, color: "#1C1C1E", lineHeight: 1.2, marginTop: 2 }}>{value}</span>
      <span style={{ fontSize: 9, fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
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

function FlashIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M13 2L4.5 13.5H11L10 22L20 10H13.5L13 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function parseStatus(s?: string): LeadDTO["status"] | undefined {
  if (s === "new" || s === "replied" || s === "irrelevant") return s;
  return undefined;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function formatAge(minutes: number): string {
  if (minutes < 1) return "justo ahora";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

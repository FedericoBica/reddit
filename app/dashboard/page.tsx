import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/app/components/auto-refresh";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listProjectLeads } from "@/db/queries/leads";
import type { LeadDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Dashboard",
};

type DashboardPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    status?: string;
  }>;
};

const FILTERS = [
  { label: "Todos", value: undefined },
  { label: "Nuevos", value: "new" },
  { label: "Respondidos", value: "replied" },
  { label: "Irrelevantes", value: "irrelevant" },
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser("/dashboard");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") {
    redirect("/signup/company");
  }

  const { currentProject, projects } = projectState;

  if (currentProject.onboarding_status !== "completed") {
    redirect(`/onboarding/project?projectId=${currentProject.id}`);
  }

  const selectedStatus = parseStatus(params?.status);
  const leads = await listProjectLeads({
    projectId: currentProject.id,
    status: selectedStatus,
    limit: 50,
    page: 0,
  });
  const allLeads = selectedStatus
    ? await listProjectLeads({
        projectId: currentProject.id,
        limit: 100,
        page: 0,
      })
    : leads;
  const newLeadsCount = allLeads.filter((lead) => lead.status === "new").length;
  const highIntentCount = allLeads.filter((lead) => (lead.intent_score ?? 0) >= 80).length;
  const selectedLead = leads[0] ?? null;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      {currentProject.onboarding_status === "completed" && <AutoRefresh intervalMs={15000} />}
      <section className="searchbox-workspace">
        <header className="searchbox-header">
          <div>
            <h1 className="searchbox-title">
              <InboxIcon />
              Searchbox
            </h1>
            <p className="searchbox-description">
              Leads detectados cuando personas buscan soluciones relacionadas a
              {` ${currentProject.name}`}. Comentá solo cuando haya intención
              clara y contexto suficiente.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
              {highIntentCount} high intent
            </Badge>
            <Badge variant="outline" className="rounded-[7px] font-extrabold text-[#6B6B6E]">
              {newLeadsCount} nuevos
            </Badge>
          </div>
        </header>

        <div className="searchbox-body">
          <section className="opportunity-column" aria-label="Oportunidades">
            <div className="opportunity-toolbar">
              <div className="filter-row" aria-label="Filtros de leads" style={{ marginBottom: 0 }}>
                {FILTERS.map((filter) => {
                  const active = selectedStatus === filter.value || (!selectedStatus && !filter.value);
                  const href = filter.value
                    ? `/dashboard?projectId=${currentProject.id}&status=${filter.value}`
                    : `/dashboard?projectId=${currentProject.id}`;

                  return (
                    <Link
                      key={filter.label}
                      href={href}
                      className={`filter-pill${active ? " filter-pill-active" : ""}`}
                    >
                      {filter.label}
                    </Link>
                  );
                })}
              </div>
              <div className="opportunity-count">
                <span>{leads.length} oportunidades</span>
                <span>Ordenado por intención</span>
              </div>
            </div>

            <div id="lead-list" className="opportunity-list">
              {leads.length > 0 ? (
                leads.map((lead, index) => (
                  <OpportunityCard
                    key={lead.id}
                    lead={lead}
                    projectId={currentProject.id}
                    active={index === 0}
                  />
                ))
              ) : (
                <EmptyLeads projectName={currentProject.name} />
              )}
            </div>

            <ProjectFooter
              lastScrapedAt={currentProject.last_scraped_at}
              language={currentProject.primary_language}
            />
          </section>

          <LeadPreview lead={selectedLead} projectId={currentProject.id} />
        </div>
      </section>
    </DashboardShell>
  );
}

function OpportunityCard({
  lead,
  projectId,
  active,
}: {
  lead: LeadDTO;
  projectId: string;
  active: boolean;
}) {
  return (
    <Link
      href={`/leads/${lead.id}?projectId=${projectId}`}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
    >
      <div className="opportunity-meta">
        <span className="opportunity-dot" />
        <span>r/{lead.subreddit}</span>
        <span>{lead.created_at ? formatRelative(lead.created_at) : ""}</span>
        <span>{lead.num_comments ?? 0} comentarios</span>
      </div>
      <h2 className="opportunity-heading">{lead.title}</h2>
      <p className="opportunity-reason">
        Intent score: {lead.intent_score ?? "-"} ·{" "}
        {lead.classification_reason?.slice(0, 132) ??
          "Conversación detectada por keywords y señales de intención."}
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <StatusPill status={lead.status} />
        <ScorePill score={lead.intent_score} />
      </div>
    </Link>
  );
}

function EmptyLeads({ projectName }: { projectName: string }) {
  return (
    <div className="empty-state">
      <p className="section-title">Todavía no hay leads para {projectName}</p>
      <p className="section-copy" style={{ maxWidth: 520, margin: "10px auto 0" }}>
        Cuando el scraper encuentre conversaciones con intención real, van a
        aparecer ordenadas por score. Revisá que el onboarding tenga keywords y
        subreddits relevantes.
      </p>
    </div>
  );
}

function LeadPreview({ lead, projectId }: { lead: LeadDTO | null; projectId: string }) {
  if (!lead) {
    return (
      <section className="detail-pane">
        <div className="detail-content">
          <EmptyLeads projectName="este proyecto" />
        </div>
      </section>
    );
  }

  return (
    <section className="detail-pane" aria-label="Detalle del lead seleccionado">
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" />
          <span>r/{lead.subreddit}</span>
          <span>{lead.created_at ? formatDate(lead.created_at) : ""}</span>
          <span>{lead.author ? `u/${lead.author}` : "autor desconocido"}</span>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
            Intent Scoring IA
          </Badge>
          <Badge variant="secondary" className="rounded-[7px] bg-[#D1FAE5] font-extrabold text-[#065F46]">
            Account Protection
          </Badge>
        </div>
      </div>

      <div className="detail-content">
        <h2
          style={{
            fontSize: 24,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            fontWeight: 900,
            color: "#1C1C1E",
          }}
        >
          {lead.title}
        </h2>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 18 }}>
          {lead.keywords_matched.slice(0, 4).map((keyword) => (
            <Badge key={keyword} variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
              {keyword}
            </Badge>
          ))}
          <Badge variant="outline" className="rounded-[7px] font-extrabold text-[#6B6B6E]">
            Keyword match
          </Badge>
          <Badge variant="outline" className="rounded-[7px] font-extrabold text-[#6B6B6E]">
            Reply Generator
          </Badge>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
            marginTop: 18,
          }}
        >
          <FeatureNote
            title="⚔️ Battlecards"
            text={
              lead.keywords_matched.length > 0
                ? `Keywords: ${lead.keywords_matched.slice(0, 2).join(", ")}. Abrí el lead para ver ángulos de respuesta.`
                : "Si menciona competidores, prepará ángulos de respuesta desde el detalle."
            }
          />
          <FeatureNote
            title="💬 Ghostwriter"
            text={
              lead.reply_generation_status === "ready"
                ? "Replies generadas. Ver threads para seguir el hilo."
                : "Generá respuestas para activar el Ghostwriter."
            }
          />
        </div>
      </div>

      <article className="lead-post">
        <p className="reddit-body" style={{ fontSize: 13 }}>
          {lead.body?.trim()
            ? lead.body
            : "No hay cuerpo disponible para este post. Abrí el detalle para revisar el contexto completo antes de responder."}
        </p>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
          <span style={{ color: "#6B6B6E", fontSize: 12, fontWeight: 700 }}>
            {lead.score ?? 0} score
          </span>
          <span style={{ color: "#6B6B6E", fontSize: 12, fontWeight: 700 }}>
            {lead.num_comments ?? 0} comentarios
          </span>
          <a
            href={`https://reddit.com${lead.permalink}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#E07000", fontSize: 12, fontWeight: 800, textDecoration: "none" }}
          >
            Ver post en Reddit
          </a>
        </div>
      </article>

      <div />

      <div className="lead-comment-box">
        <p className="section-title" style={{ fontSize: 14, marginBottom: 10 }}>
          Reply Generator
        </p>
        <div className="comment-surface">
          Generá una respuesta humana, útil y contextual. ReddProwl prepara
          variantes por tono y mantiene protección anti-spam antes de abrir Reddit.
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <Button asChild className="h-8 rounded-[8px] px-3 font-extrabold">
            <Link href={`/leads/${lead.id}?projectId=${projectId}`}>
              Generar respuestas
            </Link>
          </Button>
          <Button asChild variant="secondary" className="h-8 rounded-[8px] bg-[#1C1C1E] px-3 font-extrabold text-white hover:bg-[#2D2D30]">
            <a href={`https://reddit.com${lead.permalink}`} target="_blank" rel="noreferrer">
              Abrir Reddit
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FeatureNote({ title, text }: { title: string; text: string }) {
  return (
    <Card className="gap-0 rounded-[8px] border border-[#F0F0EE] py-0 shadow-none ring-0">
      <CardContent className="p-3">
        <p style={{ fontSize: 12, fontWeight: 900, color: "#1C1C1E" }}>{title}</p>
        <p style={{ fontSize: 11, lineHeight: 1.45, color: "#6B6B6E", marginTop: 5 }}>
          {text}
        </p>
      </CardContent>
    </Card>
  );
}

function ProjectFooter({
  lastScrapedAt,
  language,
}: {
  lastScrapedAt: string | null;
  language: string;
}) {
  return (
    <div
      style={{
        borderTop: "1px solid #F0F0EE",
        padding: "10px 14px",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        color: "#AEAEB2",
        fontSize: 11,
        fontWeight: 700,
        background: "#FFFFFF",
      }}
    >
      <span>{lastScrapedAt ? `Último scan ${formatDate(lastScrapedAt)}` : "Scan pendiente"}</span>
      <span>{language.toUpperCase()}</span>
    </div>
  );
}

function parseStatus(status?: string): LeadDTO["status"] | undefined {
  if (status === "new" || status === "replied" || status === "irrelevant") {
    return status;
  }
  return undefined;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRelative(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function translateStatus(status: LeadDTO["status"]) {
  const labels: Record<LeadDTO["status"], string> = {
    new: "New",
    reviewing: "New",
    replied: "Replied",
    won: "Replied",
    lost: "Irrelevant",
    irrelevant: "Irrelevant",
  };

  return labels[status];
}

function ScorePill({ score }: { score: number | null }) {
  const val = score ?? 0;
  let bg = "#E5E5EA";
  let color = "#8E8E93";

  if (val >= 80) {
    bg = "#E07000";
    color = "#FFFFFF";
  } else if (val >= 60) {
    bg = "#FF9F40";
    color = "#FFFFFF";
  } else if (val >= 40) {
    bg = "#F5F5F3";
    color = "#6B6B6E";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 36,
        padding: "3px 9px",
        borderRadius: 7,
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "-0.02em",
        background: bg,
        color,
      }}
    >
      {score ?? "–"}
    </span>
  );
}

function StatusPill({ status }: { status: LeadDTO["status"] }) {
  const styles: Record<LeadDTO["status"], { bg: string; color: string }> = {
    new:        { bg: "#FFF3E8", color: "#C96500" },
    reviewing:  { bg: "#FFF3E8", color: "#C96500" },
    replied:    { bg: "#F0FDF4", color: "#15803D" },
    won:        { bg: "#F0FDF4", color: "#15803D" },
    lost:       { bg: "#F5F5F3", color: "#8E8E93" },
    irrelevant: { bg: "#F5F5F3", color: "#8E8E93" },
  };

  const s = styles[status] ?? { bg: "#F5F5F3", color: "#8E8E93" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 7,
        fontSize: 11,
        fontWeight: 800,
        background: s.bg,
        color: s.color,
      }}
    >
      {translateStatus(status)}
    </span>
  );
}

function InboxIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v12.5A2.75 2.75 0 0 1 17.25 21H6.75A2.75 2.75 0 0 1 4 18.25V5.75Z" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4.5 13h4.1c.6 0 .9.35 1.15.88L10.2 15h3.6l.45-1.12c.25-.53.55-.88 1.15-.88h4.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

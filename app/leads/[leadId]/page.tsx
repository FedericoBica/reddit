import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CopyButton } from "@/app/components/copy-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import type { LeadDTO } from "@/db/schemas/domain";
import {
  generateLeadRepliesFromForm,
  updateLeadStatusFromForm,
  useLeadReplyFromForm,
} from "@/modules/leads/actions";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";

export const metadata: Metadata = {
  title: "Lead",
};

type LeadPageProps = {
  params: Promise<{
    leadId: string;
  }>;
  searchParams?: Promise<{
    projectId?: string;
  }>;
};

const STATUS_OPTIONS: { value: LeadDTO["status"]; label: string }[] = [
  { value: "new", label: "Nuevo" },
  { value: "reviewing", label: "Revisando" },
  { value: "replied", label: "Respondido" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
  { value: "irrelevant", label: "Irrelevante" },
];

export default async function LeadPage({ params, searchParams }: LeadPageProps) {
  const user = await requireUser("/dashboard");
  const { leadId } = await params;
  const query = await searchParams;
  const projectState = await resolveCurrentProject(query?.projectId);

  if (projectState.status === "missing") {
    redirect("/bootstrap");
  }

  const { currentProject, projects } = projectState;
  const [lead, replies, recentLeads] = await Promise.all([
    getLeadById(currentProject.id, leadId),
    listLeadReplies(currentProject.id, leadId),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  if (!lead) {
    notFound();
  }

  const newLeadsCount = recentLeads.filter((item) => item.status === "new").length;
  const returnTo = `/leads/${lead.id}?projectId=${currentProject.id}`;

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={newLeadsCount}
    >
      <section className="app-page">
        <header className="page-header">
          <div>
            <Link
              href={`/dashboard?projectId=${currentProject.id}`}
              style={{
                display: "inline-flex",
                color: "#E07000",
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                marginBottom: 14,
              }}
            >
              Volver al Searchbox
            </Link>
            <p className="page-kicker">r/{lead.subreddit}</p>
            <h1 className="page-title">{lead.title}</h1>
            <p className="page-copy">
              {lead.author ? `u/${lead.author}` : "Autor desconocido"} ·{" "}
              {lead.created_utc ? formatDate(lead.created_utc) : "fecha desconocida"}
            </p>
          </div>
          <ScoreBadge score={lead.intent_score} />
        </header>

        <div className="content-flow">
          <div className="detail-layout">
            <div style={{ display: "grid", gap: 20 }}>
              <section className="panel panel-pad">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    alignItems: "flex-start",
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <p className="section-title">Conversación original</p>
                    <p className="section-copy" style={{ marginTop: 6 }}>
                      Score Reddit {lead.score ?? 0} · {lead.num_comments ?? 0} comentarios
                    </p>
                  </div>
                  <a
                    className="button button-quiet"
                    href={`https://reddit.com${lead.permalink}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir Reddit
                  </a>
                </div>

                <p className="reddit-body">
                  {lead.body?.trim() ? lead.body : "Este lead no tiene cuerpo de post disponible."}
                </p>
              </section>

              <section className="panel panel-pad">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 18,
                  }}
                >
                  <div>
                    <p className="section-title">Respuestas con IA</p>
                    <p className="section-copy" style={{ marginTop: 6 }}>
                      Generá opciones, copiá la que prefieras y abrí Reddit.
                    </p>
                  </div>

                  <form action={generateLeadRepliesFromForm}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input type="hidden" name="leadId" value={lead.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={lead.reply_generation_status === "generating"}
                    >
                      {lead.reply_generation_status === "generating"
                        ? "Generando..."
                        : "Generar replies"}
                    </button>
                  </form>
                </div>

                {lead.reply_generation_error && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#FEF2F2",
                      color: "#991B1B",
                      fontSize: 13,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    {lead.reply_generation_error}
                  </div>
                )}

                <div style={{ display: "grid", gap: 12 }}>
                  {replies.length > 0 ? (
                    replies.map((reply) => (
                      <article className="panel panel-pad" key={reply.id} style={{ background: "#FFFDFB" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                            marginBottom: 12,
                          }}
                        >
                          <span className="badge" style={{ background: "#FFF3E8", color: "#E07000" }}>
                            {reply.style}
                          </span>
                          {reply.was_used && (
                            <span className="badge" style={{ background: "#D1FAE5", color: "#065F46" }}>
                              Usada
                            </span>
                          )}
                        </div>
                        <p className="reddit-body" style={{ fontSize: 14 }}>{reply.content}</p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                            marginTop: 16,
                          }}
                        >
                          <CopyButton text={reply.content} permalink={lead.permalink} />
                          <form action={useLeadReplyFromForm}>
                            <input type="hidden" name="projectId" value={currentProject.id} />
                            <input type="hidden" name="leadId" value={lead.id} />
                            <input type="hidden" name="replyId" value={reply.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <button className="button button-quiet" type="submit">
                              Marcar como usada
                            </button>
                          </form>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="section-title">Todavía no hay respuestas</p>
                      <p className="section-copy" style={{ marginTop: 8 }}>
                        Generá variantes cuando tengas claro si querés responder
                        directo, consultivo o con más contexto.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside style={{ display: "grid", gap: 20 }}>
              <section className="panel panel-pad">
                <p className="section-title">Estado del lead</p>
                <form action={updateLeadStatusFromForm} style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <input type="hidden" name="projectId" value={currentProject.id} />
                  <input type="hidden" name="leadId" value={lead.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <select className="select" name="status" defaultValue={lead.status}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button className="button button-secondary" type="submit">
                    Actualizar estado
                  </button>
                </form>
              </section>

              <section className="panel panel-pad">
                <p className="section-title">Señales detectadas</p>
                <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                  <SideFact label="Intent score" value={String(lead.intent_score ?? "Sin score")} />
                  <SideFact label="Sentimiento" value={translateSentiment(lead.sentiment)} />
                  <SideFact label="Región" value={lead.region_score === null ? "Sin dato" : `${lead.region_score}/10`} />
                  <SideFact label="Keywords" value={lead.keywords_matched.join(", ") || "Sin keywords"} />
                </div>
              </section>

              {lead.classification_reason && (
                <section className="panel panel-pad">
                  <p className="section-title">Por qué importa</p>
                  <p className="section-copy" style={{ marginTop: 10 }}>
                    {lead.classification_reason}
                  </p>
                </section>
              )}
            </aside>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  return (
    <div
      style={{
        minWidth: 88,
        minHeight: 88,
        borderRadius: 8,
        background: "#E07000",
        color: "#FFF",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 12px 30px rgba(224, 112, 0, 0.22)",
      }}
    >
      <span style={{ fontSize: 34, lineHeight: 1, fontWeight: 900 }}>{score ?? "-"}</span>
      <span style={{ fontSize: 11, fontWeight: 800, marginTop: -14 }}>intent</span>
    </div>
  );
}

function SideFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: "#8E8E93", fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: "#1C1C1E", fontSize: 14, lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

function translateSentiment(sentiment: LeadDTO["sentiment"]) {
  if (sentiment === "positive") return "Positivo";
  if (sentiment === "negative") return "Negativo";
  if (sentiment === "neutral") return "Neutral";
  return "Sin dato";
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

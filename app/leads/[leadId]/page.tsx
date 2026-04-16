import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CopyButton } from "@/app/components/copy-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLeadById, listProjectLeads } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import type { LeadDTO, LeadReplyDTO } from "@/db/schemas/domain";
import {
  generateLeadRepliesFromForm,
  snoozeLeadFromForm,
  unsnoozeLeadFromForm,
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

export default async function LeadPage({ params, searchParams }: LeadPageProps) {
  const user = await requireUser("/dashboard");
  const { leadId } = await params;
  const query = await searchParams;
  const projectState = await resolveCurrentProject(query?.projectId);
  const t = await getTranslations("leads");
  const tStatus = await getTranslations("status");

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

  const STATUS_OPTIONS: { value: LeadDTO["status"]; label: string }[] = [
    { value: "new", label: tStatus("new") },
    { value: "replied", label: tStatus("replied") },
    { value: "irrelevant", label: tStatus("irrelevant") },
  ];

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
              {t("backToSearchbox")}
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
              <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
                <CardContent className="p-5">
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
                    <Button asChild variant="outline" className="h-9 rounded-[8px] font-extrabold">
                      <a href={`https://reddit.com${lead.permalink}`} target="_blank" rel="noreferrer">
                        {t("viewOnReddit")}
                      </a>
                    </Button>
                  </div>

                  <p className="reddit-body">
                    {lead.body?.trim() ? lead.body : "Este lead no tiene cuerpo de post disponible."}
                  </p>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
                <CardContent className="p-5">
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
                      <p className="section-title">{t("replies")}</p>
                      <p className="section-copy" style={{ marginTop: 6 }}>
                        Generá opciones, copiá la que prefieras y abrí Reddit.
                      </p>
                    </div>

                    <form action={generateLeadRepliesFromForm}>
                      <input type="hidden" name="projectId" value={currentProject.id} />
                      <input type="hidden" name="leadId" value={lead.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button
                        className="h-9 rounded-[8px] font-extrabold"
                        type="submit"
                        disabled={lead.reply_generation_status === "generating"}
                      >
                        {lead.reply_generation_status === "generating"
                          ? t("generating")
                          : t("generateReplies")}
                      </Button>
                    </form>
                  </div>

                  {lead.reply_generation_error && (
                    <Card className="mb-3 gap-0 rounded-[8px] border-[#FEE2E2] bg-[#FEF2F2] py-0 text-[#991B1B] shadow-none ring-0">
                      <CardContent className="p-3 text-[13px] leading-5">
                        {lead.reply_generation_error}
                      </CardContent>
                    </Card>
                  )}

                  <div style={{ display: "grid", gap: 12 }}>
                    {replies.length > 0 ? (
                      replies.map((reply) => (
                        <Card className="gap-0 rounded-[10px] border-[#F0F0EE] bg-[#FFFDFB] py-0 ring-0" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }} key={reply.id}>
                          <CardContent className="p-5">
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                marginBottom: 12,
                              }}
                            >
                              <Badge variant="secondary" className="rounded-[7px] bg-[#FFF3E8] font-extrabold text-[#E07000]">
                                {reply.style}
                              </Badge>
                              {reply.was_used && (
                                <Badge variant="secondary" className="rounded-[7px] bg-[#D1FAE5] font-extrabold text-[#065F46]">
                                  {t("replyUsed")}
                                </Badge>
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
                                <Button variant="outline" className="h-9 rounded-[8px] font-extrabold" type="submit">
                                  {t("useReply")}
                                </Button>
                              </form>
                            </div>
                          </CardContent>
                        </Card>
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
                </CardContent>
              </Card>
            </div>

            <aside style={{ display: "grid", gap: 20 }}>
              <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
                <CardContent className="p-5">
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
                    <Button className="h-9 rounded-[8px] bg-[#1C1C1E] font-extrabold text-white hover:bg-[#2D2D30]" type="submit">
                      Actualizar estado
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
                <CardContent className="p-5">
                  <p className="section-title">Señales detectadas</p>
                  <div style={{ display: "grid", gap: 14, marginTop: 16 }}>
                    <SideFact label={t("intentScore")} value={String(lead.intent_score ?? "Sin score")} />
                    <SideFact label="Sentimiento" value={translateSentiment(lead.sentiment)} />
                    <SideFact label="Región" value={lead.region_score === null ? "Sin dato" : `${lead.region_score}/10`} />
                    <SideFact label="Keywords" value={lead.keywords_matched.join(", ") || "Sin keywords"} />
                  </div>
                </CardContent>
              </Card>

              {lead.classification_reason && (
                <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
                  <CardContent className="p-5">
                    <p className="section-title">Por qué importa</p>
                    <p className="section-copy" style={{ marginTop: 10 }}>
                      {lead.classification_reason}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Snooze */}
              <SnoozeCard
                lead={lead}
                projectId={currentProject.id}
                returnTo={returnTo}
                labels={{ snooze: t("snooze"), unsnooze: t("unsnooze") }}
              />

              {/* Battlecards */}
              <BattlecardsCard keywords={lead.keywords_matched} body={lead.body} />

              {/* Ghostwriter */}
              <GhostwriterCard
                replies={replies}
                projectId={currentProject.id}
                leadId={lead.id}
              />
            </aside>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Battlecards ───────────────────────────────────────────────

const COMPETITOR_HINTS = [
  "vs", "alternative", "alternativa", "instead of", "switch from",
  "switching from", "mejor que", "better than", "compare", "comparison",
  "vs ", " or ", " o ", "hubspot", "salesforce", "pipedrive", "zoho",
];

function detectCompetitors(keywords: string[], body: string | null): string[] {
  const text = `${keywords.join(" ")} ${body ?? ""}`.toLowerCase();
  return keywords.filter((kw) => {
    const k = kw.toLowerCase();
    return COMPETITOR_HINTS.some((hint) => k.includes(hint) || text.includes(hint + " " + k));
  });
}

function BattlecardsCard({ keywords, body }: { keywords: string[]; body: string | null }) {
  const competitors = detectCompetitors(keywords, body);

  if (competitors.length === 0) {
    return (
      <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
        <CardContent className="p-5">
          <p className="section-title">⚔️ Battlecards</p>
          <p className="section-copy" style={{ marginTop: 8 }}>
            No se detectaron menciones de competidores en este lead. Las Battlecards aparecen cuando keywords del tipo competidor están presentes.
          </p>
        </CardContent>
      </Card>
    );
  }

  const angles = [
    "Resaltá tu diferencial principal sin nombrar al competidor directamente.",
    "Enfocate en casos de uso donde tu solución gana (velocidad de setup, pricing, integrations).",
    "Ofrecé una comparación honesta: mencioná los trade-offs y por qué tu enfoque es mejor para este caso.",
  ];

  return (
    <Card
      className="gap-0 rounded-[8px] py-0 shadow-none ring-0"
      style={{ border: "1px solid rgba(224,112,0,0.2)", background: "#FFFDFB" }}
    >
      <CardContent className="p-5">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <p className="section-title">⚔️ Battlecards</p>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 7px",
              borderRadius: 5,
              background: "#FEF3C7",
              color: "#92400E",
            }}
          >
            {competitors.length} señal{competitors.length !== 1 ? "es" : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {competitors.map((c) => (
            <span
              key={c}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 5,
                background: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FECACA",
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, fontWeight: 800, color: "#92400E", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Ángulos de respuesta
        </p>
        <div style={{ display: "grid", gap: 8 }}>
          {angles.map((angle, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 900,
                  color: "#E07000",
                  background: "#FFF3E8",
                  padding: "2px 5px",
                  borderRadius: 3,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                0{i + 1}
              </span>
              <p style={{ fontSize: 12, lineHeight: 1.5, color: "#6B6B6E" }}>{angle}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Ghostwriter ────────────────────────────────────────────────

function GhostwriterCard({
  replies,
  projectId,
  leadId,
}: {
  replies: LeadReplyDTO[];
  projectId: string;
  leadId: string;
}) {
  const usedReply = replies.find((r) => r.was_used);
  const hasReplies = replies.length > 0;

  return (
    <Card
      className="gap-0 rounded-[8px] py-0 shadow-none ring-0"
      style={{
        border: hasReplies ? "1px solid #BBF7D0" : "1px solid #F0F0EE",
        background: hasReplies ? "#F0FDF4" : "#FFFFFF",
      }}
    >
      <CardContent className="p-5">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <p className="section-title">💬 Ghostwriter</p>
          {hasReplies && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 7px",
                borderRadius: 5,
                background: "#D1FAE5",
                color: "#065F46",
              }}
            >
              {replies.length} reply{replies.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {hasReplies ? (
          <div style={{ display: "grid", gap: 8 }}>
            {usedReply && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#DCFCE7",
                  border: "1px solid #86EFAC",
                }}
              >
                <p style={{ fontSize: 10, fontWeight: 800, color: "#15803D", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Respuesta usada
                </p>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "#1C1C1E",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {usedReply.content}
                </p>
              </div>
            )}
            <p className="section-copy" style={{ fontSize: 12 }}>
              Seguí el hilo en Reddit para ver si contestaron y generá el siguiente mensaje desde Threads.
            </p>
            <Link
              href={`/threads?projectId=${projectId}&leadId=${leadId}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                background: "#1C1C1E",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                textAlign: "center",
              }}
            >
              Ver en Threads →
            </Link>
          </div>
        ) : (
          <p className="section-copy" style={{ fontSize: 12 }}>
            Generá una respuesta y el Ghostwriter monitoreará el hilo para ayudarte a seguir la conversación hasta el DM.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Snooze ────────────────────────────────────────────────────

function SnoozeCard({
  lead,
  projectId,
  returnTo,
  labels,
}: {
  lead: LeadDTO;
  projectId: string;
  returnTo: string;
  labels: { snooze: string; unsnooze: string };
}) {
  const isSnoozed =
    lead.snoozed_until != null && new Date(lead.snoozed_until) > new Date();

  if (isSnoozed) {
    return (
      <Card className="gap-0 rounded-[8px] border-[#E0E7FF] bg-[#EEF2FF] py-0 shadow-none ring-0">
        <CardContent className="p-5">
          <p className="section-title" style={{ color: "#3730A3" }}>
            💤 Snoozed
          </p>
          <p style={{ fontSize: 12, color: "#6366F1", marginTop: 6, marginBottom: 14 }}>
            Visible de nuevo el{" "}
            <strong>{formatSnoozeDate(lead.snoozed_until!)}</strong>
          </p>
          <form action={unsnoozeLeadFromForm}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="leadId" value={lead.id} />
            <Button
              variant="outline"
              className="h-8 w-full rounded-[8px] border-[#6366F1] font-bold text-[#3730A3]"
              type="submit"
            >
              {labels.unsnooze}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  const presets = [
    { label: "Mañana", offsetDays: 1 },
    { label: "3 días", offsetDays: 3 },
    { label: "Semana", offsetDays: 7 },
    { label: "2 semanas", offsetDays: 14 },
  ];

  return (
    <Card className="gap-0 rounded-[8px] border-[#F0F0EE] py-0 shadow-none ring-0">
      <CardContent className="p-5">
        <p className="section-title">💤 {labels.snooze}</p>
        <p className="section-copy" style={{ marginTop: 6, marginBottom: 14 }}>
          Ocultá este lead temporalmente y vuelve a aparecer cuando estés listo.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {presets.map((preset) => (
            <form key={preset.label} action={snoozeLeadFromForm}>
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <input
                type="hidden"
                name="snoozedUntil"
                value={addDays(preset.offsetDays).toISOString()}
              />
              <Button
                variant="outline"
                className="h-8 w-full rounded-[8px] text-xs font-bold"
                type="submit"
              >
                {preset.label}
              </Button>
            </form>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function addDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

function formatSnoozeDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function ScoreBadge({ score }: { score: number | null }) {
  const val = score ?? 0;
  let bg = "#8E8E93";
  let glow = "rgba(142,142,147,0.18)";

  if (val >= 80) {
    bg = "#E07000";
    glow = "rgba(224,112,0,0.22)";
  } else if (val >= 60) {
    bg = "#FF9F40";
    glow = "rgba(255,159,64,0.22)";
  }

  return (
    <div
      style={{
        minWidth: 88,
        minHeight: 88,
        borderRadius: 12,
        background: bg,
        color: "#FFF",
        display: "grid",
        placeItems: "center",
        boxShadow: `0 12px 32px ${glow}`,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 36, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.04em" }}>
        {score ?? "–"}
      </span>
      <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.75, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
        intent
      </span>
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

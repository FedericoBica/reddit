import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { CopyButton } from "@/app/components/copy-button";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listProjectLeadsWithReplies } from "@/db/queries/leads";
import { listLeadReplies } from "@/db/queries/lead-replies";
import { listProjectLeads } from "@/db/queries/leads";
import type { LeadDTO, LeadReplyDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Threads",
};

type ThreadsPageProps = {
  searchParams?: Promise<{
    projectId?: string;
    leadId?: string;
  }>;
};

export default async function ThreadsPage({ searchParams }: ThreadsPageProps) {
  const user = await requireUser("/threads");
  const params = await searchParams;
  const locale = await getLocale();
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;
  const isEs = locale.startsWith("es");
  const isPt = locale.startsWith("pt");
  const copy = {
    title: isEs ? "Threads · conversaciones" : isPt ? "Threads · conversas" : "Threads · conversations",
    activeThreads: isEs ? "threads activos" : isPt ? "threads ativos" : "active threads",
    onlyReplies: isEs ? "Solo aparecen leads con replies generadas" : isPt ? "Apenas leads com respostas geradas aparecem aqui" : "Only leads with generated replies appear here",
    detailAria: isEs ? "Detalle del thread" : isPt ? "Detalhe da thread" : "Thread detail",
    reply: isEs ? "respuesta" : isPt ? "resposta" : "reply",
    replies: isEs ? "respuestas" : isPt ? "respostas" : "replies",
    used: isEs ? "Usada ✓" : isPt ? "Usada ✓" : "Used ✓",
    noBody: isEs ? "No hay cuerpo disponible para este post." : isPt ? "Não há corpo disponível para este post." : "No body available for this post.",
    redditScore: isEs ? "score Reddit" : isPt ? "score do Reddit" : "Reddit score",
    comments: isEs ? "comentarios" : isPt ? "comentários" : "comments",
    viewOnReddit: isEs ? "Ver en Reddit →" : isPt ? "Ver no Reddit →" : "View on Reddit →",
    ghostwriter: isEs ? "Ghostwriter" : isPt ? "Ghostwriter" : "Ghostwriter",
    generatedReply: isEs ? "respuesta generada" : isPt ? "resposta gerada" : "generated reply",
    generatedReplies: isEs ? "respuestas generadas" : isPt ? "respostas geradas" : "generated replies",
    generateMore: isEs ? "Generar más →" : isPt ? "Gerar mais →" : "Generate more →",
    noGeneratedReplies: isEs ? "Sin respuestas generadas" : isPt ? "Sem respostas geradas" : "No generated replies",
    noGeneratedRepliesBody: isEs ? "Esto no debería pasar — este lead está marcado como con replies. Revisá desde el detalle." : isPt ? "Isso não deveria acontecer — este lead está marcado com respostas. Revise a partir do detalhe." : "This shouldn't happen — this lead is marked as having replies. Review it from the detail view.",
    followThread: isEs ? "Seguir el hilo" : isPt ? "Acompanhar a thread" : "Follow the thread",
    followThreadBody: isEs ? "Abrí el post en Reddit para responder o ver si alguien te contestó." : isPt ? "Abra o post no Reddit para responder ou ver se alguém respondeu." : "Open the post on Reddit to reply or see if anyone replied back.",
    viewFullLead: isEs ? "Ver lead completo" : isPt ? "Ver lead completo" : "View full lead",
    openReddit: isEs ? "Abrir Reddit" : isPt ? "Abrir Reddit" : "Open Reddit",
    engaging: isEs ? "Atractiva" : isPt ? "Envolvente" : "Engaging",
    direct: isEs ? "Directo" : isPt ? "Direto" : "Direct",
    balanced: isEs ? "Balanceado" : isPt ? "Equilibrado" : "Balanced",
    custom: isEs ? "Personalizada" : isPt ? "Personalizada" : "Custom",
    noThreads: isEs ? "Sin threads activas" : isPt ? "Sem threads ativas" : "No active threads",
    noThreadsBody: isEs ? "Los threads aparecen cuando generás respuestas para un lead desde el Searchbox. Empezá por ahí." : isPt ? "As threads aparecem quando você gera respostas para um lead no Searchbox. Comece por lá." : "Threads appear when you generate replies for a lead from Searchbox. Start there.",
    goSearchbox: isEs ? "Ir al Searchbox →" : isPt ? "Ir para o Searchbox →" : "Go to Searchbox →",
    statusNew: isEs ? "Nuevo" : isPt ? "Novo" : "New",
    statusReviewing: isEs ? "Revisando" : isPt ? "Em revisão" : "Reviewing",
    statusReplied: isEs ? "Respondido" : isPt ? "Respondido" : "Replied",
    statusWon: isEs ? "Ganado" : isPt ? "Ganho" : "Won",
    statusLost: isEs ? "Perdido" : isPt ? "Perdido" : "Lost",
    statusIrrelevant: isEs ? "Irrelevante" : isPt ? "Irrelevante" : "Irrelevant",
    dateLocale: isEs ? "es" : isPt ? "pt" : "en",
    minutesAgo: isEs ? "m atrás" : isPt ? "min atrás" : "m ago",
    hoursAgo: isEs ? "h atrás" : isPt ? "h atrás" : "h ago",
    daysAgo: isEs ? "d atrás" : isPt ? "d atrás" : "d ago",
  };


  const [threads, allLeads] = await Promise.all([
    listProjectLeadsWithReplies(currentProject.id, 50),
    listProjectLeads({ projectId: currentProject.id, limit: 100, page: 0 }),
  ]);

  const newLeadsCount = allLeads.filter((l) => l.status === "new").length;

  // Pick the selected thread — from URL param or first in list
  const selectedId = params?.leadId ?? threads[0]?.id ?? null;
  const selectedThread = threads.find((t) => t.id === selectedId) ?? threads[0] ?? null;

  const selectedReplies = selectedThread
    ? await listLeadReplies(currentProject.id, selectedThread.id)
    : [];

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}

    >
      <section className="searchbox-workspace">
        {/* Header */}
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <div className="ds-topbar-icon">◈</div>
            <div className="ds-topbar-titles">
              <h1 className="ds-topbar-title">{copy.title.split(" · ")[0]} · <em>{copy.title.split(" · ")[1]}</em></h1>
              <div className="ds-topbar-sub">
                <span><strong>{threads.length}</strong> {copy.activeThreads}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="searchbox-body">
          {/* ── Thread list ── */}
          <section className="opportunity-column" aria-label="Threads">

            <div className="opportunity-list">
              {threads.length > 0 ? (
                threads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    projectId={currentProject.id}
                    active={thread.id === selectedThread?.id}
                    copy={copy}
                  />
                ))
              ) : (
                <EmptyThreads copy={copy} />
              )}
            </div>

            <div
              style={{
                borderTop: "1px solid #F0F0EE",
                padding: "10px 14px",
                fontSize: 11,
                fontWeight: 700,
                color: "#B0B0B5",
                background: "#FFFFFF",
              }}
            >
              {copy.onlyReplies}
            </div>
          </section>

          {/* ── Thread detail ── */}
          {selectedThread ? (
            <ThreadDetail
              thread={selectedThread}
              replies={selectedReplies}
              projectId={currentProject.id}
              copy={copy}
            />
          ) : (
            <section className="detail-pane">
              <div className="detail-content">
                <EmptyThreads copy={copy} />
              </div>
            </section>
          )}
        </div>
      </section>
    </DashboardShell>
  );
}

// ── Thread card (left list) ───────────────────────────────────

function ThreadCard({
  thread,
  projectId,
  active,
  copy,
}: {
  thread: LeadDTO;
  projectId: string;
  active: boolean;
  copy: {
    comments: string;
    statusNew: string;
    statusReviewing: string;
    statusReplied: string;
    statusWon: string;
    statusLost: string;
    statusIrrelevant: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
  };
}) {
  const statusColor: Record<LeadDTO["status"], string> = {
    new: "#FF4500",
    reviewing: "#3B82F6",
    replied: "#8B5CF6",
    won: "#22C55E",
    lost: "#EF4444",
    irrelevant: "#D1D1D6",
  };

  return (
    <Link
      href={`/threads?projectId=${projectId}&leadId=${thread.id}`}
      className={`opportunity-card${active ? " opportunity-card-active" : ""}`}
    >
      <div className="opportunity-meta">
        <span
          className="opportunity-dot"
          style={{ background: statusColor[thread.status] ?? "#F1744D" }}
        />
        <span>r/{thread.subreddit}</span>
        <span>{thread.created_at ? formatRelative(thread.created_at, copy) : ""}</span>
        {thread.num_comments != null && (
          <span>{thread.num_comments} {copy.comments}</span>
        )}
      </div>
      <h2 className="opportunity-heading">{thread.title}</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "2px 7px",
            borderRadius: 5,
            background: "#EFF6FF",
            color: "#1D4ED8",
          }}
        >
          {translateStatus(thread.status, copy)}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            padding: "3px 8px",
            borderRadius: 6,
            background: (thread.intent_score ?? 0) >= 80 ? "#FF4500" : "#7C7C83",
            color: "#FFF",
          }}
        >
          {thread.intent_score ?? "–"}
        </span>
      </div>
    </Link>
  );
}

// ── Thread detail (right pane) ────────────────────────────────

function ThreadDetail({
  thread,
  replies,
  projectId,
  copy,
}: {
  thread: LeadDTO;
  replies: LeadReplyDTO[];
  projectId: string;
  copy: {
    detailAria: string;
    reply: string;
    replies: string;
    used: string;
    noBody: string;
    redditScore: string;
    comments: string;
    viewOnReddit: string;
    ghostwriter: string;
    generatedReply: string;
    generatedReplies: string;
    generateMore: string;
    noGeneratedReplies: string;
    noGeneratedRepliesBody: string;
    followThread: string;
    followThreadBody: string;
    viewFullLead: string;
    openReddit: string;
    engaging: string;
    direct: string;
    balanced: string;
    custom: string;
  };
}) {
  const usedReply = replies.find((r) => r.was_used);

  return (
    <section className="detail-pane" aria-label={copy.detailAria}>
      {/* Topbar */}
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" />
          <span>r/{thread.subreddit}</span>
          <span>{thread.created_at ? formatDate(thread.created_at, copy) : ""}</span>
          {thread.author && <span>u/{thread.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge
            variant="secondary"
            className="rounded-[7px] bg-[#EFF6FF] font-extrabold text-[#1D4ED8]"
          >
            {replies.length} {replies.length === 1 ? copy.reply : copy.replies}
          </Badge>
          {usedReply && (
            <Badge
              variant="secondary"
              className="rounded-[7px] bg-[#D1FAE5] font-extrabold text-[#065F46]"
            >
              {copy.used}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="detail-content">
        <h2
          style={{
            fontSize: 22,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            fontWeight: 900,
            color: "#1A1A1B",
            marginBottom: 14,
          }}
        >
          {thread.title}
        </h2>

        {/* Keywords */}
        {thread.keywords_matched.length > 0 && (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
            {thread.keywords_matched.slice(0, 5).map((kw) => (
              <Badge
                key={kw}
                variant="secondary"
                className="rounded-[7px] bg-[#FFF3EC] font-extrabold text-[#FF4500]"
              >
                {kw}
              </Badge>
            ))}
          </div>
        )}

        {/* Post body */}
        <div
          style={{
            background: "#FBFBFA",
            border: "1px solid #F0F0EE",
            borderRadius: 10,
            padding: "16px 18px",
            marginBottom: 20,
          }}
        >
          <p className="reddit-body" style={{ fontSize: 13 }}>
            {thread.body?.trim()
              ? thread.body
              : copy.noBody}
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginTop: 14,
              paddingTop: 12,
              borderTop: "1px solid #F0F0EE",
            }}
          >
            <span style={{ color: "#7C7C83", fontSize: 12, fontWeight: 700 }}>
              {thread.score ?? 0} {copy.redditScore}
            </span>
            <span style={{ color: "#7C7C83", fontSize: 12, fontWeight: 700 }}>
              {thread.num_comments ?? 0} {copy.comments}
            </span>
            <a
              href={toRedditUrl(thread.permalink)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#FF4500", fontSize: 12, fontWeight: 800, textDecoration: "none", marginLeft: "auto" }}
            >
              {copy.viewOnReddit}
            </a>
          </div>
        </div>

        {/* Replies — Ghostwriter view */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}
          >
            <p className="section-title">
              {copy.ghostwriter} — {replies.length} {replies.length === 1 ? copy.generatedReply : copy.generatedReplies}
            </p>
            <Button asChild variant="outline" className="h-8 rounded-[8px] font-extrabold">
              <Link href={`/leads/${thread.id}?projectId=${projectId}`}>
                {copy.generateMore}
              </Link>
            </Button>
          </div>

          {replies.length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} thread={thread} copy={copy} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="section-title">{copy.noGeneratedReplies}</p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                {copy.noGeneratedRepliesBody}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="lead-comment-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="section-title" style={{ fontSize: 13 }}>{copy.followThread}</p>
            <p className="section-copy" style={{ fontSize: 12, marginTop: 3 }}>
              {copy.followThreadBody}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button asChild className="h-8 rounded-[8px] px-3 font-extrabold">
              <Link href={`/leads/${thread.id}?projectId=${projectId}`}>
                {copy.viewFullLead}
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="h-8 rounded-[8px] bg-[#1A1A1B] px-3 font-extrabold text-white hover:bg-[#2D2D30]"
            >
              <a
                href={toRedditUrl(thread.permalink)}
                target="_blank"
                rel="noreferrer"
              >
                {copy.openReddit}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReplyCard({ reply, thread, copy }: { reply: LeadReplyDTO; thread: LeadDTO; copy: { engaging: string; direct: string; balanced: string; custom: string; used: string } }) {
  const styleLabel: Record<string, string> = {
    engaging: copy.engaging,
    direct: copy.direct,
    balanced: copy.balanced,
    custom: copy.custom,
  };

  return (
    <div
      style={{
        background: reply.was_used ? "#DEF2E2" : "#FAFAF8",
        border: `1px solid ${reply.was_used ? "#BBF7D0" : "#F0F0EE"}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: 5,
              background: "#FFF3EC",
              color: "#FF4500",
            }}
          >
            {styleLabel[reply.style] ?? reply.style}
          </span>
          {reply.was_used && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "2px 8px",
                borderRadius: 5,
                background: "#D1FAE5",
                color: "#065F46",
              }}
            >
              {copy.used}
            </span>
          )}
        </div>
        {reply.cost_usd && (
          <span style={{ fontSize: 10, color: "#B0B0B5", fontWeight: 700 }}>
            ${(reply.cost_usd * 1000).toFixed(2)}‰
          </span>
        )}
      </div>

      <p className="reddit-body" style={{ fontSize: 13 }}>
        {reply.content}
      </p>

      <div style={{ marginTop: 12 }}>
        <CopyButton text={reply.content} permalink={thread.permalink} />
      </div>
    </div>
  );
}

function EmptyThreads({ copy }: { copy: { noThreads: string; noThreadsBody: string; goSearchbox: string } }) {
  return (
    <div className="empty-state">
      <GhostwriterIcon />
      <p className="section-title" style={{ marginTop: 14 }}>{copy.noThreads}</p>
      <p className="section-copy" style={{ maxWidth: 380, margin: "10px auto 0" }}>
        {copy.noThreadsBody}
      </p>
      <div style={{ marginTop: 18 }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#FF4500",
            color: "#FFF",
            padding: "9px 18px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {copy.goSearchbox}
        </Link>
      </div>
    </div>
  );
}

// ── Utils ─────────────────────────────────────────────────────

function translateStatus(status: LeadDTO["status"], copy: Record<string, string>) {
  const map: Record<LeadDTO["status"], string> = {
    new: copy.statusNew,
    reviewing: copy.statusReviewing,
    replied: copy.statusReplied,
    won: copy.statusWon,
    lost: copy.statusLost,
    irrelevant: copy.statusIrrelevant,
  };
  return map[status] ?? status;
}

function formatDate(date: string, copy: Record<string, string>) {
  return new Intl.DateTimeFormat(copy.dateLocale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatRelative(dateStr: string, copy: Record<string, string>) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}${copy.minutesAgo}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}${copy.hoursAgo}`;
  return `${Math.floor(hours / 24)}${copy.daysAgo}`;
}

// ── Icons ─────────────────────────────────────────────────────

function GhostwriterIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true" style={{ margin: "0 auto", display: "block" }}>
      <rect width="44" height="44" rx="12" fill="#FFF3EC" />
      <path d="M13 17.5A4.5 4.5 0 0 1 17.5 13h9A4.5 4.5 0 0 1 31 17.5v4A4.5 4.5 0 0 1 26.5 26H23l-5 4v-4.1A4.5 4.5 0 0 1 13 21.5v-4Z" stroke="#FF4500" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M17 18h10M17 21.5h7" stroke="#FF4500" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

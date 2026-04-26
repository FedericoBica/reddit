import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;


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
      newLeadsCount={newLeadsCount}
    >
      <section className="searchbox-workspace">
        {/* Header */}
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <div className="ds-topbar-icon">◈</div>
            <div className="ds-topbar-titles">
              <h1 className="ds-topbar-title">Threads · <em>conversations</em></h1>
              <div className="ds-topbar-sub">
                <span><strong>{threads.length}</strong> active threads</span>
              </div>
            </div>
          </div>
        </header>

        <div className="searchbox-body">
          {/* ── Thread list ── */}
          <section className="opportunity-column" aria-label="Threads">
            <div className="opportunity-toolbar">
              <p style={{ fontSize: 12, fontWeight: 700, color: "#7C7C83" }}>
                {threads.length > 0
                  ? `${threads.length} conversación${threads.length !== 1 ? "es" : ""} activa${threads.length !== 1 ? "s" : ""}`
                  : "Sin threads aún"}
              </p>
            </div>

            <div className="opportunity-list">
              {threads.length > 0 ? (
                threads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    projectId={currentProject.id}
                    active={thread.id === selectedThread?.id}
                  />
                ))
              ) : (
                <EmptyThreads />
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
              Solo aparecen leads con replies generadas
            </div>
          </section>

          {/* ── Thread detail ── */}
          {selectedThread ? (
            <ThreadDetail
              thread={selectedThread}
              replies={selectedReplies}
              projectId={currentProject.id}
            />
          ) : (
            <section className="detail-pane">
              <div className="detail-content">
                <EmptyThreads />
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
}: {
  thread: LeadDTO;
  projectId: string;
  active: boolean;
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
        <span>{thread.created_at ? formatRelative(thread.created_at) : ""}</span>
        {thread.num_comments != null && (
          <span>{thread.num_comments} comentarios</span>
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
          {translateStatus(thread.status)}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 900,
            padding: "3px 8px",
            borderRadius: 6,
            background: (thread.intent_score ?? 0) >= 80 ? "#FF4500" : "#8E8E93",
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
}: {
  thread: LeadDTO;
  replies: LeadReplyDTO[];
  projectId: string;
}) {
  const usedReply = replies.find((r) => r.was_used);

  return (
    <section className="detail-pane" aria-label="Detalle del thread">
      {/* Topbar */}
      <div className="detail-topbar">
        <div className="opportunity-meta">
          <span className="opportunity-dot" />
          <span>r/{thread.subreddit}</span>
          <span>{thread.created_at ? formatDate(thread.created_at) : ""}</span>
          {thread.author && <span>u/{thread.author}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Badge
            variant="secondary"
            className="rounded-[7px] bg-[#EFF6FF] font-extrabold text-[#1D4ED8]"
          >
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </Badge>
          {usedReply && (
            <Badge
              variant="secondary"
              className="rounded-[7px] bg-[#D1FAE5] font-extrabold text-[#065F46]"
            >
              Usada ✓
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
              : "No hay cuerpo disponible para este post."}
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
              {thread.score ?? 0} score Reddit
            </span>
            <span style={{ color: "#7C7C83", fontSize: 12, fontWeight: 700 }}>
              {thread.num_comments ?? 0} comentarios
            </span>
            <a
              href={toRedditUrl(thread.permalink)}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#FF4500", fontSize: 12, fontWeight: 800, textDecoration: "none", marginLeft: "auto" }}
            >
              Ver en Reddit →
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
              Ghostwriter — {replies.length} {replies.length === 1 ? "respuesta generada" : "respuestas generadas"}
            </p>
            <Button asChild variant="outline" className="h-8 rounded-[8px] font-extrabold">
              <Link href={`/leads/${thread.id}?projectId=${projectId}`}>
                Generar más →
              </Link>
            </Button>
          </div>

          {replies.length > 0 ? (
            <div style={{ display: "grid", gap: 12 }}>
              {replies.map((reply) => (
                <ReplyCard key={reply.id} reply={reply} thread={thread} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="section-title">Sin respuestas generadas</p>
              <p className="section-copy" style={{ marginTop: 8 }}>
                Esto no debería pasar — este lead está marcado como con replies. Revisá desde el detalle.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="lead-comment-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p className="section-title" style={{ fontSize: 13 }}>Seguir el hilo</p>
            <p className="section-copy" style={{ fontSize: 12, marginTop: 3 }}>
              Abrí el post en Reddit para responder o ver si alguien te contestó.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button asChild className="h-8 rounded-[8px] px-3 font-extrabold">
              <Link href={`/leads/${thread.id}?projectId=${projectId}`}>
                Ver lead completo
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
                Abrir Reddit
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReplyCard({ reply, thread }: { reply: LeadReplyDTO; thread: LeadDTO }) {
  const styleLabel: Record<string, string> = {
    engaging: "Engaging",
    direct: "Directo",
    balanced: "Balanceado",
    custom: "Custom",
  };

  return (
    <div
      style={{
        background: reply.was_used ? "#F0FDF4" : "#FAFAF8",
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
              Usada ✓
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

function EmptyThreads() {
  return (
    <div className="empty-state">
      <GhostwriterIcon />
      <p className="section-title" style={{ marginTop: 14 }}>Sin threads activos</p>
      <p className="section-copy" style={{ maxWidth: 380, margin: "10px auto 0" }}>
        Los threads aparecen cuando generás respuestas para un lead desde el Searchbox. Empezá por ahí.
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
          Ir al Searchbox →
        </Link>
      </div>
    </div>
  );
}

// ── Utils ─────────────────────────────────────────────────────

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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectLeads } from "@/db/queries/leads";
import { listSearchboxResults } from "@/db/queries/searchbox";
import { listRepliedBrandMentions } from "@/db/queries/brand-mentions";
import { listRepliedXPosts } from "@/db/queries/x";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { toRedditUrl } from "@/lib/utils";

export const metadata: Metadata = { title: "Respondidos" };

type Props = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function RepliedArchivePage({ searchParams }: Props) {
  const user = await requireUser("/archive/replied");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;

  const [leads, searchboxResults, mentions, xPosts] = await Promise.all([
    listProjectLeads({ projectId: currentProject.id, status: "replied", limit: 100, page: 0 }),
    listSearchboxResults({ projectId: currentProject.id, status: "replied", limit: 100 }),
    listRepliedBrandMentions(currentProject.id),
    listRepliedXPosts(currentProject.id),
  ]);

  const isEmpty = leads.length === 0 && searchboxResults.length === 0 && mentions.length === 0 && xPosts.length === 0;

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page" style={{ maxWidth: 860, padding: "32px 28px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", color: "#1A1A1B" }}>
            Respondidos
          </h1>
          <p style={{ fontSize: 13, color: "#7C7C83", marginTop: 4 }}>
            Posts a los que ya respondiste. Se mantienen aquí como registro.
          </p>
        </div>

        {isEmpty ? (
          <EmptyState label="No hay posts respondidos todavía." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {leads.length > 0 && (
              <Section title="Oportunidades" count={leads.length}>
                {leads.map((lead) => (
                  <ArchiveCard
                    key={lead.id}
                    title={lead.title}
                    subreddit={`r/${lead.subreddit}`}
                    date={lead.replied_at ?? lead.created_at}
                    dateLabel="Respondido"
                    score={lead.intent_score}
                    reason={lead.classification_reason}
                    href={toRedditUrl(lead.permalink)}
                    source="reddit"
                  />
                ))}
              </Section>
            )}

            {searchboxResults.length > 0 && (
              <Section title="Searchbox" count={searchboxResults.length}>
                {searchboxResults.map((r) => (
                  <ArchiveCard
                    key={r.id}
                    title={r.title}
                    subreddit={`r/${r.subreddit}`}
                    date={r.created_at}
                    dateLabel="Encontrado"
                    score={r.intent_score}
                    reason={r.classification_reason}
                    href={toRedditUrl(r.permalink)}
                    source="reddit"
                    badge={`Google #${r.google_rank} · ${r.google_keyword}`}
                  />
                ))}
              </Section>
            )}

            {mentions.length > 0 && (
              <Section title="Mentions" count={mentions.length}>
                {mentions.map((m) => (
                  <ArchiveCard
                    key={m.id}
                    title={m.title}
                    subreddit={`r/${m.subreddit}`}
                    date={m.posted_at ?? m.created_at}
                    dateLabel="Mencionado"
                    score={null}
                    reason={m.sentiment_reason}
                    href={toRedditUrl(m.permalink)}
                    source="reddit"
                    badge={m.target_label}
                  />
                ))}
              </Section>
            )}

            {xPosts.length > 0 && (
              <Section title="X / Twitter" count={xPosts.length}>
                {xPosts.map((p) => (
                  <ArchiveCard
                    key={p.id}
                    title={p.text.slice(0, 120)}
                    subreddit={p.author_username ? `@${p.author_username}` : "X post"}
                    date={p.posted_at ?? p.created_at}
                    dateLabel="Publicado"
                    score={p.intent_score}
                    reason={p.classification_reason}
                    href={p.permalink}
                    source="x"
                  />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#7C7C83", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {title}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#B0B0B5" }}>{count}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

function ArchiveCard({
  title,
  subreddit,
  date,
  dateLabel,
  score,
  reason,
  href,
  source,
  badge,
}: {
  title: string;
  subreddit: string;
  date: string | null;
  dateLabel: string;
  score: number | null;
  reason: string | null;
  href: string;
  source: "reddit" | "x";
  badge?: string;
}) {
  return (
    <div style={{
      background: "#FFF",
      border: "1px solid #EEEEED",
      borderRadius: 10,
      padding: "12px 14px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#46A758", flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1B", lineHeight: 1.3 }}>{title}</p>
          {score !== null && (
            <span style={{
              fontSize: 11, fontWeight: 900, flexShrink: 0,
              color: score >= 80 ? "#FF4500" : score >= 60 ? "#FF9F40" : "#B0B0B5",
            }}>
              {score}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#B0B0B5", fontWeight: 500 }}>{subreddit}</span>
          {date && (
            <span style={{ fontSize: 11, color: "#B0B0B5", fontWeight: 500 }}>
              {dateLabel} {formatDate(date)}
            </span>
          )}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 800, color: "#7193FF", background: "#E5EAFF", padding: "2px 7px", borderRadius: 5 }}>
              {badge}
            </span>
          )}
        </div>
        {reason && (
          <p style={{ fontSize: 11, color: "#7C7C83", marginTop: 5, lineHeight: 1.4 }}>
            {reason.slice(0, 140)}
          </p>
        )}
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, color: "#FF4500", fontWeight: 700, textDecoration: "none", marginTop: 6, display: "inline-block" }}
        >
          {source === "x" ? "Ver en X →" : "Ver en Reddit →"}
        </a>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#B0B0B5" }}>
      <p style={{ fontSize: 14, fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

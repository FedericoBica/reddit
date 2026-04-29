import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import { getXProfile } from "@/modules/x/context-actions";
import {
  listTodayInspirations,
  generateInspirationAction,
} from "@/modules/x/inspiration-actions";
import { INSPIRATION_ANGLES } from "@/modules/x/inspiration-config";
import { InspirationCards, GenerateButton } from "./inspiration-cards";

export const metadata: Metadata = { title: "Inspiration" };

export default async function XInspirationPage({
  searchParams,
}: {
  searchParams?: Promise<{ projectId?: string; filter?: string }>;
}) {
  const user = await requireUser("/x/inspiration");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);
  if (projectState.status === "missing") redirect("/bootstrap");
  const { currentProject } = projectState;

  const [profile, suggestions] = await Promise.all([
    getXProfile(currentProject.id),
    listTodayInspirations(currentProject.id),
  ]);

  const activeFilter = params?.filter ?? "all";
  const filteredSuggestions =
    activeFilter === "all"
      ? suggestions
      : suggestions.filter((s) => s.category === activeFilter);

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page">
        <header className="page-header">
          <div>
            <p className="page-kicker">X · Inspiration</p>
            <h1 className="page-title">Today&apos;s Suggestions</h1>
            <p className="page-copy">
              Posts written in your voice — ready to tweak and send.
            </p>
          </div>
          {suggestions.length > 0 && (
            <GenerateButton
              projectId={currentProject.id}
              label="Refresh ideas"
              action={generateInspirationAction}
            />
          )}
        </header>

        <main style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px 60px" }}>
          {/* ── Filter pills ── */}
          {suggestions.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
              <a
                href={`/x/inspiration?projectId=${currentProject.id}`}
                className={`filter-pill${activeFilter === "all" ? " filter-pill-active" : ""}`}
              >
                All ({suggestions.length})
              </a>
              {INSPIRATION_ANGLES.map((a) => {
                const count = suggestions.filter((s) => s.category === a.id).length;
                if (count === 0) return null;
                return (
                  <a
                    key={a.id}
                    href={`/x/inspiration?projectId=${currentProject.id}&filter=${a.id}`}
                    className={`filter-pill${activeFilter === a.id ? " filter-pill-active" : ""}`}
                  >
                    {a.label}
                  </a>
                );
              })}
            </div>
          )}

          {/* ── No profile state ── */}
          {!profile && (
            <EmptyState
              icon="✍️"
              title="Set up your X Context first"
              body="The AI generates posts in your voice using your interests, writing style, and rules. Fill in your context profile to get started."
              cta={{ label: "Set up My Context →", href: "/x/context" }}
            />
          )}

          {/* ── Has profile, no suggestions yet ── */}
          {profile && suggestions.length === 0 && (
            <div style={{ padding: "48px 0", textAlign: "center" }}>
              <p style={{ fontSize: 40, marginBottom: 16 }}>✨</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1B", marginBottom: 8 }}>
                Generate today&apos;s post ideas
              </p>
              <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto 24px" }}>
                5 posts in 5 different styles — Insight, Story, Hot Take, Question, Product — all written in your voice.
              </p>
              <GenerateButton
                projectId={currentProject.id}
                label="Generate ideas"
                action={generateInspirationAction}
                primary
              />
            </div>
          )}

          {/* ── Suggestions list ── */}
          {filteredSuggestions.length > 0 && (
            <InspirationCards
              suggestions={filteredSuggestions}
              projectId={currentProject.id}
            />
          )}

          {/* ── Filter has no results ── */}
          {profile && suggestions.length > 0 && filteredSuggestions.length === 0 && (
            <EmptyState
              icon="🔍"
              title="No posts for this filter"
              body="Try a different category or refresh ideas to generate a new batch."
            />
          )}
        </main>
      </div>
    </DashboardShell>
  );
}

function EmptyState({
  icon,
  title,
  body,
  cta,
}: {
  icon: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>{icon}</p>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1B", marginBottom: 8 }}>{title}</p>
      <p style={{ fontSize: 14, color: "#7C7C83", maxWidth: 440, margin: "0 auto 20px" }}>{body}</p>
      {cta && (
        <a
          href={cta.href}
          style={{
            display: "inline-block",
            padding: "9px 20px",
            borderRadius: 8,
            background: "#FF4500",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}

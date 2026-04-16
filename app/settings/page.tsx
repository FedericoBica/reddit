import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/app/components/locale-switcher";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectKeywords, listProjectSubreddits, listRecentScrapeRuns } from "@/db/queries/settings";
import type { KeywordDTO, SubredditDTO, ProjectScrapeRunDTO, ProjectDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import {
  updateProjectFromForm,
  addKeywordFromForm,
  removeKeywordFromForm,
  toggleKeywordFromForm,
  addSubredditFromForm,
  removeSubredditFromForm,
  toggleSubredditFromForm,
} from "@/modules/projects/settings-actions";

export const metadata: Metadata = {
  title: "Settings",
};

type SettingsPageProps = {
  searchParams?: Promise<{ projectId?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser("/settings");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject, projects } = projectState;

  if (currentProject.onboarding_status !== "completed") {
    redirect(`/onboarding/project?projectId=${currentProject.id}`);
  }

  const currentLocale = await getLocale();
  const [keywords, subreddits, scrapeRuns] = await Promise.all([
    listProjectKeywords(currentProject.id),
    listProjectSubreddits(currentProject.id),
    listRecentScrapeRuns(currentProject.id, 8),
  ]);

  const activeKeywords = keywords.filter((k) => k.is_active);
  const activeSubreddits = subreddits.filter((s) => s.is_active);

  return (
    <DashboardShell
      user={user}
      projects={projects}
      currentProject={currentProject}
      newLeadsCount={0}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">Settings</p>
            <h1 className="page-title">{currentProject.name}</h1>
            <p className="page-copy">
              {activeKeywords.length} keywords · {activeSubreddits.length} subreddits monitored
            </p>
          </div>
        </header>

        <main
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "0 20px 60px",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          {/* Project Info */}
          <SettingsSection
            title="Project info"
            description="Used for context when classifying leads and generating replies."
          >
            <form action={updateProjectFromForm}>
              <input type="hidden" name="projectId" value={currentProject.id} />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <FieldRow label="Project name">
                  <input
                    className="settings-input"
                    name="name"
                    defaultValue={currentProject.name}
                    placeholder="e.g. My SaaS"
                    required
                  />
                </FieldRow>
                <FieldRow label="Website URL">
                  <input
                    className="settings-input"
                    name="websiteUrl"
                    defaultValue={currentProject.website_url ?? ""}
                    placeholder="https://yoursite.com"
                    type="url"
                  />
                </FieldRow>
                <FieldRow label="Value proposition" vertical>
                  <textarea
                    className="settings-input"
                    name="valueProposition"
                    defaultValue={currentProject.value_proposition ?? ""}
                    placeholder="What makes your product unique..."
                    rows={3}
                    style={{ resize: "vertical" }}
                  />
                </FieldRow>
                <FieldRow label="Tone template" vertical>
                  <textarea
                    className="settings-input"
                    name="tone"
                    defaultValue={currentProject.tone ?? ""}
                    placeholder="Use a preset key like founder_led, helpful_consultant, technical_operator, direct_sales, or write custom tone instructions."
                    rows={4}
                    style={{ resize: "vertical" }}
                  />
                </FieldRow>
                <FieldRow label="Region">
                  <input
                    className="settings-input"
                    name="region"
                    defaultValue={currentProject.region ?? ""}
                    placeholder="e.g. US, LATAM, Global"
                  />
                </FieldRow>
                <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
                  <button type="submit" className="settings-btn-primary">
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          </SettingsSection>

          {/* Keywords */}
          <SettingsSection
            title="Keywords"
            description="Terms the scraper looks for in Reddit posts. Toggle to pause without deleting."
            badge={`${activeKeywords.length} active`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {keywords.length === 0 ? (
                <EmptyHint>No keywords yet. Add one below.</EmptyHint>
              ) : (
                keywords.map((kw) => (
                  <KeywordRow key={kw.id} keyword={kw} projectId={currentProject.id} />
                ))
              )}
            </div>
            <form
              action={addKeywordFromForm}
              style={{ display: "flex", gap: 8, marginTop: keywords.length > 0 ? 12 : 0 }}
            >
              <input type="hidden" name="projectId" value={currentProject.id} />
              <input
                className="settings-input"
                name="term"
                placeholder="Add keyword…"
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>
                Add
              </button>
            </form>
          </SettingsSection>

          {/* Subreddits */}
          <SettingsSection
            title="Subreddits"
            description="Communities scanned for matching posts. Toggle to pause without deleting."
            badge={`${activeSubreddits.length} active`}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {subreddits.length === 0 ? (
                <EmptyHint>No subreddits yet. Add one below.</EmptyHint>
              ) : (
                subreddits.map((sr) => (
                  <SubredditRow key={sr.id} subreddit={sr} projectId={currentProject.id} />
                ))
              )}
            </div>
            <form
              action={addSubredditFromForm}
              style={{ display: "flex", gap: 8, marginTop: subreddits.length > 0 ? 12 : 0 }}
            >
              <input type="hidden" name="projectId" value={currentProject.id} />
              <input
                className="settings-input"
                name="name"
                placeholder="r/subreddit or subredditname"
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>
                Add
              </button>
            </form>
          </SettingsSection>

          {/* Scraper health */}
          <SettingsSection
            title="Scraper health"
            description="Recent scrape runs for this project."
          >
            <ScraperHealth project={currentProject} scrapeRuns={scrapeRuns} />
          </SettingsSection>

          {/* Interface Language */}
          <SettingsSection
            title="Interface language"
            description="Auto-detected from your browser. Override it here."
          >
            <LocaleSwitcher currentLocale={currentLocale} />
          </SettingsSection>
        </main>
      </div>
    </DashboardShell>
  );
}

/* ─── Section wrapper ─── */

function SettingsSection({
  title,
  description,
  badge,
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #EEEEED",
        borderRadius: 12,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1C1C1E",
              marginBottom: 3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 12, color: "#6B6B6E", lineHeight: 1.5 }}>{description}</p>
        </div>
        {badge && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#E07000",
              background: "#FFF3E8",
              border: "1px solid #FFD9AD",
              borderRadius: 6,
              padding: "2px 8px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

/* ─── Form field helpers ─── */

function FieldRow({
  label,
  vertical,
  children,
}: {
  label: string;
  vertical?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        vertical
          ? { display: "flex", flexDirection: "column", gap: 6 }
          : {
              display: "grid",
              gridTemplateColumns: "160px 1fr",
              alignItems: "center",
              gap: 12,
            }
      }
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#6B6B6E",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#AEAEB2",
        padding: "12px 0",
        marginBottom: 4,
      }}
    >
      {children}
    </p>
  );
}

/* ─── Keyword row ─── */

function KeywordRow({
  keyword,
  projectId,
}: {
  keyword: KeywordDTO;
  projectId: string;
}) {
  const typeBadgeColor = keyword.type === "ai_suggested" ? "#6B6B6E" : "#1C1C1E";
  const typeLabel = keyword.type === "ai_suggested" ? "AI" : keyword.type === "competitor" ? "Comp" : "Custom";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #F5F5F3",
      }}
    >
      {/* Toggle */}
      <form action={toggleKeywordFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <input type="hidden" name="isActive" value={String(!keyword.is_active)} />
        <button
          type="submit"
          title={keyword.is_active ? "Pause" : "Enable"}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: keyword.is_active ? "#E07000" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: keyword.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
              transition: "left 0.15s",
            }}
          />
        </button>
      </form>

      {/* Term */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: keyword.is_active ? "#1C1C1E" : "#AEAEB2",
        }}
      >
        {keyword.term}
      </span>

      {/* Type badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: typeBadgeColor,
          background: "#F5F5F3",
          borderRadius: 4,
          padding: "2px 6px",
          letterSpacing: "0.02em",
        }}
      >
        {typeLabel}
      </span>

      {/* Intent */}
      {keyword.intent_category && (
        <span
          style={{
            fontSize: 10,
            color: "#8E8E93",
            background: "#F5F5F3",
            borderRadius: 4,
            padding: "2px 6px",
          }}
        >
          {keyword.intent_category}
        </span>
      )}

      {/* Remove */}
      <form action={removeKeywordFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="keywordId" value={keyword.id} />
        <button
          type="submit"
          title="Remove"
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

/* ─── Subreddit row ─── */

function SubredditRow({
  subreddit,
  projectId,
}: {
  subreddit: SubredditDTO;
  projectId: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid #F5F5F3",
      }}
    >
      {/* Toggle */}
      <form action={toggleSubredditFromForm} style={{ display: "flex" }}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="subredditId" value={subreddit.id} />
        <input type="hidden" name="isActive" value={String(!subreddit.is_active)} />
        <button
          type="submit"
          title={subreddit.is_active ? "Pause" : "Enable"}
          style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            border: "none",
            cursor: "pointer",
            padding: 0,
            background: subreddit.is_active ? "#E07000" : "#D1D1D6",
            position: "relative",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: subreddit.is_active ? 14 : 2,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "#FFF",
              transition: "left 0.15s",
            }}
          />
        </button>
      </form>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 500,
          color: subreddit.is_active ? "#1C1C1E" : "#AEAEB2",
        }}
      >
        r/{subreddit.name}
      </span>

      {/* Stats */}
      {subreddit.avg_daily_posts != null && (
        <span style={{ fontSize: 11, color: "#8E8E93" }}>
          ~{subreddit.avg_daily_posts}/day
        </span>
      )}
      {subreddit.last_scanned_at && (
        <span style={{ fontSize: 11, color: "#AEAEB2" }}>
          Scanned {formatRelative(subreddit.last_scanned_at)}
        </span>
      )}

      {/* Type badge */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: "#6B6B6E",
          background: "#F5F5F3",
          borderRadius: 4,
          padding: "2px 6px",
        }}
      >
        {subreddit.type === "ai_suggested" ? "AI" : "Custom"}
      </span>

      {/* Remove */}
      <form action={removeSubredditFromForm}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="subredditId" value={subreddit.id} />
        <button
          type="submit"
          title="Remove"
          style={{
            width: 24,
            height: 24,
            border: "none",
            background: "transparent",
            color: "#C7C7CC",
            cursor: "pointer",
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </form>
    </div>
  );
}

/* ─── Scraper health ─── */

function ScraperHealth({
  project,
  scrapeRuns,
}: {
  project: ProjectDTO;
  scrapeRuns: ProjectScrapeRunDTO[];
}) {
  const isHealthy = project.scrape_fail_count === 0;
  const isBackedOff =
    project.scrape_backoff_until != null &&
    new Date(project.scrape_backoff_until) > new Date();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Status row */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <StatChip
          label="Status"
          value={isBackedOff ? "Backed off" : isHealthy ? "Healthy" : "Degraded"}
          color={isBackedOff ? "#FF9F40" : isHealthy ? "#34C759" : "#FF3B30"}
        />
        <StatChip
          label="Fail count"
          value={String(project.scrape_fail_count)}
          color={project.scrape_fail_count > 0 ? "#FF3B30" : "#8E8E93"}
        />
        {project.last_scraped_at && (
          <StatChip
            label="Last scan"
            value={formatRelative(project.last_scraped_at)}
            color="#8E8E93"
          />
        )}
        {isBackedOff && project.scrape_backoff_until && (
          <StatChip
            label="Resumes"
            value={formatDate(project.scrape_backoff_until)}
            color="#FF9F40"
          />
        )}
      </div>

      {/* Last error */}
      {project.last_scrape_error && (
        <div
          style={{
            fontSize: 12,
            color: "#FF3B30",
            background: "#FFF1F0",
            border: "1px solid #FFD6D3",
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: "monospace",
          }}
        >
          {project.last_scrape_error}
        </div>
      )}

      {/* Run history */}
      {scrapeRuns.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#AEAEB2", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Recent runs
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {scrapeRuns.map((run) => (
              <ScrapeRunRow key={run.id} run={run} />
            ))}
          </div>
        </div>
      )}

      {scrapeRuns.length === 0 && (
        <EmptyHint>No scrape runs recorded yet.</EmptyHint>
      )}
    </div>
  );
}

function StatChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        background: "#F7F7F5",
        border: "1px solid #EEEEED",
        borderRadius: 8,
        padding: "8px 12px",
        minWidth: 90,
      }}
    >
      <span style={{ fontSize: 10, color: "#8E8E93", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function ScrapeRunRow({ run }: { run: ProjectScrapeRunDTO }) {
  const statusColor =
    run.status === "completed"
      ? "#34C759"
      : run.status === "failed"
        ? "#FF3B30"
        : run.status === "started"
          ? "#E07000"
          : "#8E8E93";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #F5F5F3",
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: statusColor,
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#6B6B6E", flex: 1 }}>
        {run.started_at ? formatDate(run.started_at) : "—"}
      </span>
      <span style={{ color: "#1C1C1E", fontWeight: 600 }}>
        {run.leads_created ?? 0} leads
      </span>
      <span style={{ color: "#8E8E93" }}>{run.posts_seen ?? 0} seen</span>
      {run.error_message && (
        <span
          style={{
            color: "#FF3B30",
            maxWidth: 200,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={run.error_message}
        >
          {run.error_message}
        </span>
      )}
    </div>
  );
}

/* ─── Helpers ─── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

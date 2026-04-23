import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/app/components/locale-switcher";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectKeywords, listProjectSubreddits } from "@/db/queries/settings";
import type { KeywordDTO } from "@/db/schemas/domain";
import { requireUser } from "@/modules/auth/server";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { resolveCurrentProject } from "@/modules/projects/current";
import {
  updateProjectFromForm,
  addKeywordFromForm,
  addCompetitorFromForm,
  updateKeywordFromForm,
  removeKeywordFromForm,
  toggleKeywordFromForm,
} from "@/modules/projects/settings-actions";
import { deleteProjectFromForm } from "@/modules/projects/delete-actions";

export const metadata: Metadata = {
  title: "Settings",
};

type SettingsPageProps = {
  searchParams?: Promise<{ projectId?: string; tab?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const user = await requireUser("/settings");
  const params = await searchParams;
  const projectState = await resolveCurrentProject(params?.projectId);

  if (projectState.status === "missing") redirect("/bootstrap");

  const { currentProject } = projectState;


  const [currentLocale, t, keywords, subreddits, billingPlan] = await Promise.all([
    getLocale(),
    getTranslations("settings"),
    listProjectKeywords(currentProject.id),
    listProjectSubreddits(currentProject.id),
    getCurrentBillingPlan(),
  ]);

  const selectedTab = parseSettingsTab(params?.tab);
  const competitorKeywords = keywords.filter((k) => k.type === "competitor");
  const searchKeywords = keywords.filter((k) => k.type !== "competitor");
  const activeKeywords = searchKeywords.filter((k) => k.is_active);
  const activeSubreddits = subreddits.filter((s) => s.is_active);
  const activeCompetitors = competitorKeywords.filter((k) => k.is_active);

  return (
    <DashboardShell
      user={user}
      currentProject={currentProject}
      newLeadsCount={0}
    >
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">{t("kicker")}</p>
            <h1 className="page-title">{currentProject.name}</h1>
            <p className="page-copy">
              {activeKeywords.length} active keywords · {activeCompetitors.length} competitors · {activeSubreddits.length} communities monitored
            </p>
          </div>
        </header>

        <main
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "0 20px 60px",
          }}
        >
          <SettingsTabs projectId={currentProject.id} selectedTab={selectedTab} />

          {selectedTab === "general" && (
            <SettingsSection
              title="General"
              description="Project identity and company context used across classification, mentions and reply generation."
            >
              <div style={{ display: "grid", gap: 18 }}>
                <form action={updateProjectFromForm}>
                  <input type="hidden" name="projectId" value={currentProject.id} />
                  <div style={{ display: "grid", gap: 14 }}>
                    <FieldRow label="Project name">
                      <input className="settings-input" name="name" defaultValue={currentProject.name} required />
                    </FieldRow>
                    <FieldRow label="Website">
                      <input className="settings-input" name="websiteUrl" defaultValue={currentProject.website_url ?? ""} placeholder="https://yoursite.com" type="url" />
                    </FieldRow>
                    <FieldRow label="Region">
                      <input className="settings-input" name="region" defaultValue={currentProject.region ?? ""} placeholder="US, LATAM, Global" />
                    </FieldRow>
                    <FieldRow label="Company info" vertical>
                      <textarea className="settings-input" name="valueProposition" defaultValue={currentProject.value_proposition ?? ""} placeholder="What you sell, who it is for, positioning, ICP, use cases and proof points." rows={5} style={{ resize: "vertical" }} />
                    </FieldRow>
                    <FieldRow label="App language">
                      <LocaleSwitcher currentLocale={currentLocale} />
                    </FieldRow>
                    <FormFooter label="Save general settings" />
                  </div>
                </form>

                <DangerZone projectId={currentProject.id} projectName={currentProject.name} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "competitors" && (
            <SettingsSection
              title="Competitors"
              description="Competitor names are tracked as competitor keywords for mentions, comparisons and battlecards."
              badge={`${activeCompetitors.length} active`}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {competitorKeywords.length === 0 ? (
                  <EmptyHint>No competitors yet. Add one below.</EmptyHint>
                ) : (
                  competitorKeywords.map((keyword) => (
                    <KeywordRow key={keyword.id} keyword={keyword} projectId={currentProject.id} editable />
                  ))
                )}
              </div>
              <form action={addCompetitorFromForm} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 14 }}>
                <input type="hidden" name="projectId" value={currentProject.id} />
                <input className="settings-input" name="term" placeholder="Competitor name" required />
                <input className="settings-input" name="website" placeholder="Website (coming next)" disabled />
                <button type="submit" className="settings-btn-primary">Add</button>
              </form>
              <p className="section-copy" style={{ marginTop: 10 }}>
                Competitor websites are not persisted yet because the current data model stores competitors as keyword records.
              </p>
            </SettingsSection>
          )}

          {selectedTab === "keywords" && (
            <SettingsSection
              title="Keywords"
              description="AI suggested and custom terms used to discover keyword opportunities. Toggle, edit, delete or add terms."
              badge={`${activeKeywords.length} active`}
            >
              <KeywordGroup title="Suggested by AI" keywords={searchKeywords.filter((k) => k.type === "ai_suggested")} projectId={currentProject.id} />
              <KeywordGroup title="Custom" keywords={searchKeywords.filter((k) => k.type === "custom")} projectId={currentProject.id} editable />
              <form action={addKeywordFromForm} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <input type="hidden" name="projectId" value={currentProject.id} />
                <input className="settings-input" name="term" placeholder="Add custom keyword" required style={{ flex: 1 }} />
                <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>Add</button>
              </form>
            </SettingsSection>
          )}

          {selectedTab === "prompts" && (
            <SettingsSection
              title="Prompts"
              description="Shape the tone and behavior of the AI reply generator for this project."
            >
              <form action={updateProjectFromForm}>
                <input type="hidden" name="projectId" value={currentProject.id} />
                <FieldRow label="Reply generator tone" vertical>
                  <textarea
                    className="settings-input"
                    name="tone"
                    defaultValue={currentProject.tone ?? ""}
                    placeholder="Example: concise, founder-led, helpful but not salesy. Avoid hype. Mention product only when it naturally solves the user's problem."
                    rows={8}
                    style={{ resize: "vertical" }}
                  />
                </FieldRow>
                <FormFooter label="Save prompt settings" />
              </form>
            </SettingsSection>
          )}

          {selectedTab === "notifications" && (
            <SettingsSection
              title="Notifications"
              description="Channels and fetch frequency for mention monitoring and keyword opportunities."
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
                <NotificationChannel label="Browser push" enabled />
                <NotificationChannel label="Telegram" enabled={billingPlan.integrations.telegram} />
                <NotificationChannel label="Slack" enabled={billingPlan.integrations.slack} />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <FrequencyRow label="Mention fetching" value={`Every ${billingPlan.scrapeIntervalHours}h`} />
                <FrequencyRow label="Keyword opportunities" value={`Search window: ${billingPlan.keywordSearchTimeWindow}`} />
                <FrequencyRow label="Webhook delivery" value={billingPlan.integrations.webhooks ? "Available" : "Upgrade required"} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "billing" && (
            <SettingsSection
              title="Billing"
              description="Current plan limits and included capabilities."
            >
              <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 18 }}>
                <BillingMetric label="Plan" value={billingPlan.label} />
                <BillingMetric label="AI replies" value={formatLimit(0, billingPlan.maxAiRepliesPerMonth)} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <PlanLimit label="Keywords" value={formatLimit(searchKeywords.length, billingPlan.maxKeywords)} />
                <PlanLimit label="Competitors" value={formatLimit(competitorKeywords.length, billingPlan.maxCompetitors)} />
                <PlanLimit label="Ghostwriter threads" value={formatLimit(0, billingPlan.maxGhostwriterThreads)} />
                <PlanLimit label="Team members" value={formatLimit(1, billingPlan.maxTeamMembers)} />
                <PlanLimit label="Reddit accounts" value={formatLimit(0, billingPlan.maxRedditAccounts)} />
              </div>
            </SettingsSection>
          )}
        </main>
      </div>
    </DashboardShell>
  );
}

/* ─── Section wrapper ─── */

type SettingsTab = "general" | "competitors" | "keywords" | "prompts" | "notifications" | "billing";

const SETTINGS_TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: "general", label: "General" },
  { id: "competitors", label: "Competitors" },
  { id: "keywords", label: "Keywords" },
  { id: "prompts", label: "Prompts" },
  { id: "notifications", label: "Notifications" },
  { id: "billing", label: "Billing" },
];

function SettingsTabs({
  projectId,
  selectedTab,
}: {
  projectId: string;
  selectedTab: SettingsTab;
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: 6,
        marginBottom: 18,
      }}
    >
      {SETTINGS_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/settings?projectId=${projectId}&tab=${tab.id}`}
          className={`filter-pill${selectedTab === tab.id ? " filter-pill-active" : ""}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

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

function FormFooter({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
      <button type="submit" className="settings-btn-primary">
        {label}
      </button>
    </div>
  );
}

function DangerZone({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #FFD1D1",
        background: "#FFF8F8",
        borderRadius: 10,
        padding: "16px 18px",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: "#8F1D1D", marginBottom: 4 }}>
          Danger zone
        </h3>
        <p style={{ fontSize: 12, color: "#7A3A3A", lineHeight: 1.5 }}>
          Delete this project and all its keywords, leads, replies, suggestions and scraping history.
        </p>
      </div>

      <form action={deleteProjectFromForm} style={{ display: "grid", gap: 10 }}>
        <input type="hidden" name="projectId" value={projectId} />
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#7A3A3A" }}>
            Type <strong>DELETE</strong> to confirm deletion of {projectName}.
          </span>
          <input
            className="settings-input"
            name="confirmation"
            placeholder="DELETE"
            required
            autoComplete="off"
          />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            style={{
              border: "1px solid #DC2626",
              background: "#DC2626",
              color: "#FFFFFF",
              borderRadius: 8,
              padding: "9px 14px",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Delete project
          </button>
        </div>
      </form>
    </div>
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

function KeywordGroup({
  title,
  keywords,
  projectId,
  editable = false,
}: {
  title: string;
  keywords: KeywordDTO[];
  projectId: string;
  editable?: boolean;
}) {
  return (
    <div style={{ marginTop: title === "Suggested by AI" ? 0 : 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#1C1C1E" }}>{title}</p>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#8E8E93" }}>{keywords.length}</span>
      </div>
      <div style={{ display: "grid", gap: 0 }}>
        {keywords.length === 0 ? (
          <EmptyHint>No {title.toLowerCase()} keywords yet.</EmptyHint>
        ) : (
          keywords.map((keyword) => (
            <KeywordRow key={keyword.id} keyword={keyword} projectId={projectId} editable={editable} />
          ))
        )}
      </div>
    </div>
  );
}

function KeywordRow({
  keyword,
  projectId,
  editable = false,
}: {
  keyword: KeywordDTO;
  projectId: string;
  editable?: boolean;
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
      {editable ? (
        <form action={updateKeywordFromForm} style={{ display: "flex", gap: 8, flex: 1, minWidth: 0 }}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="keywordId" value={keyword.id} />
          <input
            className="settings-input"
            name="term"
            defaultValue={keyword.term}
            required
            style={{ opacity: keyword.is_active ? 1 : 0.58 }}
          />
          <button type="submit" className="settings-btn-secondary">Save</button>
        </form>
      ) : (
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
      )}

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

/* ─── Notification and billing helpers ─── */

function NotificationChannel({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 18, color: enabled ? "#15803D" : "#8E8E93" }}>
        {enabled ? "Enabled" : "Locked"}
      </div>
    </div>
  );
}

function FrequencyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px solid #F5F5F3" }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#E07000" }}>{value}</span>
    </div>
  );
}

function BillingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ fontSize: 22 }}>{value}</div>
    </div>
  );
}

function PlanLimit({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #F5F5F3" }}>
      <span style={{ fontSize: 13, color: "#6B6B6E", fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1C1C1E", fontWeight: 800 }}>{value}</span>
    </div>
  );
}

/* ─── Helpers ─── */

function parseSettingsTab(value: string | undefined): SettingsTab {
  return SETTINGS_TABS.some((tab) => tab.id === value) ? (value as SettingsTab) : "general";
}

function formatLimit(current: number, max: number | null) {
  return max === null ? `${current}/Unlimited` : `${current}/${max}`;
}

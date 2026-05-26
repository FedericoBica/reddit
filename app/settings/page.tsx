import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/app/components/locale-switcher";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { listProjectKeywords, listProjectSubreddits } from "@/db/queries/settings";
import { listProjectXKeywords } from "@/db/queries/x";
import { listActiveExtensionTokens } from "@/db/queries/extension-tokens";
import { requireUser } from "@/modules/auth/server";
import { getCurrentAiReplyUsage, getCurrentBillingPlan } from "@/modules/billing/current";
import { openBillingPortalFromForm, toggleXAddonFromForm } from "@/modules/billing/actions";
import { getPaddlePriceIdForPlan, getXAddonPriceIdForPlan } from "@/modules/billing/paddle";
import { PaddleCheckoutButton } from "@/components/paddle/paddle-checkout-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import {
  updateProjectFromForm,
  addKeywordFromForm,
  addCompetitorFromForm,
  addXKeywordFromForm,
  saveNotificationPrefsFromForm,
} from "@/modules/projects/settings-actions";
import { PromptsTab } from "./prompts-tab";
import type { LocaleCode } from "./settings-copy";
import { SETTINGS_COPY, parseSettingsTab, formatLimit } from "./settings-copy";
import {
  SettingsTabs,
  SettingsSection,
  FormFooter,
  DangerZone,
  FieldRow,
  EmptyHint,
  FrequencyRow,
  BillingMetric,
  PlanLimit,
} from "./settings-ui";
import {
  KeywordGroup,
  KeywordRow,
  XKeywordRow,
  XQuerySyntaxGuide,
  ExtensionSection,
} from "./keywords-section";

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

  const selectedTab = parseSettingsTab(params?.tab);

  const [currentLocale, t, keywords, subreddits, xKeywords, billingPlan, aiReplyUsage, extensionTokens, paddleUserData] = await Promise.all([
    getLocale(),
    getTranslations("settings"),
    listProjectKeywords(currentProject.id),
    listProjectSubreddits(currentProject.id),
    listProjectXKeywords(currentProject.id),
    getCurrentBillingPlan(),
    getCurrentAiReplyUsage(),
    selectedTab === "extension" ? listActiveExtensionTokens(user.id, currentProject.id) : Promise.resolve([]),
    createSupabaseServerClient().then((sb) =>
      sb.from("users").select("paddle_subscription_id, x_addon_enabled").eq("id", user.id).single()
    ),
  ]);

  if (!billingPlan) redirect("/signup/plan");

  const paddleSubscriptionId = paddleUserData.data?.paddle_subscription_id ?? null;
  const xAddonEnabled = paddleUserData.data?.x_addon_enabled ?? false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  const competitorKeywords = keywords.filter((k) => k.type === "competitor");
  const redditKeywords = keywords.filter((k) => k.type !== "competitor");
  const activeKeywords = redditKeywords.filter((k) => k.is_active);
  const activeSubreddits = subreddits.filter((s) => s.is_active);
  const activeCompetitors = competitorKeywords.filter((k) => k.is_active);
  const activeXKeywords = xKeywords.filter((k) => k.is_active);
  const localeCode: LocaleCode = currentLocale.startsWith("es") ? "es" : currentLocale.startsWith("pt") ? "pt" : "en";
  const copy = SETTINGS_COPY[localeCode];

  return (
    <DashboardShell user={user} currentProject={currentProject}>
      <div className="app-page" style={{ minHeight: "100vh" }}>
        <header className="page-header">
          <div>
            <p className="page-kicker">{t("kicker")}</p>
            <h1 className="page-title">{currentProject.name}</h1>
            <p className="page-copy">
              {copy.pageSummary({
                keywords: activeKeywords.length,
                competitors: activeCompetitors.length,
                communities: activeSubreddits.length,
                xRules: activeXKeywords.length,
                xEnabled: billingPlan.xEnabled,
              })}
            </p>
          </div>
        </header>

        <main style={{ maxWidth: 1040, margin: "0 auto", padding: "0 20px 60px" }}>
          <SettingsTabs projectId={currentProject.id} selectedTab={selectedTab} copy={copy} />

          {selectedTab === "general" && (
            <SettingsSection
              title={copy.general.title}
              description={copy.general.description}
            >
              <div style={{ display: "grid", gap: 18 }}>
                <form action={updateProjectFromForm}>
                  <input type="hidden" name="projectId" value={currentProject.id} />
                  <div style={{ display: "grid", gap: 14 }}>
                    <FieldRow label={copy.general.projectName}>
                      <input className="settings-input" name="name" defaultValue={currentProject.name} required />
                    </FieldRow>
                    <FieldRow label={copy.general.website}>
                      <input className="settings-input" name="websiteUrl" defaultValue={currentProject.website_url ?? ""} placeholder={copy.general.websitePlaceholder} type="url" />
                    </FieldRow>
                    <FieldRow label={copy.general.region}>
                      <input className="settings-input" name="region" defaultValue={currentProject.region ?? ""} placeholder={copy.general.regionPlaceholder} />
                    </FieldRow>
                    <FieldRow label={copy.general.companyInfo} vertical>
                      <textarea className="settings-input" name="valueProposition" defaultValue={currentProject.value_proposition ?? ""} placeholder={copy.general.companyInfoPlaceholder} rows={5} style={{ resize: "vertical" }} />
                    </FieldRow>
                    <FieldRow label={copy.general.appLanguage}>
                      <LocaleSwitcher currentLocale={currentLocale} />
                    </FieldRow>
                    <FormFooter label={copy.general.save} />
                  </div>
                </form>

                <DangerZone projectId={currentProject.id} projectName={currentProject.name} copy={copy} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "competitors" && (
            <SettingsSection
              title={copy.competitors.title}
              description={copy.competitors.description}
              badge={copy.competitors.activeBadge(activeCompetitors.length)}
            >
              <div style={{ display: "grid", gap: 10 }}>
                {competitorKeywords.length === 0 ? (
                  <EmptyHint>{copy.competitors.empty}</EmptyHint>
                ) : (
                  competitorKeywords.map((keyword) => (
                    <KeywordRow key={keyword.id} keyword={keyword} projectId={currentProject.id} editable copy={copy} />
                  ))
                )}
              </div>
              <form action={addCompetitorFromForm} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 14 }}>
                <input type="hidden" name="projectId" value={currentProject.id} />
                <input className="settings-input" name="term" placeholder={copy.competitors.termPlaceholder} required />
                <input className="settings-input" name="website" placeholder={copy.competitors.websitePlaceholder} disabled />
                <button type="submit" className="settings-btn-primary">{copy.competitors.add}</button>
              </form>
              <p className="section-copy" style={{ marginTop: 10 }}>
                {copy.competitors.note}
              </p>
            </SettingsSection>
          )}

          {selectedTab === "keywords" && (
            <div style={{ display: "grid", gap: 16 }}>
              <SettingsSection
                title={copy.keywords.title}
                description={copy.keywords.description}
                badge={copy.keywords.activeBadge(activeKeywords.length)}
              >
                <KeywordGroup title={copy.keywords.suggestedByAi} keywords={redditKeywords.filter((k) => k.type === "ai_suggested")} projectId={currentProject.id} copy={copy} />
                <KeywordGroup title={copy.keywords.custom} keywords={redditKeywords.filter((k) => k.type === "custom" || k.type === "searchbox")} projectId={currentProject.id} editable copy={copy} />

                <div style={{ display: "grid", gap: 8, marginTop: 16, borderTop: "1px solid #EDEFF1", paddingTop: 14 }}>
                  <form action={addKeywordFromForm} style={{ display: "flex", gap: 8 }}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input className="settings-input" name="term" placeholder={copy.keywords.addPlaceholder} required style={{ flex: 1 }} />
                    <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>{copy.keywords.add}</button>
                  </form>
                </div>
              </SettingsSection>

              {billingPlan.xEnabled ? (
                <SettingsSection
                  title={copy.keywords.xTitle}
                  description={copy.keywords.xDescription}
                  badge={copy.keywords.activeBadge(activeXKeywords.length)}
                >
                  <div style={{ display: "grid", gap: 0 }}>
                    {xKeywords.length === 0 ? (
                      <EmptyHint>{copy.keywords.xEmpty}</EmptyHint>
                    ) : (
                      xKeywords.map((keyword) => (
                        <XKeywordRow key={keyword.id} keyword={keyword} projectId={currentProject.id} copy={copy} />
                      ))
                    )}
                  </div>
                  <form action={addXKeywordFromForm} style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input className="settings-input" name="query" placeholder={copy.keywords.xPlaceholder} required style={{ flex: 1 }} />
                    <button type="submit" className="settings-btn-primary" style={{ flexShrink: 0 }}>{copy.keywords.add}</button>
                  </form>
                  <XQuerySyntaxGuide copy={copy} />
                </SettingsSection>
              ) : (
                <SettingsSection
                  title={copy.keywords.xTitle}
                  description={localeCode === "en" ? "X monitoring is available on Growth and Professional plans." : localeCode === "es" ? "El monitoreo de X está disponible en los planes Growth y Professional." : "O monitoramento de X está disponível nos planos Growth e Professional."}
                >
                  <div style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: 14 }}>
                    <p style={{ fontSize: 13, color: "#7C7C83", flex: 1 }}>
                      {copy.keywords.xLockedDescription}
                    </p>
                    <a
                      href={`/settings?projectId=${currentProject.id}&tab=billing`}
                      style={{
                        display: "inline-block",
                        padding: "8px 16px",
                        background: "#FF4500",
                        color: "#FFF",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {copy.keywords.xUpgrade}
                    </a>
                  </div>
                </SettingsSection>
              )}
            </div>
          )}

          {selectedTab === "prompts" && (
            <PromptsTab
              projectId={currentProject.id}
              defaultReplyLength={(currentProject.reply_length ?? "medium") as "short" | "medium" | "long"}
              defaultTone={currentProject.tone ?? ""}
            />
          )}

          {selectedTab === "notifications" && (
            <SettingsSection
              title={copy.notifications.title}
              description={copy.notifications.description}
            >
              {/* Email toggle */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 800, color: "#B0B0B5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                  {copy.notifications.email}
                </p>
                <p style={{ fontSize: 13, color: "#7C7C83", marginBottom: 14 }}>
                  {copy.notifications.emailDescription}
                </p>
                <form action={saveNotificationPrefsFromForm} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="hidden" name="projectId" value={currentProject.id} />
                  <input type="hidden" name="notifyEmail" value={currentProject.notify_email ? "false" : "true"} />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#F8F8F7", border: "1px solid #EEEEED", flex: 1 }}>
                    <div
                      style={{
                        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                        background: currentProject.notify_email ? "#46A758" : "#D1D5DB",
                        position: "relative", transition: "background 0.15s",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute", top: 2, left: currentProject.notify_email ? 18 : 2,
                          width: 16, height: 16, borderRadius: "50%", background: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.15s",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1B" }}>
                      {copy.notifications.emailToggleLabel}
                    </span>
                    <span style={{ fontSize: 12, color: "#7C7C83", marginLeft: "auto" }}>
                      {currentProject.notify_email ? copy.notifications.emailToggleOn : copy.notifications.emailToggleOff}
                    </span>
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
                      background: currentProject.notify_email ? "#FBE2E5" : "#E8F5ED",
                      color: currentProject.notify_email ? "#EA0027" : "#46A758",
                      flexShrink: 0,
                    }}
                  >
                    {currentProject.notify_email ? copy.notifications.emailToggleOff : copy.notifications.emailToggleOn}
                  </button>
                </form>
              </div>

              {/* Frequency info */}
              <div style={{ display: "grid", gap: 10 }}>
                <FrequencyRow label={copy.notifications.mentionFetching} value={copy.notifications.everyHours(billingPlan.scrapeIntervalHours)} />
                <FrequencyRow label={copy.notifications.keywordOpportunities} value={copy.notifications.searchWindow(billingPlan.keywordSearchTimeWindow)} />
              </div>
            </SettingsSection>
          )}

          {selectedTab === "billing" && (
            <SettingsSection
              title={copy.billing.title}
              description={copy.billing.description}
            >
              <div className="metric-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", marginBottom: 18 }}>
                <BillingMetric label={copy.billing.plan} value={billingPlan.label} />
                <BillingMetric label={copy.billing.aiReplies} value={formatLimit(aiReplyUsage.used, billingPlan.maxAiRepliesPerMonth, copy)} />
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <PlanLimit label={copy.billing.redditKeywords} value={formatLimit(redditKeywords.length, billingPlan.maxKeywords, copy)} />
                {billingPlan.xEnabled && (
                  <PlanLimit label={copy.billing.xKeywords} value={formatLimit(activeXKeywords.length, billingPlan.maxXKeywords, copy)} />
                )}
                <PlanLimit label={copy.billing.competitors} value={formatLimit(competitorKeywords.length, billingPlan.maxCompetitors, copy)} />
                <PlanLimit label={copy.billing.ghostwriterThreads} value={formatLimit(0, billingPlan.maxGhostwriterThreads, copy)} />
                <PlanLimit label={copy.billing.teamMembers} value={formatLimit(1, billingPlan.maxTeamMembers, copy)} />
                <PlanLimit label={copy.billing.redditAccounts} value={formatLimit(0, billingPlan.maxRedditAccounts, copy)} />
              </div>

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 18,
                  borderTop: "1px solid #F0F0EE",
                  display: "grid",
                  gap: 12,
                }}
              >
                <p style={{ fontSize: 12, color: "#7C7C83", lineHeight: 1.5 }}>
                  {copy.billing.note}
                </p>

                {/* X/Twitter add-on toggle */}
                {paddleSubscriptionId && (
                  <form action={toggleXAddonFromForm} style={{ marginBottom: 4 }}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <input type="hidden" name="enable" value={xAddonEnabled ? "false" : "true"} />
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: xAddonEnabled ? "oklch(0.97 0.01 250)" : "#F7F7F5",
                        border: xAddonEnabled ? "1.5px solid oklch(0.55 0.18 250)" : "1.5px solid #E5E5E2",
                        borderRadius: 10,
                        padding: "10px 14px",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: 4,
                        border: xAddonEnabled ? "none" : "1.5px solid #C7C7C5",
                        background: xAddonEnabled ? "oklch(0.55 0.18 250)" : "white",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        {xAddonEnabled && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}
                      </span>
                      <span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
                          X/Twitter monitoring
                        </span>
                        <span style={{ fontSize: 12, color: "#7C7C83", marginLeft: 6 }}>
                          {xAddonEnabled
                            ? "Active — click to remove"
                            : `+${{ startup: "$10", growth: "$15", professional: "$20" }[billingPlan.plan]}/mo`}
                        </span>
                      </span>
                    </button>
                  </form>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {(["startup", "growth", "professional"] as const).map((planId) => {
                    const isCurrent = billingPlan.plan === planId;
                    const labels: Record<typeof planId, string> = {
                      startup: copy.billing.switchToStartup,
                      growth: copy.billing.upgradeToGrowth,
                      professional: copy.billing.upgradeToProfessional,
                    };
                    const successUrl = `${appUrl}/settings?projectId=${currentProject.id}&tab=billing&checkout=started&plan=${planId}`;

                    return (
                      <PaddleCheckoutButton
                        key={planId}
                        plan={planId}
                        priceId={getPaddlePriceIdForPlan(planId)}
                        email={user.email ?? ""}
                        subscriptionId={paddleSubscriptionId}
                        successUrl={successUrl}
                        customData={{ user_id: user.id, project_id: currentProject.id, billing_plan: planId }}
                        disabled={isCurrent}
                        style={{
                          border: isCurrent ? "1px solid #DADAD7" : "1px solid #FF4500",
                          background: isCurrent ? "#F7F7F5" : "#FF4500",
                          color: isCurrent ? "#8E8E93" : "#FFFFFF",
                          borderRadius: 8,
                          padding: "9px 14px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: isCurrent ? "not-allowed" : "pointer",
                        }}
                      >
                        {isCurrent ? copy.billing.currentPlan(billingPlan.label) : labels[planId]}
                      </PaddleCheckoutButton>
                    );
                  })}

                  <form action={openBillingPortalFromForm}>
                    <input type="hidden" name="projectId" value={currentProject.id} />
                    <button
                      type="submit"
                      style={{
                        border: "1px solid #D6D6D3",
                        background: "#FFFFFF",
                        color: "#1C1C1E",
                        borderRadius: 8,
                        padding: "9px 14px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {copy.billing.manage}
                    </button>
                  </form>
                </div>
              </div>
            </SettingsSection>
          )}

          {selectedTab === "extension" && (
            <ExtensionSection
              projectId={currentProject.id}
              tokens={extensionTokens}
              copy={copy}
            />
          )}
        </main>
      </div>
    </DashboardShell>
  );
}

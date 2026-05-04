"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { SignupProgress } from "@/app/signup/components/signup-progress";

type CompanyWebsiteAnalyzerProps = {
  analyzeAction: (formData: FormData) => void | Promise<void>;
  manualAction: (formData: FormData) => void | Promise<void>;
  error?: string;
};

export function CompanyWebsiteAnalyzer({ analyzeAction, manualAction, error }: CompanyWebsiteAnalyzerProps) {
  const t = useTranslations("signup.companyAnalyzer");
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [submitted, setSubmitted] = useState(false);
  const analysisSteps = [
    { label: t("analysis.step1"), pending: t("analysis.pending1") },
    { label: t("analysis.step2"), pending: t("analysis.pendingQueued") },
    { label: t("analysis.step3"), pending: t("analysis.pendingQueued") },
    { label: t("analysis.step4"), pending: t("analysis.pendingQueued") },
  ];

  return (
    <>
      <section className="signup-wizard-main">
        <SignupProgress active={1} />
        <div className="sw-eyebrow" style={{ marginTop: 20 }}>
          <span className="sw-eyebrow-dot" />
          {t("eyebrow")}
        </div>
        <h1 className="signup-wizard-title">
          {t("title1")}<br /><em>{t("titleEm")}</em>
        </h1>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F2F3F5", borderRadius: 10, padding: 4, width: "fit-content" }}>
          <button
            type="button"
            onClick={() => setMode("ai")}
            style={{
              fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
              background: mode === "ai" ? "#FFF" : "transparent",
              color: mode === "ai" ? "#1A1A1B" : "#7C7C83",
              boxShadow: mode === "ai" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t("analyzeMode")}
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            style={{
              fontSize: 12, fontWeight: 700, padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
              background: mode === "manual" ? "#FFF" : "transparent",
              color: mode === "manual" ? "#1A1A1B" : "#7C7C83",
              boxShadow: mode === "manual" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t("manualMode")}
          </button>
        </div>

        {error && <div className="signup-error">{error}</div>}

        {mode === "ai" ? (
          <>
            <p className="signup-wizard-copy">
              {t("analyzeDescription")}
            </p>
            <form
              action={analyzeAction}
              className="signup-form"
              onSubmit={() => setSubmitted(true)}
            >
              <label className="field-group">
                <span className="field-label">{t.rich("websiteLabel", { muted: (chunks) => <span style={{ color: "oklch(0.6 0.02 55)", fontWeight: 400 }}>{chunks}</span> })}</span>
                <div className="sw-input-wrap">
                  <span className="sw-input-prefix">https://</span>
                  <input
                    className="sw-input"
                    name="website"
                    type="text"
                    placeholder={t("websitePlaceholder")}
                    required
                  />
                </div>
              </label>
              <AnalyzeButton label={t("analyzeButton")} pendingLabel={t("analyzing")} />
            </form>
            <div className="sw-foot-note">
              <span>🔒</span> {t("privacy")}
            </div>
          </>
        ) : (
          <>
            <p className="signup-wizard-copy">
              {t("manualDescription")}
            </p>
            <form action={manualAction} className="signup-form">
              <label className="field-group">
                <span className="field-label">{t.rich("manualWebsiteLabel", { optional: (chunks) => <span style={{ color: "oklch(0.6 0.02 55)", fontWeight: 400 }}>{chunks}</span> })}</span>
                <div className="sw-input-wrap">
                  <span className="sw-input-prefix">https://</span>
                  <input
                    className="sw-input"
                    name="website"
                    type="text"
                    placeholder={t("websitePlaceholder")}
                  />
                </div>
              </label>
              <label className="field-group">
                <span className="field-label">{t("companyDescription")}</span>
                <textarea
                  className="sw-input"
                  name="description"
                  placeholder={t("manualPlaceholder")}
                  rows={6}
                  maxLength={1200}
                  required
                  style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                />
              </label>
              <Button className="sw-btn-primary w-full" type="submit">
                {t("continue")}
              </Button>
            </form>
          </>
        )}
      </section>

      <aside className="signup-wizard-visual">
        <div className="sw-pane-eyebrow">
          <span className="sw-live-tag">
            {submitted && <span className="sw-pulse" />}
            {mode === "ai" ? t("liveAnalysis") : t("yourBrief")}
          </span>
          <span className="sw-pane-meta">{mode === "ai" ? t("analysisEta") : t("instant")}</span>
        </div>
        {mode === "ai" ? (
          <div className="sw-run-list">
            {analysisSteps.map((step, index) => {
              const isActive = submitted && index === 0;
              return (
                <div key={step.label} className={`sw-run-item${isActive ? " sw-run-item-active" : ""}`}>
                  <div className="sw-run-icon">
                    {isActive
                      ? <span className="sw-run-spinner" />
                      : <span>{String(index + 1).padStart(2, "0")}</span>}
                  </div>
                  <div className="sw-run-text">
                    <span className="sw-run-title">{step.label}</span>
                    <span className="sw-run-status">{isActive ? step.pending : t("analysis.pendingQueued")}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {[t("manualPrompt1"), t("manualPrompt2"), t("manualPrompt3")].map((q) => (
              <div key={q} style={{ padding: "10px 14px", background: "#F6F7F8", borderRadius: 8, fontSize: 12, color: "#7C7C83", fontStyle: "italic" }}>
                {q}
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#B0B0B5", marginTop: 4 }}>
              {t("manualHint")}
            </p>
          </div>
        )}
        <div className="sw-divider" />
        <p style={{ fontSize: 12, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
          {t("tip")}
        </p>
      </aside>
    </>
  );
}

function AnalyzeButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="sw-btn-primary w-full" disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </Button>
  );
}

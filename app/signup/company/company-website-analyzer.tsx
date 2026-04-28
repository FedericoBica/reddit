"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { SignupProgress } from "@/app/signup/components/signup-progress";

type CompanyWebsiteAnalyzerProps = {
  analyzeAction: (formData: FormData) => void | Promise<void>;
  manualAction: (formData: FormData) => void | Promise<void>;
  error?: string;
};

const analysisSteps = [
  { label: "Reading your site", pending: "Crawling pages…" },
  { label: "Discovering high-intent keywords", pending: "Queued" },
  { label: "Generating company brief", pending: "Queued" },
  { label: "Mapping target subreddits", pending: "Queued" },
];

export function CompanyWebsiteAnalyzer({ analyzeAction, manualAction, error }: CompanyWebsiteAnalyzerProps) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <section className="signup-wizard-main">
        <SignupProgress active={1} />
        <div className="sw-eyebrow" style={{ marginTop: 20 }}>
          <span className="sw-eyebrow-dot" />
          Step 02 · Company
        </div>
        <h1 className="signup-wizard-title">
          Tell us about<br /><em>your company.</em>
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
            Analyze with AI
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
            Write manually
          </button>
        </div>

        {error && <div className="signup-error">{error}</div>}

        {mode === "ai" ? (
          <>
            <p className="signup-wizard-copy">
              Drop your URL — we read your site, build a positioning brief, and learn the language buyers use to describe what you do.
            </p>
            <form
              action={analyzeAction}
              className="signup-form"
              onSubmit={() => setSubmitted(true)}
            >
              <label className="field-group">
                <span className="field-label">Company website <span style={{ color: "oklch(0.6 0.02 55)", fontWeight: 400 }}>— we&apos;ll handle the rest</span></span>
                <div className="sw-input-wrap">
                  <span className="sw-input-prefix">https://</span>
                  <input
                    className="sw-input"
                    name="website"
                    type="text"
                    placeholder="yourcompany.com"
                    required
                  />
                </div>
              </label>
              <AnalyzeButton />
            </form>
            <div className="sw-foot-note">
              <span>🔒</span> We don&apos;t store the page text — only the positioning brief.
            </div>
          </>
        ) : (
          <>
            <p className="signup-wizard-copy">
              Describe your product in your own words — who it&apos;s for, what it solves, and how it&apos;s different.
            </p>
            <form action={manualAction} className="signup-form">
              <label className="field-group">
                <span className="field-label">Website <span style={{ color: "oklch(0.6 0.02 55)", fontWeight: 400 }}>(optional)</span></span>
                <div className="sw-input-wrap">
                  <span className="sw-input-prefix">https://</span>
                  <input
                    className="sw-input"
                    name="website"
                    type="text"
                    placeholder="yourcompany.com"
                  />
                </div>
              </label>
              <label className="field-group">
                <span className="field-label">Company description</span>
                <textarea
                  className="sw-input"
                  name="description"
                  placeholder="We help B2B SaaS teams find buyer-intent leads on Reddit before competitors notice them. Targets: founders, marketers, growth leads at early-stage companies."
                  rows={6}
                  maxLength={1200}
                  required
                  style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                />
              </label>
              <Button className="sw-btn-primary w-full" type="submit">
                Continue →
              </Button>
            </form>
          </>
        )}
      </section>

      <aside className="signup-wizard-visual">
        <div className="sw-pane-eyebrow">
          <span className="sw-live-tag">
            {submitted && <span className="sw-pulse" />}
            {mode === "ai" ? "Live analysis" : "Your brief"}
          </span>
          <span className="sw-pane-meta">{mode === "ai" ? "~ 12s" : "instant"}</span>
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
                    <span className="sw-run-status">{isActive ? step.pending : "Queued"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {["Who is your customer?", "What pain do you solve?", "Why choose you?"].map((q) => (
              <div key={q} style={{ padding: "10px 14px", background: "#F6F7F8", borderRadius: 8, fontSize: 12, color: "#7C7C83", fontStyle: "italic" }}>
                {q}
              </div>
            ))}
            <p style={{ fontSize: 11, color: "#B0B0B5", marginTop: 4 }}>
              Answer these in your description for better keyword suggestions.
            </p>
          </div>
        )}
        <div className="sw-divider" />
        <p style={{ fontSize: 12, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
          Tip — the more specific, the better the keyword suggestions.
        </p>
      </aside>
    </>
  );
}

function AnalyzeButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="sw-btn-primary w-full" disabled={pending} type="submit">
      {pending ? "Analyzing…" : "Analyze my site →"}
    </Button>
  );
}

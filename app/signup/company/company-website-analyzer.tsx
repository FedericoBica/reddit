"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignupProgress } from "@/app/signup/components/signup-progress";

type CompanyWebsiteAnalyzerProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

const analysisSteps = [
  { label: "Reading your site", pending: "Crawling pages…" },
  { label: "Discovering high-intent keywords", pending: "Queued" },
  { label: "Generating company brief", pending: "Queued" },
  { label: "Mapping target subreddits", pending: "Queued" },
];

export function CompanyWebsiteAnalyzer({ action, error }: CompanyWebsiteAnalyzerProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <section className="signup-wizard-main">
        <SignupProgress active={0} />
        <div className="sw-eyebrow" style={{ marginTop: 20 }}>
          <span className="sw-eyebrow-dot" />
          Step 01 · Company
        </div>
        <h1 className="signup-wizard-title">
          Tell us about<br /><em>your company.</em>
        </h1>
        <p className="signup-wizard-copy">
          Drop your URL — we read your site, build a positioning brief, and learn the language buyers use to describe what you do.
        </p>

        {error && <div className="signup-error">{error}</div>}

        <form
          action={action}
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
      </section>

      <aside className="signup-wizard-visual">
        <div className="sw-pane-eyebrow">
          <span className="sw-live-tag">
            {submitted && <span className="sw-pulse" />}
            Live analysis
          </span>
          <span className="sw-pane-meta">~ 12s</span>
        </div>
        <div className="sw-run-list">
          {analysisSteps.map((step, index) => {
            const isActive = submitted && index === 0;
            const isDone = false;
            return (
              <div
                key={step.label}
                className={`sw-run-item${isActive ? " sw-run-item-active" : isDone ? " sw-run-item-done" : ""}`}
              >
                <div className="sw-run-icon">
                  {isActive
                    ? <span className="sw-run-spinner" />
                    : isDone
                      ? <span>✓</span>
                      : <span>{String(index + 1).padStart(2, "0")}</span>
                  }
                </div>
                <div className="sw-run-text">
                  <span className="sw-run-title">{step.label}</span>
                  <span className="sw-run-status">{isActive ? step.pending : "Queued"}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="sw-divider" />
        <p style={{ fontSize: 12, color: "oklch(0.6 0.02 55)", fontFamily: "ui-monospace, Menlo, monospace", letterSpacing: "0.04em" }}>
          Tip — works best with a homepage that explains what you do in one sentence.
        </p>
      </aside>
    </>
  );
}

function AnalyzeButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="sw-btn-primary w-full"
      disabled={pending}
      type="submit"
    >
      {pending ? "Analyzing…" : "Analyze my site →"}
    </Button>
  );
}

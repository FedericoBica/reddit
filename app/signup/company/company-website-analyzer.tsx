"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CompanyWebsiteAnalyzerProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
};

const analysisSteps = [
  "Analyzing your website",
  "Discovering high intent keywords",
  "Generating company description",
];

export function CompanyWebsiteAnalyzer({ action, error }: CompanyWebsiteAnalyzerProps) {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <section className="signup-wizard-main">
        <StepDots active={1} total={5} />
        <p className="page-kicker">Company</p>
        <h1 className="signup-wizard-title">Tell us about your company</h1>
        <p className="signup-wizard-copy">
          We&apos;ll analyze your website and prepare the company description.
        </p>

        {error && <div className="signup-error">{error}</div>}

        <form
          action={action}
          className="signup-form"
          onSubmit={() => setSubmitted(true)}
        >
          <label className="field-group">
            <span className="field-label">Company website</span>
            <Input
              className="h-11 rounded-[8px] bg-white px-3 text-sm"
              name="website"
              type="url"
              placeholder="https://example.com"
              required
            />
          </label>
          <AnalyzeButton />
        </form>
      </section>

      <aside className="signup-wizard-visual">
        <div className="signup-analysis-list signup-analysis-list-compact">
          {analysisSteps.map((step, index) => (
            <AnalysisStep
              active={submitted}
              index={index}
              key={step}
              title={step}
            />
          ))}
        </div>
      </aside>
    </>
  );
}

function AnalyzeButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="h-11 rounded-[8px] font-extrabold"
      disabled={pending}
      type="submit"
    >
      {pending ? "Analyzing..." : "Next"}
    </Button>
  );
}

function StepDots({ active, total }: { active: number; total: number }) {
  return (
    <div className="signup-step-dots">
      {Array.from({ length: total }).map((_, index) => (
        <span key={index} className={index === active ? "signup-step-dot-active" : ""} />
      ))}
    </div>
  );
}

function AnalysisStep({
  active,
  index,
  title,
}: {
  active: boolean;
  index: number;
  title: string;
}) {
  return (
    <div
      className={`signup-analysis-step${active ? " signup-analysis-step-loading" : ""}`}
      style={{ animationDelay: `${index * 640}ms` }}
    >
      <span />
      <div>
        <strong>{title}</strong>
        <p>{active ? "Working on this now." : "Ready"}</p>
      </div>
    </div>
  );
}

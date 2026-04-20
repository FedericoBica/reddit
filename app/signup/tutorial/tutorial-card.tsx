"use client";

import { useState } from "react";
import { Logo } from "@/app/components/logo";
import { Button } from "@/components/ui/button";

type TutorialCardProps = {
  projectId: string;
};

const steps = [
  {
    title: "Welcome to ReddProwl",
    copy:
      "ReddProwl scans Reddit for buying intent, recommendation requests and competitor comparisons that match your company.",
    detail:
      "Your Searchbox ranks posts by intent so you can focus on conversations worth answering.",
  },
  {
    title: "Start with the Searchbox",
    copy:
      "Open a post, read the context, and use the generated reply as a starting point.",
    detail:
      "Battlecards, intent scores and reply generation are ready from the dashboard.",
  },
];

export function TutorialCard({ projectId }: TutorialCardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="signup-tutorial-card">
      <div className="signup-tutorial-hero">
        <div className="signup-tutorial-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((item, index) => (
            <span
              className={index <= step ? "signup-tutorial-progress-active" : undefined}
              key={item.title}
            />
          ))}
        </div>
        <h1>{current.title}</h1>
        <p>{current.copy}</p>
      </div>
      <div className="signup-tutorial-body">
        <div className="signup-tutorial-graphic">
          <Logo size={44} />
          <div className="signup-tutorial-feed" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <p>{current.detail}</p>
        {isLast ? (
          <Button asChild className="h-10 rounded-[8px] font-extrabold">
            <a href={`/dashboard?projectId=${projectId}`}>Next</a>
          </Button>
        ) : (
          <Button
            className="h-10 rounded-[8px] font-extrabold"
            type="button"
            onClick={() => setStep((value) => value + 1)}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

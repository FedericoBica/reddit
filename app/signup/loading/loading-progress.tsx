"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LoadingProgressProps = {
  projectId: string;
};

const STEPS = [
  "Reading your company profile",
  "Identifying relevant subreddits",
  "Scanning recent discussions",
  "Scoring posts by buying intent",
];

const TOTAL_MS = 4000;
const STEP_INTERVALS = [700, 600, 550, 500];

export function LoadingProgress({ projectId }: LoadingProgressProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    let elapsed = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEP_INTERVALS.forEach((delay, i) => {
      elapsed += delay;
      timers.push(setTimeout(() => setActiveStep(i + 1), elapsed));
    });

    const redirectTimer = setTimeout(() => {
      router.push(`/signup/tutorial?projectId=${encodeURIComponent(projectId)}`);
    }, TOTAL_MS + 400);

    return () => {
      cancelAnimationFrame(rafRef.current);
      timers.forEach(clearTimeout);
      clearTimeout(redirectTimer);
    };
  }, [projectId, router]);

  return (
    <div className="signup-scan-panel" aria-live="polite">
      <div className="signup-scan-bar">
        <div className="signup-scan-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="signup-scan-steps">
        {STEPS.map((step, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <div
              key={step}
              className={`signup-scan-step${done ? " signup-scan-step-done" : active ? " signup-scan-step-active" : ""}`}
            >
              <span className="signup-scan-dot" />
              <span>{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoadingProgressProps = {
  projectId: string;
};

const steps = [
  "Learning about you and your competitors",
  "Looking for relevant posts",
];

export function LoadingProgress({ projectId }: LoadingProgressProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const stepTimer = window.setTimeout(() => {
      setActiveStep(1);
    }, 1400);

    const redirectTimer = window.setTimeout(() => {
      router.push(`/signup/tutorial?projectId=${encodeURIComponent(projectId)}`);
    }, 3000);

    return () => {
      window.clearTimeout(stepTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [projectId, router]);

  return (
    <div className="signup-loading-steps" aria-live="polite">
      {steps.map((step, index) => (
        <span
          className={index <= activeStep ? "signup-loading-step-active" : undefined}
          key={step}
        >
          {step}
        </span>
      ))}
    </div>
  );
}

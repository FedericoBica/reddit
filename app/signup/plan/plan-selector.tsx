"use client";

import { useState } from "react";
import { choosePlanFromSignup } from "@/modules/onboarding/signup-actions";
import { Button } from "@/components/ui/button";

const PLANS = [
  {
    id: "startup",
    name: "Startup",
    price: "$19",
    note: "Start generating leads and revenue from Reddit with our entry-level plan for businesses new to Reddit marketing.",
    features: [
      "20 Custom Tracked Keywords",
      "3 Tracked Competitors",
      "100 AI-Guided Replies",
      "Weekly New Lead Opportunities",
      "Weekly Competitor Tracking",
      "Monthly SEO Opportunities",
      "Analytics Insight Dashboard",
      "1 Seat (Owner Only)",
      "Notifications Alerts: Email",
      "Basic Email Support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$39",
    note: "Convert more Reddit leads into paying customers with daily insights and expanded tracking to maximize your ROI",
    popular: true,
    features: [
      "40 Custom Tracked Keywords",
      "6 Tracked Competitors",
      "300 AI-Guided Replies",
      "Daily New Lead Opportunities",
      "Daily Competitor Tracking",
      "Monthly SEO Opportunities",
      "Analytics Insight Dashboard",
      "2 Seats (Owner + 1 Member)",
      "Notifications Alerts: Email & Telegram",
      "Priority Email Support",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    note: "Maximize revenue potential across multiple brands with our most powerful Reddit lead generation.",
    features: [
      "60 Custom Tracked Keywords",
      "8 Tracked Competitors",
      "500 AI-Guided Replies",
      "Daily New Lead Opportunities",
      "Daily Competitor Tracking",
      "Monthly SEO Opportunities",
      "Analytics Insight Dashboard",
      "3 Seats (Owner + 2 Members)",
      "Notifications Alerts: Email & Telegram",
      "Priority Email Support",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

type PlanSelectorProps = {
  projectId: string;
};

export function PlanSelector({ projectId }: PlanSelectorProps) {
  const [selected, setSelected] = useState<PlanId>("growth");
  const plan = PLANS.find((p) => p.id === selected)!;

  return (
    <div className="signup-plan-selector">
      {/* Left: features of selected plan */}
      <div className="signup-plan-features-panel">
        <div className="signup-step-dots">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i === 4 ? "signup-step-dot-active" : ""} />
          ))}
        </div>
        <p className="page-kicker">Plan</p>
        <h1 className="signup-wizard-title">Choose your plan</h1>

        <div className="signup-plan-features-list">
          {plan.features.map((feat) => (
            <div key={feat} className="signup-plan-feature-item">
              <span className="signup-plan-feature-dot" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <form action={choosePlanFromSignup}>
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="plan" value={selected} />
          <Button
            type="submit"
            className="h-11 w-full rounded-[8px] font-extrabold text-sm"
          >
            Start with {plan.name} — {plan.price}/mo →
          </Button>
        </form>
      </div>

      {/* Right: plan cards */}
      <div className="signup-plan-cards-panel">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`signup-plan-card-select${p.id === selected ? " signup-plan-card-select-active" : ""}`}
            onClick={() => setSelected(p.id)}
          >
            {"popular" in p && p.popular && (
              <span className="signup-plan-badge">Recommended</span>
            )}
            <div className="signup-plan-card-select-name">
              <strong>{p.name}</strong>
              <em>{p.price}/mo</em>
            </div>
            <small>{p.note}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

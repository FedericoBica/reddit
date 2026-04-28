"use client";

import { useState } from "react";
import { choosePlanFromSignup } from "@/modules/onboarding/signup-actions";
import { Button } from "@/components/ui/button";
import { SignupProgress } from "@/app/signup/components/signup-progress";

const PLANS = [
  {
    id: "startup",
    name: "Startup",
    price: "$19",
    note: "For founders testing Reddit as a channel — 10 keywords, 100 replies, 1 seat.",
    features: [
      "10 Reddit Keywords",
      "3 Tracked Competitors",
      "100 AI-Guided Replies",
      "Weekly Lead Opportunities",
      "Reddit Monitoring",
      "Analytics Dashboard",
      "1 Seat (Owner Only)",
      "Email Notifications",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: "$39",
    note: "Daily insights, expanded tracking, 300 AI replies, X monitoring — for teams converting social to revenue.",
    popular: true,
    features: [
      "20 Reddit Keywords + 10 X Keywords",
      "6 Tracked Competitors",
      "300 AI-Guided Replies",
      "Daily Lead Opportunities",
      "Reddit + X Monitoring",
      "Analytics Dashboard",
      "2 Seats (Owner + 1 Member)",
      "Email & Telegram Alerts",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    note: "Multiple brands, 500 replies, Slack & webhooks, X monitoring — agencies and multi-product teams.",
    features: [
      "30 Reddit Keywords + 20 X Keywords",
      "8 Tracked Competitors",
      "500 AI-Guided Replies",
      "Daily Lead Opportunities",
      "Reddit + X Monitoring",
      "Analytics Dashboard",
      "3 Seats (Owner + 2 Members)",
      "Email, Telegram & Slack Alerts",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

export function PlanSelector() {
  const [selected, setSelected] = useState<PlanId>("growth");
  const plan = PLANS.find((p) => p.id === selected)!;

  return (
    <div className="signup-plan-selector">
      <div className="signup-plan-features-panel">
        <SignupProgress active={0} />
        <div className="sw-eyebrow" style={{ marginTop: 20 }}>
          <span className="sw-eyebrow-dot" />
          Step 01 · Plan
        </div>
        <h1 className="signup-wizard-title">
          Pick a plan,<br /><em>start in minutes.</em>
        </h1>
        <p className="signup-wizard-copy" style={{ marginBottom: 0 }}>
          Every plan includes keyword tracking, intent scoring, AI replies, and battlecards.
        </p>

        <div className="signup-plan-features-list">
          {plan.features.map((feat) => (
            <div key={feat} className="signup-plan-feature-item">
              <span className="signup-plan-feature-dot" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <form action={choosePlanFromSignup} style={{ marginTop: "auto" }}>
          <input type="hidden" name="plan" value={selected} />
          <Button
            type="submit"
            className="sw-btn-primary w-full"
          >
            Continue with {plan.name} →
          </Button>
        </form>
        <div className="sw-foot-note">
          <span>🔒</span> 7-day trial · cancel anytime · no card today
        </div>
      </div>

      <div className="signup-plan-cards-panel">
        <div className="sw-pane-eyebrow">
          <span style={{ color: "oklch(0.58 0.18 38)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>Choose your plan</span>
          <span className="sw-pane-meta">Monthly</span>
        </div>
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
            <div className="signup-plan-radio" aria-hidden="true" />
            <div className="signup-plan-card-select-name">
              <strong>{p.name}</strong>
              <em>{p.price}<span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "oklch(0.6 0.02 55)", fontStyle: "normal", fontWeight: 500 }}>/mo</span></em>
            </div>
            <small>{p.note}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

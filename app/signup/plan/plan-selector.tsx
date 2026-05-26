"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { usePaddle } from "@/components/paddle/paddle-provider";
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
      "20 Reddit Keywords + 7 X Keywords",
      "5 Tracked Competitors",
      "300 AI-Guided Replies",
      "Daily Lead Opportunities",
      "Reddit + X Monitoring",
      "Monthly SEO opportunities",
      "Analytics Dashboard",
      "2 Seats (Owner + 1 Member)",
      "Email Alerts",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    note: "Multiple brands, 500 replies, Slack & webhooks, X monitoring — agencies and multi-product teams.",
    features: [
      "30 Reddit Keywords + 12 X Keywords",
      "8 Tracked Competitors",
      "500 AI-Guided Replies",
      "Daily Lead Opportunities",
      "Reddit + X Monitoring",
      "Monthly SEO opportunities",
      "Analytics Dashboard",
      "3 Seats (Owner + 2 Members)",
      "Email Alerts",
    ],
  },
] as const;

type PlanId = (typeof PLANS)[number]["id"];

const X_ADDON_PRICES: Record<PlanId, string> = {
  startup: "$10",
  growth: "$15",
  professional: "$20",
};

const PLANS_WITH_X_ADDON = new Set<PlanId>(["growth", "professional"]);

type PlanSelectorProps = {
  projectId?: string;
  userId: string;
  email: string;
  priceIds: Record<PlanId, string>;
  xAddonPriceIds: Record<PlanId, string>;
  appUrl: string;
};

export function PlanSelector({ projectId, userId, email, priceIds, xAddonPriceIds, appUrl }: PlanSelectorProps) {
  const t = useTranslations("signup.plan");
  const paddle = usePaddle();
  const [selected, setSelected] = useState<PlanId>("growth");
  const [xAddon, setXAddon] = useState(false);
  const plan = PLANS.find((p) => p.id === selected)!;

  return (
    <div className="signup-plan-selector">
      <div className="signup-plan-features-panel">
        <SignupProgress active={0} />
        <div className="sw-eyebrow" style={{ marginTop: 20 }}>
          <span className="sw-eyebrow-dot" />
          {t("eyebrow")}
        </div>
        <h1 className="signup-wizard-title">
          {t("title1")}<br /><em>{t("titleEm")}</em>
        </h1>
        <p className="signup-wizard-copy" style={{ marginBottom: 0 }}>
          {t("description")}
        </p>

        <div className="signup-plan-features-list">
          {plan.features.map((feat) => (
            <div key={feat} className="signup-plan-feature-item">
              <span className="signup-plan-feature-dot" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {PLANS_WITH_X_ADDON.has(selected) && (
          <button
            type="button"
            onClick={() => setXAddon((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: xAddon ? "oklch(0.97 0.01 250)" : "#F7F7F5",
              border: xAddon ? "1.5px solid oklch(0.55 0.18 250)" : "1.5px solid #E5E5E2",
              borderRadius: 10,
              padding: "10px 14px",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              marginTop: 4,
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: 4, border: xAddon ? "none" : "1.5px solid #C7C7C5",
              background: xAddon ? "oklch(0.55 0.18 250)" : "white",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {xAddon && <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>✓</span>}
            </span>
            <span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1C1C1E" }}>
                Add X/Twitter monitoring
              </span>
              <span style={{ fontSize: 12, color: "#7C7C83", marginLeft: 6 }}>
                +{X_ADDON_PRICES[selected]}/mo
              </span>
            </span>
          </button>
        )}

        <Button
          type="button"
          className="sw-btn-primary w-full"
          style={{ marginTop: "auto" }}
          disabled={!paddle}
          onClick={() => {
            const successUrl = projectId
              ? `${appUrl}/dashboard?projectId=${projectId}&checkout=success`
              : `${appUrl}/signup/company?checkout=success`;
            const items: Array<{ priceId: string; quantity: number }> = [
              { priceId: priceIds[selected], quantity: 1 },
            ];
            if (xAddon) items.push({ priceId: xAddonPriceIds[selected], quantity: 1 });
            paddle?.Checkout.open({
              items,
              customer: { email },
              customData: { user_id: userId, project_id: projectId ?? null, billing_plan: selected, x_addon: xAddon },
              settings: { successUrl },
            });
          }}
        >
          {t("continueWith", { name: plan.name })}
        </Button>
        <div className="sw-foot-note">
          <span>🔒</span> {t("footNote")}
        </div>
      </div>

      <div className="signup-plan-cards-panel">
        <div className="sw-pane-eyebrow">
          <span style={{ color: "oklch(0.58 0.18 38)", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>{t("choosePlan")}</span>
          <span className="sw-pane-meta">{t("monthly")}</span>
        </div>
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`signup-plan-card-select${p.id === selected ? " signup-plan-card-select-active" : ""}`}
            onClick={() => { setSelected(p.id); if (!PLANS_WITH_X_ADDON.has(p.id)) setXAddon(false); }}
          >
            {"popular" in p && p.popular && (
              <span className="signup-plan-badge">{t("recommended")}</span>
            )}
            <div className="signup-plan-radio" aria-hidden="true" />
            <div className="signup-plan-card-select-name">
              <strong>{p.name}</strong>
              <em>{p.price}<span style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "oklch(0.6 0.02 55)", fontStyle: "normal", fontWeight: 500 }}>{t("perMonth")}</span></em>
            </div>
            <small>{p.note}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

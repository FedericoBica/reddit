"use client";

import { useTransition, type CSSProperties } from "react";
import { usePaddle } from "@/components/paddle/paddle-provider";
import { updateBillingSubscriptionFromForm } from "@/modules/billing/actions";
import type { BillingPlan } from "@/modules/billing/limits";

type Props = {
  plan: BillingPlan;
  priceId: string;
  email: string;
  subscriptionId: string | null;
  successUrl: string;
  customData: Record<string, unknown>;
  disabled?: boolean;
  style?: CSSProperties;
  className?: string;
  children: React.ReactNode;
};

export function PaddleCheckoutButton({
  plan,
  priceId,
  email,
  subscriptionId,
  successUrl,
  customData,
  disabled,
  style,
  className,
  children,
}: Props) {
  const paddle = usePaddle();
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (subscriptionId) {
      // Existing subscription: update server-side via PATCH /subscriptions/{id}
      startTransition(async () => {
        const formData = new FormData();
        formData.set("plan", plan);
        formData.set("subscriptionId", subscriptionId);
        await updateBillingSubscriptionFromForm(formData);
      });
      return;
    }

    // No subscription: open Paddle.js overlay checkout
    paddle?.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: { email },
      customData,
      settings: { successUrl },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || pending || (!subscriptionId && !paddle)}
      style={style}
      className={className}
    >
      {children}
    </button>
  );
}

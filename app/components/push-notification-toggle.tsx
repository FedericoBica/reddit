"use client";

import { useEffect, useMemo, useState } from "react";

type PushNotificationToggleProps = {
  publicKey?: string;
};

type PushStatus = "unsupported" | "disabled" | "enabled" | "denied" | "saving";

export function PushNotificationToggle({ publicKey }: PushNotificationToggleProps) {
  const [status, setStatus] = useState<PushStatus>(() => {
    return publicKey && isPushSupported() ? "disabled" : "unsupported";
  });
  const enabled = status === "enabled";
  const label = useMemo(() => {
    if (status === "saving") return "Guardando...";
    if (status === "enabled") return "Push activas";
    if (status === "denied") return "Push bloqueadas";
    return "Activar push";
  }, [status]);

  useEffect(() => {
    if (!publicKey || !isPushSupported()) return;

    let cancelled = false;

    void getExistingSubscription().then((subscription) => {
      if (cancelled) return;
      if (Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus(subscription ? "enabled" : "disabled");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  if (!publicKey || status === "unsupported") {
    return null;
  }

  return (
    <button
      aria-pressed={enabled}
      className="push-toggle"
      disabled={status === "saving" || status === "denied"}
      onClick={() => void togglePush(publicKey, enabled, setStatus)}
      type="button"
    >
      <span className={enabled ? "push-toggle-dot push-toggle-dot-active" : "push-toggle-dot"} />
      {label}
    </button>
  );
}

async function togglePush(
  publicKey: string,
  enabled: boolean,
  setStatus: (status: PushStatus) => void,
) {
  setStatus("saving");

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    const existing = await registration.pushManager.getSubscription();

    if (enabled) {
      if (existing) {
        await existing.unsubscribe();
        await fetch("/api/push-subscriptions", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
      }

      setStatus("disabled");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "denied") {
      setStatus("denied");
      return;
    }

    if (permission !== "granted") {
      setStatus("disabled");
      return;
    }

    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const response = await fetch("/api/push-subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      throw new Error("Failed to save push subscription");
    }

    setStatus("enabled");
  } catch {
    setStatus("disabled");
  }
}

async function getExistingSubscription() {
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  return registration?.pushManager.getSubscription() ?? null;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

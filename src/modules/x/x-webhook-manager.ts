import "server-only";

import { createHmac } from "crypto";
import { requireEnv } from "@/lib/env";

const X_WEBHOOKS_BASE = "https://api.x.com/2/tweets/search/webhooks";

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

// OAuth 1.0a app-only (consumer key + secret, no access token)
function buildOAuth1Header(method: string, url: string): string {
  const consumerKey = requireEnv("X_CONSUMER_KEY");
  const consumerSecret = requireEnv("X_CONSUMER_SECRET");

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_version: "1.0",
  };

  const normalizedParams = Object.entries(oauthParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join("&");

  const baseUrl = url.split("?")[0];
  // Signing key: consumer_secret& (no token secret for app-only)
  const signingKey = `${percentEncode(consumerSecret)}&`;
  const signatureBase = `${method.toUpperCase()}&${percentEncode(baseUrl)}&${percentEncode(normalizedParams)}`;
  const signature = createHmac("sha1", signingKey).update(signatureBase).digest("base64");

  const headerParts = { ...oauthParams, oauth_signature: signature };
  const headerStr = Object.entries(headerParts)
    .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
    .join(", ");

  return `OAuth ${headerStr}`;
}

type XWebhook = {
  id: string;
  url: string;
  valid: boolean;
  created_at: string;
};

export async function listWebhooks(): Promise<XWebhook[]> {
  const response = await fetch(X_WEBHOOKS_BASE, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${requireEnv("X_API_BEARER_TOKEN")}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to list X webhooks (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { data?: XWebhook[] };
  return payload.data ?? [];
}

export async function registerWebhook(webhookUrl: string): Promise<XWebhook> {
  const url = X_WEBHOOKS_BASE;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildOAuth1Header("POST", url),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: webhookUrl }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to register X webhook (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { data: XWebhook };
  return payload.data;
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const url = `${X_WEBHOOKS_BASE}/${webhookId}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: buildOAuth1Header("DELETE", url),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to delete X webhook (${response.status}): ${body}`);
  }
}

// Creates the stream link: tells X to deliver filtered stream events to the webhook.
// Idempotent — X returns 200 if the link already exists.
export async function createStreamLink(webhookId: string): Promise<void> {
  const url = `${X_WEBHOOKS_BASE}/${webhookId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: buildOAuth1Header("POST", url),
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  // 200 = linked, 201 = newly created — both are fine
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create X stream link (${response.status}): ${body}`);
  }
}

export async function setupXWebhookStream(): Promise<{
  webhookId: string;
  webhookUrl: string;
  registered: boolean;
  linked: boolean;
}> {
  const appUrl = requireEnv("NEXT_PUBLIC_APP_URL");
  const webhookUrl = `${appUrl}/api/x/webhook`;

  const existing = await listWebhooks();
  let webhook = existing.find((w) => w.url === webhookUrl) ?? null;

  let registered = false;
  if (!webhook) {
    webhook = await registerWebhook(webhookUrl);
    registered = true;
  }

  await createStreamLink(webhook.id);

  return { webhookId: webhook.id, webhookUrl, registered, linked: true };
}

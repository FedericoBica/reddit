import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { XConnectedAccountDTO } from "@/db/schemas/domain";

const X_AUTH_URL = "https://twitter.com/i/oauth2/authorize";
const X_TOKEN_URL = "https://api.twitter.com/2/oauth2/token";
const X_SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

export function getXClientId() {
  const id = process.env.X_CLIENT_ID;
  if (!id) throw new Error("Missing X_CLIENT_ID");
  return id;
}

export function getXClientSecret() {
  const secret = process.env.X_CLIENT_SECRET;
  if (!secret) throw new Error("Missing X_CLIENT_SECRET");
  return secret;
}

export function getXCallbackUrl(origin: string) {
  return `${origin}/api/x/oauth/callback`;
}

/** Generate a PKCE code_verifier and code_challenge (S256). */
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64url(array);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = base64url(new Uint8Array(digest));
  return { verifier, challenge };
}

function base64url(buf: Uint8Array): string {
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function buildXAuthUrl({
  clientId,
  callbackUrl,
  challenge,
  state,
}: {
  clientId: string;
  callbackUrl: string;
  challenge: string;
  state: string;
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: X_SCOPES.join(" "),
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return `${X_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens({
  code,
  verifier,
  callbackUrl,
}: {
  code: string;
  verifier: string;
  callbackUrl: string;
}): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const clientId = getXClientId();
  const clientSecret = getXClientSecret();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: callbackUrl,
      code_verifier: verifier,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`X token exchange failed: ${resp.status} ${body}`);
  }

  return resp.json();
}

export async function fetchXUserProfile(
  accessToken: string,
): Promise<{ id: string; username: string; name: string; profile_image_url?: string }> {
  const resp = await fetch(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!resp.ok) throw new Error(`Failed to fetch X user profile: ${resp.status}`);

  const body = await resp.json();
  return body.data;
}

export async function refreshXToken(
  refreshToken: string,
): Promise<{ access_token: string; refresh_token?: string; expires_in?: number }> {
  const clientId = getXClientId();
  const clientSecret = getXClientSecret();
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const resp = await fetch(X_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!resp.ok) throw new Error(`X token refresh failed: ${resp.status}`);
  return resp.json();
}

export async function postTweet(
  accessToken: string,
  text: string,
): Promise<{ id: string; text: string }> {
  const resp = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed to post tweet: ${resp.status} ${body}`);
  }

  const body = await resp.json();
  return body.data;
}

export async function getConnectedAccount(projectId: string): Promise<XConnectedAccountDTO | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("x_connected_accounts")
    .select("id, project_id, user_id, x_user_id, x_username, x_name, x_profile_image_url, token_expires_at, created_at")
    .eq("project_id", projectId)
    .maybeSingle();
  return data ?? null;
}

export async function getConnectedAccountWithTokens(
  projectId: string,
): Promise<{ id: string; access_token: string; refresh_token: string | null; token_expires_at: string | null } | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("x_connected_accounts")
    .select("id, access_token, refresh_token, token_expires_at")
    .eq("project_id", projectId)
    .maybeSingle();
  return data ?? null;
}

export async function disconnectXAccount(projectId: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.from("x_connected_accounts").delete().eq("project_id", projectId);
}

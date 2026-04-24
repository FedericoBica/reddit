const BASE_URL = "https://reddprowl.com"; // overrideable via env at build time

type Campaign = {
  id: string;
  name: string;
  type: string;
  status: string;
  sent_count: number;
  reply_count: number;
  failed_count: number;
  started_at: string | null;
  created_at: string;
};

export type CampaignDetail = Campaign & {
  source_config: Record<string, unknown> | null;
  message_template: string;
  delay_min_sec: number;
  delay_max_sec: number;
};

type QueueItem = {
  id: string;
  campaign_id: string;
  contact_id: string;
  contact: { reddit_username: string };
  interpolatedMessage: string;
  delay_min_sec?: number;
  delay_max_sec?: number;
};

async function apiFetch(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function connect(
  connectToken: string,
  label?: string,
): Promise<{ token: string; tokenId: string; projectId: string; expiresAt: string }> {
  const res = await fetch(`${BASE_URL}/api/ext/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: connectToken, label }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Connection failed");
  }
  return res.json() as Promise<{ token: string; tokenId: string; projectId: string; expiresAt: string }>;
}

export async function getStatus(
  token: string,
): Promise<{ ok: boolean; project: { id: string; name: string } | null }> {
  const res = await apiFetch("/api/ext/status", token);
  if (!res.ok) throw new Error("Unauthorized");
  return res.json() as Promise<{ ok: boolean; project: { id: string; name: string } | null }>;
}

export async function listCampaigns(token: string): Promise<Campaign[]> {
  const res = await apiFetch("/api/ext/campaigns", token);
  if (!res.ok) throw new Error("Failed to list campaigns");
  const data = (await res.json()) as { campaigns: Campaign[] };
  return data.campaigns;
}

export async function createCampaign(
  token: string,
  payload: Record<string, unknown>,
): Promise<Campaign> {
  const res = await apiFetch("/api/ext/campaigns", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to create campaign");
  }
  const data = (await res.json()) as { campaign: Campaign };
  return data.campaign;
}

export async function getCampaign(token: string, campaignId: string): Promise<CampaignDetail> {
  const res = await apiFetch(`/api/ext/campaigns/${campaignId}`, token);
  if (!res.ok) throw new Error("Campaign not found");
  const data = (await res.json()) as { campaign: CampaignDetail };
  return data.campaign;
}

export async function startCampaign(token: string, campaignId: string): Promise<Campaign> {
  const res = await apiFetch(`/api/ext/campaigns/${campaignId}/start`, token, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start campaign");
  const data = (await res.json()) as { campaign: Campaign };
  return data.campaign;
}

export async function pauseCampaign(token: string, campaignId: string): Promise<Campaign> {
  const res = await apiFetch(`/api/ext/campaigns/${campaignId}/pause`, token, { method: "POST" });
  if (!res.ok) throw new Error("Failed to pause campaign");
  const data = (await res.json()) as { campaign: Campaign };
  return data.campaign;
}

export async function getNextQueueItem(
  token: string,
  campaignId: string,
): Promise<QueueItem | null> {
  const res = await apiFetch(`/api/ext/campaigns/${campaignId}/queue/next`, token);
  if (!res.ok) throw new Error("Failed to get queue item");
  const data = (await res.json()) as { item: QueueItem | null };
  return data.item;
}

export async function reportQueueResult(
  token: string,
  queueItemId: string,
  campaignId: string,
  success: boolean,
  errorReason?: string,
): Promise<void> {
  await apiFetch(`/api/ext/queue/${queueItemId}/result`, token, {
    method: "POST",
    body: JSON.stringify({ campaignId, success, errorReason }),
  });
}

type InboundMessage = {
  redditMessageId: string;
  fromUsername: string;
  body: string;
  receivedAt: string;
};

export async function syncInboxMessages(
  token: string,
  messages: InboundMessage[],
): Promise<{ processed: number; skipped: number }> {
  const res = await apiFetch("/api/ext/messages/sync", token, {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("Failed to sync inbox messages");
  return res.json() as Promise<{ processed: number; skipped: number }>;
}

export async function updateContactOutcome(
  token: string,
  contactId: string,
  status: string,
): Promise<void> {
  await apiFetch(`/api/ext/contacts/${contactId}/outcome`, token, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}

export async function addContactsBatch(
  token: string,
  campaignId: string,
  usernames: string[],
): Promise<{ inserted: number; skipped: number }> {
  const res = await apiFetch(`/api/ext/campaigns/${campaignId}/contacts/batch`, token, {
    method: "POST",
    body: JSON.stringify({ usernames }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "Failed to add contacts");
  }
  return res.json() as Promise<{ inserted: number; skipped: number }>;
}

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireEnv } from "@/lib/env";

const X_RULES_URL = "https://api.x.com/2/tweets/search/stream/rules";

type XRule = {
  id: string;
  value: string;
  tag?: string;
};

type ManagedRule = {
  value: string;
  tag: string;
};

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${requireEnv("X_API_BEARER_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

export function buildXRuleTag(projectId: string, keywordId: string) {
  return `redit:${projectId}:${keywordId}`;
}

export function parseXRuleTag(tag: string | undefined): { projectId: string; keywordId: string } | null {
  if (!tag) return null;
  const [prefix, projectId, keywordId] = tag.split(":");
  if (prefix !== "redit" || !projectId || !keywordId) return null;
  return { projectId, keywordId };
}

async function fetchCurrentRules(): Promise<XRule[]> {
  const response = await fetch(X_RULES_URL, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to fetch X stream rules (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as { data?: XRule[] };
  return payload.data ?? [];
}

async function deleteRules(ids: string[]) {
  if (ids.length === 0) return;

  const response = await fetch(X_RULES_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ delete: { ids } }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to delete X stream rules (${response.status}): ${body}`);
  }
}

async function addRules(rules: ManagedRule[]) {
  if (rules.length === 0) return;

  const response = await fetch(X_RULES_URL, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ add: rules }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to add X stream rules (${response.status}): ${body}`);
  }
}

export async function syncAllXStreamRules(): Promise<{ desired: number; removed: number; added: number }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("x_keywords")
    .select("id, project_id, query, is_active, projects!inner(id, status)")
    .eq("is_active", true)
    .eq("projects.status", "active");

  if (error) {
    throw new Error(`Failed to load X keywords for sync: ${error.message}`);
  }

  const desiredRules: ManagedRule[] = (data ?? []).map((row) => ({
    value: row.query,
    tag: buildXRuleTag(row.project_id, row.id),
  }));

  const currentRules = await fetchCurrentRules();
  const currentManaged = currentRules.filter((rule) => rule.tag?.startsWith("redit:"));

  const desiredByTag = new Map(desiredRules.map((rule) => [rule.tag, rule]));
  const currentByTag = new Map(currentManaged.map((rule) => [rule.tag as string, rule]));

  const idsToDelete = currentManaged
    .filter((rule) => {
      const desired = desiredByTag.get(rule.tag as string);
      return !desired || desired.value !== rule.value;
    })
    .map((rule) => rule.id);

  const rulesToAdd = desiredRules.filter((rule) => {
    const current = currentByTag.get(rule.tag);
    return !current || current.value !== rule.value;
  });

  await deleteRules(idsToDelete);
  await addRules(rulesToAdd);

  return {
    desired: desiredRules.length,
    removed: idsToDelete.length,
    added: rulesToAdd.length,
  };
}

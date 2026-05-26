"use server";

import { revalidatePath } from "next/cache";
import { updateProject } from "@/db/mutations/projects";
import type { UpdateProjectInput } from "@/db/schemas/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  addKeyword,
  updateKeyword,
  removeKeyword,
  toggleKeyword,
  addSubreddit,
  removeSubreddit,
  toggleSubreddit,
} from "@/db/mutations/settings";
import {
  addXKeyword,
  removeXKeyword,
  toggleXKeyword,
  updateXKeyword,
} from "@/db/mutations/x";
import { listProjectXKeywords } from "@/db/queries/x";
import { inngest } from "@/inngest/client";
import { requireUser } from "@/modules/auth/server";
import { getCurrentBillingPlan } from "@/modules/billing/current";
import { requireProjectAccess } from "@/modules/projects/access";
import { listProjectKeywords } from "@/db/queries/settings";

async function queueXRulesSync(projectId?: string) {
  await inngest.send({
    name: "x/rules.sync.requested",
    data: { projectId: projectId ?? null },
  });
}

export async function updateProjectFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const input: UpdateProjectInput = {};

  if (formData.has("name")) input.name = String(formData.get("name") ?? "").trim() || undefined;
  if (formData.has("websiteUrl")) input.websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || null;
  if (formData.has("valueProposition")) input.valueProposition = String(formData.get("valueProposition") ?? "").trim() || null;
  if (formData.has("tone")) input.tone = String(formData.get("tone") ?? "").trim() || null;
  if (formData.has("replyLength")) {
    const val = String(formData.get("replyLength") ?? "").trim();
    if (val === "short" || val === "medium" || val === "long") input.replyLength = val;
  }
  if (formData.has("region")) input.region = String(formData.get("region") ?? "").trim() || null;

  await updateProject(projectId, input);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  const normalized = term.toLowerCase().replace(/\s+/g, " ");
  const [plan, keywords] = await Promise.all([
    getCurrentBillingPlan(),
    listProjectKeywords(projectId),
  ]);

  const duplicate = keywords.find((k) => k.term.toLowerCase() === normalized);
  if (duplicate) {
    throw new Error(`Keyword "${duplicate.term}" already exists.`);
  }

  if (!plan) throw new Error("No active subscription.");

  if (plan.maxKeywords !== null) {
    const activeCount = keywords.filter(
      (k) => k.is_active && k.type !== "competitor" && k.type !== "searchbox",
    ).length;
    if (activeCount >= plan.maxKeywords) {
      throw new Error(`Active keyword limit reached (${plan.maxKeywords} on ${plan.label} plan).`);
    }
  }

  await addKeyword(projectId, term);
  revalidatePath("/settings");
}

export async function addSearchboxKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  await addKeyword(projectId, term, "searchbox");
  revalidatePath("/settings");
}

export async function addCompetitorFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  const normalized = term.toLowerCase().replace(/\s+/g, " ");
  const keywords = await listProjectKeywords(projectId);
  const duplicate = keywords.find((k) => k.term.toLowerCase() === normalized);
  if (duplicate) {
    throw new Error(`Keyword "${duplicate.term}" already exists.`);
  }

  await addKeyword(projectId, term, "competitor");
  revalidatePath("/settings");
}

export async function updateKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");
  const term = String(formData.get("term") ?? "").trim();

  if (!term) return;

  const normalized = term.toLowerCase().replace(/\s+/g, " ");
  const keywords = await listProjectKeywords(projectId);
  const duplicate = keywords.find(
    (k) => k.term.toLowerCase() === normalized && k.id !== keywordId,
  );
  if (duplicate) {
    throw new Error(`Keyword "${duplicate.term}" already exists.`);
  }

  await updateKeyword(projectId, keywordId, term);
  revalidatePath("/settings");
}

export async function removeKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");

  await removeKeyword(projectId, keywordId);
  revalidatePath("/settings");
}

export async function toggleKeywordFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (isActive) {
    const plan = await getCurrentBillingPlan();
    if (!plan) throw new Error("No active subscription.");
    if (plan.maxKeywords !== null) {
      const keywords = await listProjectKeywords(projectId);
      const activeCount = keywords.filter(
        (k) => k.is_active && k.id !== keywordId && k.type !== "competitor" && k.type !== "searchbox",
      ).length;
      if (activeCount >= plan.maxKeywords) {
        throw new Error(`Active keyword limit reached (${plan.maxKeywords} on ${plan.label} plan).`);
      }
    }
  }

  await toggleKeyword(projectId, keywordId, isActive);
  revalidatePath("/settings");
}

export async function addSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const name = String(formData.get("name") ?? "").trim();

  if (!name) return;

  await addSubreddit(projectId, name);
  revalidatePath("/settings");
}

export async function removeSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const subredditId = String(formData.get("subredditId") ?? "");

  await removeSubreddit(projectId, subredditId);
  revalidatePath("/settings");
}

export async function toggleSubredditFromForm(formData: FormData) {
  await requireUser("/dashboard");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const subredditId = String(formData.get("subredditId") ?? "");
  const isActive = formData.get("isActive") === "true";

  await toggleSubreddit(projectId, subredditId, isActive);
  revalidatePath("/settings");
}

export async function saveTelegramChatIdFromForm(formData: FormData): Promise<void> {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "").trim();
  const chatId = String(formData.get("telegramChatId") ?? "").trim() || null;

  if (!projectId) return;
  await requireProjectAccess(projectId, "/settings");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({ telegram_chat_id: chatId })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to save Telegram chat ID: ${error.message}`);

  revalidatePath("/settings");
}

export async function saveNotificationPrefsFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return;
  await requireProjectAccess(projectId, "/settings");

  const notifyEmail = formData.get("notifyEmail") === "true";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("projects")
    .update({ notify_email: notifyEmail })
    .eq("id", projectId);

  if (error) throw new Error(`Failed to save notification preferences: ${error.message}`);

  revalidatePath("/settings");
}

export async function addXKeywordFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const query = String(formData.get("query") ?? "").trim();

  if (!query) return;

  const plan = await getCurrentBillingPlan();
  if (!plan) throw new Error("No active subscription.");
  if (plan.maxXKeywords !== null) {
    const xKeywords = await listProjectXKeywords(projectId);
    const activeCount = xKeywords.filter((k) => k.is_active).length;
    if (activeCount >= plan.maxXKeywords) {
      throw new Error(`X keyword limit reached (${plan.maxXKeywords} on ${plan.label} plan).`);
    }
  }

  await addXKeyword(projectId, query);
  await queueXRulesSync(projectId);
  revalidatePath("/settings");
}

export async function updateXKeywordFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");
  const query = String(formData.get("query") ?? "").trim();

  if (!query) return;

  await updateXKeyword(projectId, keywordId, query);
  await queueXRulesSync(projectId);
  revalidatePath("/settings");
}

export async function toggleXKeywordFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");
  const isActive = formData.get("isActive") === "true";

  await toggleXKeyword(projectId, keywordId, isActive);
  await queueXRulesSync(projectId);
  revalidatePath("/settings");
}

export async function removeXKeywordFromForm(formData: FormData) {
  await requireUser("/settings");

  const projectId = String(formData.get("projectId") ?? "");
  await requireProjectAccess(projectId, "/settings");
  const keywordId = String(formData.get("keywordId") ?? "");

  await removeXKeyword(projectId, keywordId);
  await queueXRulesSync(projectId);
  revalidatePath("/settings");
}

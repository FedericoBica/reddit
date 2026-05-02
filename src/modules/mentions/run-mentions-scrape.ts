import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertBrandMention, updateProjectLastMentionsScrapedAt } from "@/db/mutations/brand-mentions";
import { classifyMention } from "./mention-classifier";
import { createRedditDiscoveryProvider } from "@/modules/discovery/reddit/provider";
import type { RedditDiscoveryProvider } from "@/modules/discovery/reddit/types";
import { getBillingPlanForUser } from "@/modules/billing/current";
import type { RedditComment } from "@/modules/discovery/reddit/types";
import { inngest } from "@/inngest/client";

type MentionTarget = {
  term: string;
  targetType: "company" | "competitor";
  targetLabel: string;
};

type ProjectMentionTarget = {
  id: string;
  name: string;
  website_url: string | null;
  value_proposition: string | null;
  region: string | null;
  owner_id: string;
};

const ERROR_RATE_THRESHOLD = 0.5; // fail loudly if >50% of candidates error

type ScrapeResult = { saved: number; errors: number; lastError: string | null };

export async function runMentionsScrapeWithCompetitors(
  projectId: string,
  options: { provider?: RedditDiscoveryProvider } = {},
): Promise<number> {
  const provider = options.provider ?? createRedditDiscoveryProvider();
  const supabase = createSupabaseAdminClient();

  const [{ data: project }, { data: competitors }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, website_url, value_proposition, region, owner_id")
      .eq("id", projectId)
      .eq("status", "active")
      .single(),
    supabase
      .from("keywords")
      .select("id, term")
      .eq("project_id", projectId)
      .eq("type", "competitor")
      .eq("is_active", true),
  ]);

  if (!project) return 0;

  const plan = await getBillingPlanForUser(project.owner_id);
  const maxCommentsPerKeyword = plan.maxCommentsPerKeyword;
  const timeWindow = plan.keywordSearchTimeWindow;

  const targets = buildMentionTargets(project as ProjectMentionTarget);

  for (const competitor of competitors ?? []) {
    if (!competitor.term?.trim()) continue;
    const domain = competitor.term.trim();

    targets.push({
      term: domain,
      targetType: "competitor",
      targetLabel: domain,
    });

    // Also search by company name derived from domain (e.g. "attio.com" → "attio")
    const companyName = domain
      .replace(/\.[a-z]{2,}$/i, "")
      .replace(/[.-]/g, " ")
      .trim();

    if (companyName && companyName.toLowerCase() !== domain.toLowerCase()) {
      targets.push({
        term: companyName,
        targetType: "competitor",
        targetLabel: domain,
      });
    }
  }

  // Always record the attempt — even if 0 mentions are found — so the due
  // check in the scheduler doesn't treat a zero-result project as perpetually overdue.
  await updateProjectLastMentionsScrapedAt(projectId);

  if (!targets.length) return 0;

  const queries = targets.map((t) => t.term);

  let comments;
  if (provider.searchCommentsBatch) {
    comments = await provider.searchCommentsBatch({
      queries,
      sort: "new",
      time: timeWindow,
      limitPerQuery: maxCommentsPerKeyword,
    });
  } else if (provider.searchComments) {
    const results = await Promise.all(
      queries.map((q) =>
        provider.searchComments!({ query: q, sort: "new", time: timeWindow, limit: maxCommentsPerKeyword }),
      ),
    );
    comments = results.flat();
  } else {
    return 0;
  }

  if (comments.length === 0) {
    console.warn(
      `[scrape/mentions] Project ${projectId} returned 0 comments for ${queries.length} mention targets using sort=new, time=${timeWindow}.`,
    );
  }

  const { saved, errors, lastError } = await processAndSaveComments(comments, targets, projectId, project as ProjectMentionTarget);

  if (errors > 0) {
    const total = saved + errors;
    const errorRate = errors / total;
    if (errorRate >= ERROR_RATE_THRESHOLD) {
      throw new Error(
        `[mentions] project ${projectId}: ${errors}/${total} candidates failed classification/save (${Math.round(errorRate * 100)}%). Last error: ${lastError ?? "unknown"}`,
      );
    }
    console.warn(`[mentions] project ${projectId}: ${errors}/${total} candidates failed, ${saved} saved. Last error: ${lastError ?? "unknown"}`);
  }

  if (saved > 0) {
    await inngest.send({
      name: "mentions/scrape.completed",
      data: { projectId, newMentionsCount: saved },
    });
  }

  return saved;
}

async function processAndSaveComments(
  comments: RedditComment[],
  targets: MentionTarget[],
  projectId: string,
  project: ProjectMentionTarget,
): Promise<ScrapeResult> {
  const seen = new Set<string>();
  let saved = 0;
  let errors = 0;
  let lastError: string | null = null;

  for (const comment of comments) {
    const commentText = comment.body.toLowerCase();

    for (const target of targets) {
      const key = `${comment.id}::${target.targetLabel}`;
      if (seen.has(key)) continue;
      if (!commentText.includes(target.term.toLowerCase())) continue;
      seen.add(key);

      try {
        const classification = await classifyMention({
          targetLabel: target.targetLabel,
          targetType: target.targetType,
          valueProposition: project.value_proposition,
          region: project.region,
          subreddit: comment.subreddit,
          title: comment.parentPostTitle,
          body: comment.body,
        });

        await upsertBrandMention({
          projectId,
          redditPostId: comment.id,
          targetType: target.targetType,
          targetLabel: target.targetLabel,
          title: comment.parentPostTitle,
          body: comment.body,
          subreddit: comment.subreddit,
          author: comment.author,
          permalink: comment.permalink,
          url: comment.parentPostUrl,
          redditScore: comment.score ?? 0,
          numComments: 0,
          sentiment: classification.sentiment,
          sentimentReason: classification.sentimentReason,
          postType: classification.postType,
          mentionContext: classification.mentionContext,
          responsePriority: classification.responsePriority,
          sentimentEvidence: classification.sentimentEvidence,
          summary: classification.summary,
          wrongRegion: classification.wrongRegion,
          postedAt: comment.createdUtc,
          isComment: true,
          parentPostId: comment.parentPostId,
        });

        saved++;
      } catch (err) {
        errors++;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(
          `[mentions] Failed to classify/save comment ${comment.id} for "${target.targetLabel}":`,
          lastError,
        );
      }
    }
  }

  return { saved, errors, lastError };
}

function buildMentionTargets(project: ProjectMentionTarget): MentionTarget[] {
  const targets: MentionTarget[] = [];

  if (project.name?.trim()) {
    targets.push({
      term: project.name.trim(),
      targetType: "company",
      targetLabel: project.name.trim(),
    });
  }

  if (project.website_url) {
    const domain = extractDomain(project.website_url);
    if (domain && domain !== project.name.trim().toLowerCase()) {
      targets.push({
        term: domain,
        targetType: "company",
        targetLabel: project.name.trim(),
      });
    }
  }

  return targets;
}

function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url.startsWith("http") ? url : `https://${url}`);
    return hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

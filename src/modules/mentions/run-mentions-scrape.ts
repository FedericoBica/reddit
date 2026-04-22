import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertBrandMention, updateProjectLastMentionsScrapedAt } from "@/db/mutations/brand-mentions";
import { classifyMentionSentiment } from "./mention-classifier";
import { createRedditDiscoveryProvider } from "@/modules/discovery/reddit/provider";
import type { RedditDiscoveryProvider } from "@/modules/discovery/reddit/types";

type MentionTarget = {
  term: string;
  targetType: "company" | "competitor";
  targetLabel: string;
};

type ProjectMentionTarget = {
  id: string;
  name: string;
  website_url: string | null;
  owner_id: string;
};

const MENTIONS_MAX_PER_TERM = 25;
const MENTIONS_TIME_WINDOW = "month" as const;
const ERROR_RATE_THRESHOLD = 0.5; // fail loudly if >50% of candidates error

type ScrapeResult = { saved: number; errors: number };

export async function runMentionsScrapeWithCompetitors(
  projectId: string,
  options: { provider?: RedditDiscoveryProvider } = {},
): Promise<number> {
  const provider = options.provider ?? createRedditDiscoveryProvider();
  const supabase = createSupabaseAdminClient();

  const [{ data: project }, { data: competitors }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, website_url, owner_id")
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

  const targets = buildMentionTargets(project as ProjectMentionTarget);

  for (const competitor of competitors ?? []) {
    if (competitor.term?.trim()) {
      targets.push({
        term: competitor.term.trim(),
        targetType: "competitor",
        targetLabel: competitor.term.trim(),
      });
    }
  }

  // Always record the attempt — even if 0 mentions are found — so the due
  // check in the scheduler doesn't treat a zero-result project as perpetually overdue.
  await updateProjectLastMentionsScrapedAt(projectId);

  if (!targets.length) return 0;

  const queries = targets.map((t) => t.term);

  let posts;
  if (provider.searchPostsBatch) {
    posts = await provider.searchPostsBatch({
      queries,
      sort: "new",
      time: MENTIONS_TIME_WINDOW,
      limitPerQuery: MENTIONS_MAX_PER_TERM,
    });
  } else if (provider.searchPosts) {
    const results = await Promise.all(
      queries.map((q) =>
        provider.searchPosts!({ query: q, sort: "new", time: MENTIONS_TIME_WINDOW, limit: MENTIONS_MAX_PER_TERM }),
      ),
    );
    posts = results.flat();
  } else {
    return 0;
  }

  const { saved, errors } = await processAndSavePosts(posts, targets, projectId);

  if (errors > 0) {
    const total = saved + errors;
    const errorRate = errors / total;
    if (errorRate >= ERROR_RATE_THRESHOLD) {
      throw new Error(
        `[mentions] project ${projectId}: ${errors}/${total} candidates failed classification/save (${Math.round(errorRate * 100)}%). Possible classifier or DB issue.`,
      );
    }
    console.warn(`[mentions] project ${projectId}: ${errors}/${total} candidates failed, ${saved} saved.`);
  }

  return saved;
}

async function processAndSavePosts(
  posts: Awaited<ReturnType<ReturnType<typeof createRedditDiscoveryProvider>["fetchNewPosts"]>>,
  targets: MentionTarget[],
  projectId: string,
): Promise<ScrapeResult> {
  const seen = new Set<string>();
  let saved = 0;
  let errors = 0;

  for (const post of posts) {
    const postText = `${post.title} ${post.body ?? ""}`.toLowerCase();

    for (const target of targets) {
      const key = `${post.id}::${target.targetLabel}`;
      if (seen.has(key)) continue;
      if (!postText.includes(target.term.toLowerCase())) continue;
      seen.add(key);

      try {
        const { sentiment, reason } = await classifyMentionSentiment({
          targetLabel: target.targetLabel,
          title: post.title,
          body: post.body,
        });

        await upsertBrandMention({
          projectId,
          redditPostId: post.id,
          targetType: target.targetType,
          targetLabel: target.targetLabel,
          title: post.title,
          body: post.body,
          subreddit: post.subreddit,
          author: post.author,
          permalink: post.permalink,
          url: post.url,
          redditScore: post.score ?? 0,
          numComments: post.numComments ?? 0,
          sentiment,
          sentimentReason: reason,
          postedAt: post.createdUtc,
        });

        saved++;
      } catch (err) {
        errors++;
        console.error(
          `[mentions] Failed to classify/save post ${post.id} for "${target.targetLabel}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  return { saved, errors };
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

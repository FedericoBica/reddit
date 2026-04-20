import "server-only";

import { logOpenAIUsageForProject } from "@/db/mutations/api-usage";
import { markProjectSearchboxScanned, upsertSearchboxResult } from "@/db/mutations/searchbox";
import { listProjectsDueForSearchbox, getProjectForSearchbox, type SearchboxScrapeTarget } from "@/db/queries/searchbox";
import { classifyLeadCandidate } from "@/modules/discovery/classification/lead-classifier";
import type { RedditPost } from "@/modules/discovery/reddit/types";
import { searchGoogleForRedditPosts } from "@/modules/searchbox/serp/serp-provider";
import { fetchRedditPostMetadata } from "@/modules/searchbox/scraping/fetch-reddit-metadata";

const SEARCHBOX_INTENT_THRESHOLD = 60;
const MAX_RESULTS_PER_PROJECT = 50;

export async function runSearchboxScrapeForProject(projectId: string) {
  const target = await getProjectForSearchbox(projectId);
  if (!target) return { projectId, status: "skipped", reason: "Project not found or no keywords" };
  const result = await scrapeSearchboxForTarget(target);
  return { projectId, ...result };
}

async function scrapeSearchboxForTarget(target: SearchboxScrapeTarget) {
  let resultsFound = 0;
  let resultsNew = 0;
  let classificationsCount = 0;
  let classifierInputTokens = 0;
  let classifierOutputTokens = 0;
  let classifierModel: string | null = null;
  let serpSuccesses = 0;
  let serpFailures = 0;
  const seenPostIds = new Set<string>();

  // Fetch all keywords from SerpAPI in parallel
  const serpResultsByKeyword = await Promise.all(
    target.keywords.map(async (keyword) => {
      try {
        const results = await searchGoogleForRedditPosts(keyword.term);
        return { keyword, results, ok: true as const };
      } catch (err) {
        console.error(`SerpAPI failed for keyword "${keyword.term}":`, err);
        return { keyword, results: [], ok: false as const };
      }
    }),
  );

  for (const { ok } of serpResultsByKeyword) {
    if (ok) serpSuccesses += 1;
    else serpFailures += 1;
  }

  // Flatten unique candidates
  const candidates: { keyword: { id: string; term: string }; serpResult: (typeof serpResultsByKeyword)[0]["results"][0] }[] = [];
  for (const { keyword, results } of serpResultsByKeyword) {
    for (const serpResult of results) {
      if (resultsFound + candidates.length >= MAX_RESULTS_PER_PROJECT) break;
      if (seenPostIds.has(serpResult.redditPostId)) continue;
      if (!serpResult.title) continue;
      seenPostIds.add(serpResult.redditPostId);
      candidates.push({ keyword, serpResult });
    }
  }

  // Classify all candidates in parallel (batches of 10)
  const CONCURRENCY = 10;
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async ({ keyword, serpResult }) => {
        const post: RedditPost = {
          id: serpResult.redditPostId,
          fullname: `t3_${serpResult.redditPostId}`,
          title: serpResult.title,
          body: serpResult.snippet,
          subreddit: serpResult.subreddit,
          author: null,
          permalink: serpResult.permalink,
          url: serpResult.permalink,
          createdUtc: null,
          score: null,
          numComments: null,
          rawData: serpResult,
        };

        const classification = await classifyLeadCandidate({
          project: target.project,
          post,
          keywordsMatched: [keyword.term],
        });

        classificationsCount += 1;
        classifierModel = classification.usage.model;
        classifierInputTokens += classification.usage.inputTokens ?? 0;
        classifierOutputTokens += classification.usage.outputTokens ?? 0;

        if (classification.intentScore < SEARCHBOX_INTENT_THRESHOLD) return;

        const meta = await fetchRedditPostMetadata(serpResult.redditPostId);

        const { isNew } = await upsertSearchboxResult({
          projectId: target.project.id,
          redditPostId: serpResult.redditPostId,
          googleKeyword: keyword.term,
          googleRank: serpResult.googleRank,
          title: serpResult.title,
          body: serpResult.snippet,
          subreddit: serpResult.subreddit,
          author: null,
          permalink: serpResult.permalink,
          url: serpResult.permalink,
          redditScore: meta.score,
          redditNumComments: meta.numComments,
          redditCreatedUtc: meta.createdUtc,
          intentScore: classification.intentScore,
          classificationReason: classification.classificationReason,
        });

        resultsFound += 1;
        if (isNew) resultsNew += 1;
      }),
    );
  }

  if (classificationsCount > 0) {
    try {
      await logOpenAIUsageForProject({
        projectId: target.project.id,
        operation: "searchbox_classify_candidates",
        model: classifierModel,
        inputTokens: classifierInputTokens,
        outputTokens: classifierOutputTokens,
        requestsCount: classificationsCount,
        metadata: { results_found: resultsFound, results_new: resultsNew },
      });
    } catch (err) {
      console.error("Failed to log searchbox classification usage", err);
    }
  }

  if (serpSuccesses > 0) {
    await markProjectSearchboxScanned(target.project.id);
  }

  const status = serpSuccesses === 0 ? "skipped_serp_outage" : "completed";
  return { status, resultsFound, resultsNew, serpSuccesses, serpFailures };
}

export async function runSearchboxScrape() {
  const targets = await listProjectsDueForSearchbox();
  const results = [];

  for (const target of targets) {
    try {
      const result = await scrapeSearchboxForTarget(target);
      results.push({ projectId: target.project.id, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown searchbox error";
      console.error(`Searchbox scan failed for project ${target.project.id}:`, message);
      results.push({ projectId: target.project.id, status: "failed", reason: message });
    }
  }

  return { projectsScanned: targets.length, results };
}

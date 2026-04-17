import "server-only";

import { logOpenAIUsageForProject } from "@/db/mutations/api-usage";
import { markProjectSearchboxScanned, upsertSearchboxResult } from "@/db/mutations/searchbox";
import { listProjectsDueForSearchbox } from "@/db/queries/searchbox";
import { classifyLeadCandidate } from "@/modules/discovery/classification/lead-classifier";
import type { RedditPost } from "@/modules/discovery/reddit/types";
import { searchGoogleForRedditPosts } from "@/modules/searchbox/serp/serp-provider";
import { fetchRedditPostMetadata } from "@/modules/searchbox/scraping/fetch-reddit-metadata";

const SEARCHBOX_INTENT_THRESHOLD = 60;
const MAX_RESULTS_PER_PROJECT = 50;

export async function runSearchboxScrape() {
  const targets = await listProjectsDueForSearchbox();
  const results = [];

  for (const target of targets) {
    try {
      let resultsFound = 0;
      let resultsNew = 0;
      let classificationsCount = 0;
      let classifierInputTokens = 0;
      let classifierOutputTokens = 0;
      let classifierModel: string | null = null;
      let serpSuccesses = 0;
      let serpFailures = 0;
      const seenPostIds = new Set<string>();

      for (const keyword of target.keywords) {
        if (resultsFound >= MAX_RESULTS_PER_PROJECT) break;

        let serpResults;
        try {
          serpResults = await searchGoogleForRedditPosts(keyword.term);
          serpSuccesses += 1;
        } catch (err) {
          serpFailures += 1;
          console.error(`SerpAPI failed for keyword "${keyword.term}":`, err);
          continue;
        }

        for (const serpResult of serpResults) {
          if (resultsFound >= MAX_RESULTS_PER_PROJECT) break;
          if (seenPostIds.has(serpResult.redditPostId)) continue;
          seenPostIds.add(serpResult.redditPostId);

          if (!serpResult.title) continue;

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

          if (classification.intentScore < SEARCHBOX_INTENT_THRESHOLD) continue;

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
        }
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

      // Only advance last_searchbox_at if at least one SerpAPI call succeeded.
      // A full outage (serpSuccesses === 0) should not delay the next retry.
      if (serpSuccesses > 0) {
        await markProjectSearchboxScanned(target.project.id);
      }

      const status = serpSuccesses === 0 ? "skipped_serp_outage" : "completed";

      results.push({
        projectId: target.project.id,
        status,
        resultsFound,
        resultsNew,
        serpSuccesses,
        serpFailures,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown searchbox error";
      console.error(`Searchbox scan failed for project ${target.project.id}:`, message);
      results.push({ projectId: target.project.id, status: "failed", reason: message });
    }
  }

  return { projectsScanned: targets.length, results };
}

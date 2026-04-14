import "server-only";

import { logOpenAIUsageForProject, logRedditUsageForProject } from "@/db/mutations/api-usage";
import { createLeadForProjectWorker } from "@/db/mutations/leads";
import {
  completeProjectScrapeRun,
  createProjectScrapeRun,
  failProjectScrapeRun,
  markSubredditScanned,
  skipProjectScrapeRun,
} from "@/db/mutations/scraping";
import { listProjectsDueForScraping } from "@/db/queries/scraping";
import { classifyLeadCandidate } from "@/modules/discovery/classification/lead-classifier";
import { findMatchedKeywords } from "@/modules/discovery/classification/keyword-match";
import { RedditApiProvider } from "@/modules/discovery/reddit/reddit-api-provider";
import type { RedditDiscoveryProvider } from "@/modules/discovery/reddit/types";

type RunGlobalScrapeOptions = {
  runId?: string;
  provider?: RedditDiscoveryProvider;
};

export async function runGlobalScrape(options: RunGlobalScrapeOptions = {}) {
  const provider = options.provider ?? new RedditApiProvider();
  const runId = options.runId ?? crypto.randomUUID();
  const maxProjects = readPositiveIntEnv("SCRAPE_MAX_PROJECTS_PER_RUN", 10);
  const maxSubreddits = readPositiveIntEnv("SCRAPE_MAX_SUBREDDITS_PER_PROJECT", 5);
  const maxPosts = readPositiveIntEnv("SCRAPE_MAX_POSTS_PER_SUBREDDIT", 25);
  const leadIntentThreshold = readPositiveIntEnv("LEAD_INTENT_THRESHOLD", 70);
  const targets = await listProjectsDueForScraping(maxProjects);
  const results = [];

  for (const target of targets) {
    const subreddits = target.subreddits.slice(0, maxSubreddits);
    const scrapeRun = await createProjectScrapeRun({
      projectId: target.project.id,
      runId,
      subredditsCount: subreddits.length,
      metadata: {
        max_projects: maxProjects,
        max_subreddits_per_project: maxSubreddits,
        max_posts_per_subreddit: maxPosts,
        lead_intent_threshold: leadIntentThreshold,
      },
    });

    if (subreddits.length === 0) {
      await skipProjectScrapeRun({
        projectId: target.project.id,
        scrapeRunId: scrapeRun.id,
        reason: "No active subreddits configured",
      });
      results.push({ projectId: target.project.id, status: "skipped", postsSeen: 0 });
      continue;
    }

    try {
      let postsSeen = 0;
      let leadsCreated = 0;
      let duplicatesSkipped = 0;
      let requestsCount = 0;
      let classificationsCount = 0;
      let classifierInputTokens = 0;
      let classifierOutputTokens = 0;
      let classifierModel: string | null = null;

      for (const subreddit of subreddits) {
        const posts = await provider.fetchNewPosts({
          subreddit: subreddit.name,
          limit: maxPosts,
        });

        postsSeen += posts.length;
        requestsCount += 1;

        for (const post of posts) {
          const keywordsMatched = findMatchedKeywords(post, target.keywords);

          if (keywordsMatched.length === 0) {
            continue;
          }

          const classification = await classifyLeadCandidate({
            project: target.project,
            post,
            keywordsMatched,
          });

          classificationsCount += 1;
          classifierModel = classification.usage.model;
          classifierInputTokens += classification.usage.inputTokens ?? 0;
          classifierOutputTokens += classification.usage.outputTokens ?? 0;

          if (classification.intentScore < leadIntentThreshold) {
            continue;
          }

          const result = await createLeadForProjectWorker({
            projectId: target.project.id,
            redditPostId: post.id,
            redditFullname: post.fullname,
            title: post.title,
            body: post.body,
            subreddit: post.subreddit,
            author: post.author,
            permalink: post.permalink,
            url: post.url,
            createdUtc: post.createdUtc,
            score: post.score,
            numComments: post.numComments,
            intentScore: classification.intentScore,
            regionScore: classification.regionScore,
            sentiment: classification.sentiment,
            classificationReason: classification.classificationReason,
            classifierPromptVersion: classification.promptVersion,
            keywordsMatched,
            rawData: post.rawData,
          });

          if (result.duplicate) {
            duplicatesSkipped += 1;
          } else {
            leadsCreated += 1;
          }
        }

        await markSubredditScanned(subreddit.id);
      }

      await logRedditUsageForProject({
        projectId: target.project.id,
        operation: "scrape_subreddit_new_posts",
        requestsCount,
        metadata: {
          run_id: runId,
          posts_seen: postsSeen,
          leads_created: leadsCreated,
          duplicates_skipped: duplicatesSkipped,
          subreddits_count: subreddits.length,
        },
      });

      if (classificationsCount > 0) {
        try {
          await logOpenAIUsageForProject({
            projectId: target.project.id,
            operation: "classify_reddit_lead_candidates",
            model: classifierModel,
            inputTokens: classifierInputTokens,
            outputTokens: classifierOutputTokens,
            requestsCount: classificationsCount,
            metadata: {
              run_id: runId,
              posts_seen: postsSeen,
              classifications_count: classificationsCount,
              leads_created: leadsCreated,
              duplicates_skipped: duplicatesSkipped,
            },
          });
        } catch (usageLogError) {
          console.error("Failed to log lead classification usage", usageLogError);
        }
      }

      await completeProjectScrapeRun({
        projectId: target.project.id,
        scrapeRunId: scrapeRun.id,
        postsSeen,
        leadsCreated,
        duplicatesSkipped,
      });

      results.push({
        projectId: target.project.id,
        status: "completed",
        postsSeen,
        leadsCreated,
        duplicatesSkipped,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scraping error";
      await failProjectScrapeRun({
        projectId: target.project.id,
        scrapeRunId: scrapeRun.id,
        currentFailCount: target.project.scrape_fail_count,
        errorMessage: message,
      });
      results.push({ projectId: target.project.id, status: "failed", postsSeen: 0 });
    }
  }

  return {
    runId,
    projectsConsidered: targets.length,
    results,
  };
}

function readPositiveIntEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  const value = rawValue ? Number.parseInt(rawValue, 10) : fallback;

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return value;
}

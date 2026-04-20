import "server-only";

import { logOpenAIUsageForProject, logRedditUsageForProject } from "@/db/mutations/api-usage";
import { createLeadForProjectWorker } from "@/db/mutations/leads";
import { inngest } from "@/inngest/client";
import {
  completeProjectScrapeRun,
  createProjectScrapeRun,
  failProjectScrapeRun,
  skipProjectScrapeRun,
} from "@/db/mutations/scraping";
import { getProjectForScraping, listProjectsDueForScraping } from "@/db/queries/scraping";
import { classifyLeadCandidate } from "@/modules/discovery/classification/lead-classifier";
import { findMatchedKeywords } from "@/modules/discovery/classification/keyword-match";
import { createRedditDiscoveryProvider } from "@/modules/discovery/reddit/provider";
import type { RedditDiscoveryProvider } from "@/modules/discovery/reddit/types";
import { getBillingPlanForUser } from "@/modules/billing/current";

type RunGlobalScrapeOptions = {
  runId?: string;
  provider?: RedditDiscoveryProvider;
};

export async function runGlobalScrape(options: RunGlobalScrapeOptions = {}) {
  const provider = options.provider ?? createRedditDiscoveryProvider();
  const runId = options.runId ?? crypto.randomUUID();
  const maxProjects = readPositiveIntEnv("SCRAPE_MAX_PROJECTS_PER_RUN", 10);
  const maxPosts = readPositiveIntEnv("SCRAPE_MAX_POSTS_PER_KEYWORD", 25);
  const leadIntentThreshold = readPositiveIntEnv("LEAD_INTENT_THRESHOLD", 60);
  const candidates = await listProjectsDueForScraping(maxProjects);
  const now = Date.now();

  // Resolve each owner's billing plan and filter by scrape interval
  const targets = (
    await Promise.all(
      candidates.map(async (target) => {
        const plan = await getBillingPlanForUser(target.project.owner_id);
        const intervalMs = plan.scrapeIntervalHours * 60 * 60 * 1000;
        const lastScraped = target.project.last_scraped_at
          ? new Date(target.project.last_scraped_at).getTime()
          : 0;
        return now - lastScraped >= intervalMs ? { ...target, plan } : null;
      }),
    )
  ).filter((t): t is NonNullable<typeof t> => t !== null);

  const results = [];

  for (const target of targets) {
    const scrapeRun = await createProjectScrapeRun({
      projectId: target.project.id,
      runId,
      subredditsCount: 0,
      metadata: {
        max_projects: maxProjects,
        max_posts_per_keyword: maxPosts,
        lead_intent_threshold: leadIntentThreshold,
      },
    });

    if (target.keywords.length === 0) {
      await skipProjectScrapeRun({
        projectId: target.project.id,
        scrapeRunId: scrapeRun.id,
        reason: "No active keywords configured",
      });
      results.push({ projectId: target.project.id, status: "skipped", postsSeen: 0 });
      continue;
    }

    try {
      let postsSeen = 0;
      let leadsCreated = 0;
      let duplicatesSkipped = 0;
      let classificationsCount = 0;
      let classifierInputTokens = 0;
      let classifierOutputTokens = 0;
      let classifierModel: string | null = null;
      const seenPostIds = new Set<string>();

      const queries = target.keywords.map((k) => k.term);
      const posts = provider.searchPostsBatch
        ? await provider.searchPostsBatch({
            queries,
            sort: "new",
            time: target.plan.keywordSearchTimeWindow,
            limitPerQuery: maxPosts,
          })
        : await Promise.all(
            target.keywords.map((k) =>
              provider.searchPosts!({
                query: k.term,
                sort: "new",
                time: target.plan.keywordSearchTimeWindow,
                limit: maxPosts,
              }),
            ),
          ).then((r) => r.flat());

      for (const post of posts) {
        if (seenPostIds.has(post.id)) continue;
        seenPostIds.add(post.id);
        postsSeen += 1;

        const keywordsMatched =
          findMatchedKeywords(post, target.keywords).length > 0
            ? findMatchedKeywords(post, target.keywords)
            : queries
                .filter(
                  (q) =>
                    post.title.toLowerCase().includes(q.toLowerCase()) ||
                    (post.body ?? "").toLowerCase().includes(q.toLowerCase()),
                )
                .slice(0, 1);

        if (keywordsMatched.length === 0) continue;

        const classification = await classifyLeadCandidate({
          project: target.project,
          post,
          keywordsMatched,
        });

        classificationsCount += 1;
        classifierModel = classification.usage.model;
        classifierInputTokens += classification.usage.inputTokens ?? 0;
        classifierOutputTokens += classification.usage.outputTokens ?? 0;

        if (classification.intentScore < leadIntentThreshold) continue;

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

          if (result.lead && (result.lead.intent_score ?? 0) > 80) {
            await inngest.send({
              name: "leads/high_intent.created",
              data: {
                projectId: target.project.id,
                leadId: result.lead.id,
                intentScore: result.lead.intent_score,
              },
            });
          }
        }
      }

      await logRedditUsageForProject({
        projectId: target.project.id,
        operation: "keyword_search",
        requestsCount: 1,
        metadata: {
          run_id: runId,
          posts_seen: postsSeen,
          leads_created: leadsCreated,
          duplicates_skipped: duplicatesSkipped,
          keywords_count: queries.length,
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
    projectsConsidered: candidates.length,
    projectsScraped: targets.length,
    results,
  };
}

const BACKFILL_TIME_WINDOW = "month" as const;
const BACKFILL_MAX_POSTS = 50;

export async function runProjectBackfill(
  projectId: string,
  options: { provider?: RedditDiscoveryProvider } = {},
) {
  const provider = options.provider ?? createRedditDiscoveryProvider();
  const leadIntentThreshold = readPositiveIntEnv("LEAD_INTENT_THRESHOLD", 60);
  const target = await getProjectForScraping(projectId);

  if (!target) {
    return { projectId, status: "skipped", reason: "Project not found or inactive" };
  }

  if (target.keywords.length === 0) {
    return { projectId, status: "skipped", reason: "No keywords configured" };
  }

  if (!provider.searchPostsBatch && !provider.searchPosts) {
    return { projectId, status: "skipped", reason: "Provider does not support keyword search" };
  }

  const runId = crypto.randomUUID();
  const scrapeRun = await createProjectScrapeRun({
    projectId,
    runId,
    subredditsCount: 0,
    metadata: { backfill: true, time_window: BACKFILL_TIME_WINDOW },
  });

  try {
    let postsSeen = 0;
    let leadsCreated = 0;
    let duplicatesSkipped = 0;
    let requestsCount = 0;
    let classificationsCount = 0;
    let classifierInputTokens = 0;
    let classifierOutputTokens = 0;
    let classifierModel: string | null = null;
    const seenPostIds = new Set<string>();

    const queries = target.keywords.map((k) => k.term);
    const allPosts = provider.searchPostsBatch
      ? await provider.searchPostsBatch({
          queries,
          sort: "new",
          time: BACKFILL_TIME_WINDOW,
          limitPerQuery: BACKFILL_MAX_POSTS,
        })
      : await Promise.all(
          target.keywords.map((k) =>
            provider.searchPosts!({
              query: k.term,
              sort: "new",
              time: BACKFILL_TIME_WINDOW,
              limit: BACKFILL_MAX_POSTS,
            }),
          ),
        ).then((results) => results.flat());

    requestsCount += 1;

    for (const post of allPosts) {
        if (seenPostIds.has(post.id)) continue;
        seenPostIds.add(post.id);
        postsSeen += 1;

        const keywordsMatched =
          findMatchedKeywords(post, target.keywords).length > 0
            ? findMatchedKeywords(post, target.keywords)
            : queries
                .filter(
                  (q) =>
                    post.title.toLowerCase().includes(q.toLowerCase()) ||
                    (post.body ?? "").toLowerCase().includes(q.toLowerCase()),
                )
                .slice(0, 1);

        const classification = await classifyLeadCandidate({
          project: target.project,
          post,
          keywordsMatched,
        });

        classificationsCount += 1;
        classifierModel = classification.usage.model;
        classifierInputTokens += classification.usage.inputTokens ?? 0;
        classifierOutputTokens += classification.usage.outputTokens ?? 0;

        if (classification.intentScore < leadIntentThreshold) continue;

        const result = await createLeadForProjectWorker({
          projectId,
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

          if (result.lead && (result.lead.intent_score ?? 0) > 80) {
            await inngest.send({
              name: "leads/high_intent.created",
              data: {
                projectId,
                leadId: result.lead.id,
                intentScore: result.lead.intent_score,
              },
            });
          }
        }
      }

    if (classificationsCount > 0) {
      try {
        await logOpenAIUsageForProject({
          projectId,
          operation: "backfill_classify_reddit_lead_candidates",
          model: classifierModel,
          inputTokens: classifierInputTokens,
          outputTokens: classifierOutputTokens,
          requestsCount: classificationsCount,
          metadata: { run_id: runId, posts_seen: postsSeen, leads_created: leadsCreated },
        });
      } catch (usageLogError) {
        console.error("Failed to log backfill classification usage", usageLogError);
      }
    }

    await logRedditUsageForProject({
      projectId,
      operation: "backfill_keyword_search",
      requestsCount,
      metadata: { run_id: runId, posts_seen: postsSeen, leads_created: leadsCreated },
    });

    await completeProjectScrapeRun({
      projectId,
      scrapeRunId: scrapeRun.id,
      postsSeen,
      leadsCreated,
      duplicatesSkipped,
    });

    return { projectId, status: "completed", postsSeen, leadsCreated, duplicatesSkipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backfill error";
    await failProjectScrapeRun({
      projectId,
      scrapeRunId: scrapeRun.id,
      currentFailCount: target.project.scrape_fail_count,
      errorMessage: message,
    });
    return { projectId, status: "failed", reason: message };
  }
}

function readPositiveIntEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  const value = rawValue ? Number.parseInt(rawValue, 10) : fallback;

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return value;
}

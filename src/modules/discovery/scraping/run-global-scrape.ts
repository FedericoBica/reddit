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
import { findMatchedKeywords, type KeywordMatchTarget } from "@/modules/discovery/classification/keyword-match";
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
  const leadIntentThreshold = readPositiveIntEnv("LEAD_INTENT_THRESHOLD", 50);
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

      const keywordTargets: KeywordMatchTarget[] = target.keywords.map((k) => ({
        term: k.term,
        weight: k.intentCategory === "comparative" ? "high" : "normal",
      }));
      // Competitor keywords are searched exclusively by the Mentions pipeline — exclude them here.
      const queries = target.keywords.filter((k) => k.type !== "competitor").map((k) => k.term);
      if (queries.length === 0) {
        await skipProjectScrapeRun({
          projectId: target.project.id,
          scrapeRunId: scrapeRun.id,
          reason: "No non-competitor keywords configured",
        });
        results.push({ projectId: target.project.id, status: "skipped", postsSeen: 0 });
        continue;
      }
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

        const matched = findMatchedKeywords(post, keywordTargets);
        const keywordsMatched: KeywordMatchTarget[] =
          matched.length > 0
            ? matched
            : keywordTargets
                .filter(
                  (k) =>
                    post.title.toLowerCase().includes(k.term.toLowerCase()) ||
                    (post.body ?? "").toLowerCase().includes(k.term.toLowerCase()),
                )
                .slice(0, 1);

        // Apify already found this post via our search terms — let the classifier
        // decide relevance. Fall back to all search keywords as context.
        const effectiveKeywords = keywordsMatched.length > 0 ? keywordsMatched : keywordTargets;

        const classification = await classifyLeadCandidate({
          project: target.project,
          post,
          keywordsMatched: effectiveKeywords,
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
          intentType: classification.intentType,
          regionScore: classification.regionScore,
          sentiment: classification.sentiment,
          classificationReason: classification.classificationReason,
          classifierPromptVersion: classification.promptVersion,
          keywordsMatched: effectiveKeywords.map((k) => k.term),
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

const BACKFILL_MAX_POSTS = 100;

export type BackfillFetchResult =
  | { status: "skipped"; reason: string }
  | {
      status: "fetched";
      projectId: string;
      scrapeRunId: string;
      runId: string;
      posts: import("@/modules/discovery/reddit/types").RedditPost[];
      keywords: import("@/db/queries/scraping").ScrapeTarget["keywords"];
      project: import("@/db/queries/scraping").ScrapeTarget["project"];
      scrapeFailCount: number;
    };

export async function fetchBackfillPosts(
  projectId: string,
  options: { provider?: RedditDiscoveryProvider } = {},
): Promise<BackfillFetchResult> {
  const provider = options.provider ?? createRedditDiscoveryProvider();
  const target = await getProjectForScraping(projectId);

  if (!target) return { status: "skipped", reason: "Project not found or inactive" };
  // Competitor keywords are searched exclusively by the Mentions pipeline — exclude them here.
  const queries = target.keywords.filter((k) => k.type !== "competitor").map((k) => k.term);
  if (queries.length === 0) return { status: "skipped", reason: "No keywords configured" };
  if (!provider.searchPostsBatch && !provider.searchPosts) {
    return { status: "skipped", reason: "Provider does not support keyword search" };
  }

  const runId = crypto.randomUUID();
  const scrapeRun = await createProjectScrapeRun({
    projectId,
    runId,
    subredditsCount: 0,
    metadata: { backfill: true, time_window: "all" },
  });
  // Cap per-query so total requested posts stay ≤ BACKFILL_MAX_POSTS regardless of keyword count.
  // Apify counts maxPostsCount per search term, not total.
  const limitPerQuery = Math.max(1, Math.floor(BACKFILL_MAX_POSTS / queries.length));
  const allPosts = provider.searchPostsBatch
    ? await provider.searchPostsBatch({
        queries,
        sort: "relevance",
        time: "month",
        limitPerQuery,
      })
    : await Promise.all(
        target.keywords.map((k) =>
          provider.searchPosts!({
            query: k.term,
            sort: "relevance",
            time: "month",
            limit: limitPerQuery,
          }),
        ),
      ).then((results) => results.flat());

  const seen = new Set<string>();
  const posts = allPosts
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, BACKFILL_MAX_POSTS);

  return {
    status: "fetched",
    projectId,
    scrapeRunId: scrapeRun.id,
    runId,
    posts,
    keywords: target.keywords,
    project: target.project,
    scrapeFailCount: target.project.scrape_fail_count,
  };
}

export async function classifyAndSaveBackfillPosts(
  input: Extract<BackfillFetchResult, { status: "fetched" }>,
): Promise<{ projectId: string; status: string; postsSeen: number; leadsCreated: number; duplicatesSkipped: number }> {
  const { projectId, scrapeRunId, runId, posts, keywords, project, scrapeFailCount } = input;
  const leadIntentThreshold = readPositiveIntEnv("LEAD_INTENT_THRESHOLD", 50);
  const keywordTargets: KeywordMatchTarget[] = keywords.map((k) => ({
    term: k.term,
    weight: k.intentCategory === "comparative" ? "high" : "normal",
  }));

  let leadsCreated = 0;
  let duplicatesSkipped = 0;
  let classificationsCount = 0;
  let classifierInputTokens = 0;
  let classifierOutputTokens = 0;
  let classifierModel: string | null = null;

  try {
    const CONCURRENCY = 10;
    for (let i = 0; i < posts.length; i += CONCURRENCY) {
      const batch = posts.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (post) => {
          const matched = findMatchedKeywords(post, keywordTargets);
          const keywordsMatched: KeywordMatchTarget[] =
            matched.length > 0
              ? matched
              : keywordTargets
                  .filter(
                    (k) =>
                      post.title.toLowerCase().includes(k.term.toLowerCase()) ||
                      (post.body ?? "").toLowerCase().includes(k.term.toLowerCase()),
                  )
                  .slice(0, 1);

          const classification = await classifyLeadCandidate({ project, post, keywordsMatched });

          classificationsCount += 1;
          classifierModel = classification.usage.model;
          classifierInputTokens += classification.usage.inputTokens ?? 0;
          classifierOutputTokens += classification.usage.outputTokens ?? 0;

          if (classification.intentScore < leadIntentThreshold) return;

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
            keywordsMatched: keywordsMatched.map((k) => k.term),
            rawData: post.rawData,
          });

          if (result.duplicate) {
            duplicatesSkipped += 1;
          } else {
            leadsCreated += 1;
            if (result.lead && (result.lead.intent_score ?? 0) > 80) {
              await inngest.send({
                name: "leads/high_intent.created",
                data: { projectId, leadId: result.lead.id, intentScore: result.lead.intent_score },
              });
            }
          }
        }),
      );
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
          metadata: { run_id: runId, posts_seen: posts.length, leads_created: leadsCreated },
        });
      } catch {
        // non-critical
      }
    }

    await logRedditUsageForProject({
      projectId,
      operation: "backfill_keyword_search",
      requestsCount: 1,
      metadata: { run_id: runId, posts_seen: posts.length, leads_created: leadsCreated },
    });

    await completeProjectScrapeRun({
      projectId,
      scrapeRunId,
      postsSeen: posts.length,
      leadsCreated,
      duplicatesSkipped,
    });

    return { projectId, status: "completed", postsSeen: posts.length, leadsCreated, duplicatesSkipped };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backfill error";
    await failProjectScrapeRun({
      projectId,
      scrapeRunId,
      currentFailCount: scrapeFailCount,
      errorMessage: message,
    });
    return { projectId, status: "failed", postsSeen: posts.length, leadsCreated, duplicatesSkipped };
  }
}

export async function runProjectBackfill(
  projectId: string,
  options: { provider?: RedditDiscoveryProvider } = {},
) {
  const fetchResult = await fetchBackfillPosts(projectId, options);
  if (fetchResult.status === "skipped") return { projectId, ...fetchResult };
  return classifyAndSaveBackfillPosts(fetchResult);
}

function readPositiveIntEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  const value = rawValue ? Number.parseInt(rawValue, 10) : fallback;

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return value;
}

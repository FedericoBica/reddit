import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { searchRecentTweets } from "@/modules/x/x-search";
import { classifyXPostCandidate } from "@/modules/x/x-classifier";
import { upsertXPost } from "@/db/mutations/x";
import { getBillingPlanForUser } from "@/modules/billing/current";
import type { Json } from "@/db/schemas/database.types";

const X_INTENT_THRESHOLD = 25;

type ProjectRow = {
  id: string;
  name: string;
  website_url: string;
  value_proposition: string;
  region: string;
  primary_language: string;
  owner_id: string;
};

export const scrapeXPosts = inngest.createFunction(
  {
    id: "scrape-x-posts",
    name: "Scrape X posts by keyword",
    retries: 1,
    timeouts: { finish: "15m" },
    triggers: [{ cron: "0 * * * *" }],
  },
  async ({ step }) => {
    const supabase = createSupabaseAdminClient();

    const keywords = await step.run("load-keywords", async () => {
      const { data, error } = await supabase
        .from("x_keywords")
        .select("id, project_id, query, projects!inner(id, name, website_url, value_proposition, region, primary_language, owner_id, status)")
        .eq("is_active", true)
        .eq("projects.status", "active");

      if (error) throw new Error(`Failed to load X keywords: ${error.message}`);
      return data ?? [];
    });

    if (keywords.length === 0) return { processed: 0, skipped: 0 };

    // Search tweets from the last 65 min (slightly more than the cron interval)
    const startTime = new Date(Date.now() - 65 * 60 * 1000).toISOString();

    let processed = 0;
    let skipped = 0;

    for (const kw of keywords) {
      const project = kw.projects as unknown as ProjectRow;

      const result = await step.run(`process-keyword-${kw.id}`, async () => {
        let tweets;
        try {
          tweets = await searchRecentTweets(kw.query, {
            startTime,
            maxResults: 10,
            lang: project.primary_language,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          // Rate limits are app-level and unretriable — skip this keyword gracefully.
          // All other errors (5xx, auth) are thrown so Inngest marks the step as failed.
          if (msg.includes("rate limit")) {
            console.warn(`[x-scrape] rate limited on keyword ${kw.id} ("${kw.query}")`);
            return { saved: 0, skipped: 0 };
          }
          throw err;
        }

        if (tweets.length === 0) return { saved: 0, skipped: 0 };

        // Compute remaining daily allowance to avoid exceeding the cap inside the loop
        const plan = await getBillingPlanForUser(project.owner_id);
        if (!plan) return { saved: 0, skipped: tweets.length };
        let remaining = Infinity;
        if (plan.maxXPostsPerDay) {
          const startOfDay = new Date();
          startOfDay.setUTCHours(0, 0, 0, 0);
          const { count } = await supabase
            .from("x_posts")
            .select("id", { count: "exact", head: true })
            .eq("project_id", kw.project_id)
            .gte("created_at", startOfDay.toISOString());
          remaining = Math.max(0, plan.maxXPostsPerDay - (count ?? 0));
          if (remaining === 0) return { saved: 0, skipped: tweets.length };
        }

        const tweetsToProcess = tweets.slice(0, remaining);

        let saved = 0;
        let kwSkipped = 0;

        for (const tweet of tweetsToProcess) {
          // Check dedup
          const { data: existing } = await supabase
            .from("x_posts")
            .select("id")
            .eq("project_id", kw.project_id)
            .eq("x_post_id", tweet.id)
            .maybeSingle();

          if (existing) { kwSkipped++; continue; }

          const classification = await classifyXPostCandidate({
            project: {
              name: project.name,
              website_url: project.website_url,
              value_proposition: project.value_proposition,
              region: project.region,
              primary_language: project.primary_language,
            },
            post: {
              text: tweet.text,
              authorUsername: tweet.authorUsername,
              authorName: tweet.authorName,
              lang: tweet.lang,
              likeCount: tweet.metrics.likeCount,
              retweetCount: tweet.metrics.retweetCount,
              replyCount: tweet.metrics.replyCount,
              authorVerified: tweet.authorVerified,
            },
            matchedQueries: [kw.query],
          });

          const permalink = tweet.authorUsername
            ? `https://x.com/${tweet.authorUsername}/status/${tweet.id}`
            : `https://x.com/i/web/status/${tweet.id}`;

          await upsertXPost({
            projectId: kw.project_id,
            xPostId: tweet.id,
            text: tweet.text,
            permalink,
            lang: tweet.lang,
            postedAt: tweet.createdAt,
            authorId: tweet.authorId,
            authorUsername: tweet.authorUsername,
            authorName: tweet.authorName,
            authorVerified: tweet.authorVerified,
            authorFollowersCount: tweet.authorFollowersCount,
            likeCount: tweet.metrics.likeCount,
            retweetCount: tweet.metrics.retweetCount,
            replyCount: tweet.metrics.replyCount,
            quoteCount: tweet.metrics.quoteCount,
            bookmarkCount: tweet.metrics.bookmarkCount,
            impressionCount: tweet.metrics.impressionCount,
            intentScore: classification.intentScore,
            intentType: classification.intentType,
            sentiment: classification.sentiment,
            classificationReason: classification.classificationReason,
            classifierPromptVersion: classification.promptVersion,
            keywordsMatched: [kw.query],
            status: classification.intentScore < X_INTENT_THRESHOLD ? "irrelevant" : "new",
            rawData: tweet as unknown as Json,
          });

          saved++;
        }

        return { saved, skipped: kwSkipped };
      });

      processed += result.saved;
      skipped += result.skipped;
    }

    return { processed, skipped };
  },
);

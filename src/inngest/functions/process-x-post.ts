import { inngest } from "@/inngest/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { upsertXPost } from "@/db/mutations/x";
import type { Json } from "@/db/schemas/database.types";
import { classifyXPostCandidate } from "@/modules/x/x-classifier";

type XPostEvent = {
  data: {
    projectId: string;
    keywordId: string;
    post: {
      id: string;
      text: string;
      authorId: string | null;
      authorUsername: string | null;
      authorName: string | null;
      authorVerified: boolean | null;
      authorFollowersCount: number | null;
      lang: string | null;
      createdAt: string | null;
      metrics: {
        likeCount: number;
        retweetCount: number;
        replyCount: number;
        quoteCount: number;
        bookmarkCount: number | null;
        impressionCount: number | null;
      };
      raw: unknown;
    };
  };
};

const X_INTENT_THRESHOLD = readPositiveIntEnv("X_INTENT_THRESHOLD", 25);

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const processXPost = inngest.createFunction(
  {
    id: "process-x-post",
    name: "Process X post",
    retries: 1,
    concurrency: 10,
    triggers: [{ event: "x/post.received" }],
  },
  async ({ event, step }) => {
    const payload = ((event as unknown) as XPostEvent).data;
    const supabase = createSupabaseAdminClient();

    // Dedup check — X webhooks are at-least-once; skip AI if already processed
    const existingPost = await step.run("check existing", async () =>
      supabase
        .from("x_posts")
        .select("id, status")
        .eq("project_id", payload.projectId)
        .eq("x_post_id", payload.post.id)
        .maybeSingle(),
    );

    if (existingPost.data) {
      return { saved: false, duplicate: true };
    }

    const [projectResult, keywordResult] = await Promise.all([
      step.run("load project", async () =>
        supabase
          .from("projects")
          .select("id, name, website_url, value_proposition, region, primary_language, status")
          .eq("id", payload.projectId)
          .eq("status", "active")
          .maybeSingle(),
      ),
      step.run("load x keyword", async () =>
        supabase
          .from("x_keywords")
          .select("id, query, is_active")
          .eq("project_id", payload.projectId)
          .eq("id", payload.keywordId)
          .eq("is_active", true)
          .maybeSingle(),
      ),
    ]);

    const project = projectResult.data;
    const keyword = keywordResult.data;

    if (!project || !keyword) {
      return { saved: false, skipped: true };
    }

    const classification = await step.run("classify x post", async () =>
      classifyXPostCandidate({
        project: {
          name: project.name,
          website_url: project.website_url,
          value_proposition: project.value_proposition,
          region: project.region,
          primary_language: project.primary_language,
        },
        post: {
          text: payload.post.text,
          authorUsername: payload.post.authorUsername,
          authorName: payload.post.authorName,
          lang: payload.post.lang,
          likeCount: payload.post.metrics.likeCount,
          retweetCount: payload.post.metrics.retweetCount,
          replyCount: payload.post.metrics.replyCount,
          authorVerified: payload.post.authorVerified,
        },
        matchedQueries: [keyword.query],
      }),
    );

    const permalink = payload.post.authorUsername
      ? `https://x.com/${payload.post.authorUsername}/status/${payload.post.id}`
      : `https://x.com/i/web/status/${payload.post.id}`;

    const belowThreshold = classification.intentScore < X_INTENT_THRESHOLD;

    await step.run("save x post", async () =>
      upsertXPost({
        projectId: payload.projectId,
        xPostId: payload.post.id,
        text: payload.post.text,
        permalink,
        lang: payload.post.lang,
        postedAt: payload.post.createdAt,
        authorId: payload.post.authorId,
        authorUsername: payload.post.authorUsername,
        authorName: payload.post.authorName,
        authorVerified: payload.post.authorVerified,
        authorFollowersCount: payload.post.authorFollowersCount,
        likeCount: payload.post.metrics.likeCount,
        retweetCount: payload.post.metrics.retweetCount,
        replyCount: payload.post.metrics.replyCount,
        quoteCount: payload.post.metrics.quoteCount,
        bookmarkCount: payload.post.metrics.bookmarkCount,
        impressionCount: payload.post.metrics.impressionCount,
        intentScore: classification.intentScore,
        intentType: classification.intentType,
        sentiment: classification.sentiment,
        classificationReason: classification.classificationReason,
        classifierPromptVersion: classification.promptVersion,
        keywordsMatched: [keyword.query],
        status: belowThreshold ? "irrelevant" : "new",
        rawData: payload.post.raw as Json,
      }),
    );

    return { saved: !belowThreshold, belowThreshold };
  },
);

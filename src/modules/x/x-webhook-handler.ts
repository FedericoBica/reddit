import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { inngest } from "@/inngest/client";
import { parseXRuleTag } from "./x-stream-rules";
import { requireEnv } from "@/lib/env";

const xWebhookPayloadSchema = z.object({
  data: z.object({
    id: z.string(),
    text: z.string(),
    author_id: z.string().optional(),
    lang: z.string().optional(),
    created_at: z.string().optional(),
    public_metrics: z.object({
      like_count: z.number().optional(),
      retweet_count: z.number().optional(),
      reply_count: z.number().optional(),
      quote_count: z.number().optional(),
      bookmark_count: z.number().optional(),
      impression_count: z.number().optional(),
    }).optional(),
  }),
  includes: z.object({
    users: z.array(z.object({
      id: z.string(),
      username: z.string().optional(),
      name: z.string().optional(),
      verified: z.boolean().optional(),
      public_metrics: z.object({
        followers_count: z.number().optional(),
      }).optional(),
    })).optional(),
  }).optional(),
  matching_rules: z.array(z.object({
    id: z.string().optional(),
    tag: z.string().optional(),
  })).default([]),
});

export function buildXCrcResponseToken(crcToken: string) {
  const consumerSecret = requireEnv("X_CONSUMER_SECRET");
  const digest = createHmac("sha256", consumerSecret).update(crcToken).digest("base64");
  return `sha256=${digest}`;
}

function getProvidedSignature(headers: Headers) {
  return headers.get("x-twitter-webhooks-signature") ?? headers.get("x-x-webhook-signature");
}

export function verifyXWebhookSignature(rawBody: string, headers: Headers): boolean {
  const secret = requireEnv("X_WEBHOOK_SECRET");
  const provided = getProvidedSignature(headers);

  if (!provided) return false;

  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("base64")}`;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function processXWebhook(rawBody: string) {
  const payload = xWebhookPayloadSchema.parse(JSON.parse(rawBody));
  const author = payload.includes?.users?.find((user) => user.id === payload.data.author_id) ?? null;

  const matchingTargets = payload.matching_rules
    .map((rule) => parseXRuleTag(rule.tag))
    .filter((value): value is { projectId: string; keywordId: string } => Boolean(value));

  if (matchingTargets.length === 0) {
    return { delivered: 0 };
  }

  await Promise.all(
    matchingTargets.map(({ projectId, keywordId }) =>
      inngest.send({
        name: "x/post.received",
        data: {
          projectId,
          keywordId,
          post: {
            id: payload.data.id,
            text: payload.data.text,
            authorId: payload.data.author_id ?? null,
            authorUsername: author?.username ?? null,
            authorName: author?.name ?? null,
            authorVerified: author?.verified ?? null,
            authorFollowersCount: author?.public_metrics?.followers_count ?? null,
            lang: payload.data.lang ?? null,
            createdAt: payload.data.created_at ?? null,
            metrics: {
              likeCount: payload.data.public_metrics?.like_count ?? 0,
              retweetCount: payload.data.public_metrics?.retweet_count ?? 0,
              replyCount: payload.data.public_metrics?.reply_count ?? 0,
              quoteCount: payload.data.public_metrics?.quote_count ?? 0,
              bookmarkCount: payload.data.public_metrics?.bookmark_count ?? null,
              impressionCount: payload.data.public_metrics?.impression_count ?? null,
            },
            raw: payload,
          },
        },
      }),
    ),
  );

  return { delivered: matchingTargets.length };
}

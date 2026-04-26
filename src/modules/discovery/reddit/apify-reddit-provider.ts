import "server-only";

import { requireEnv } from "@/lib/env";
import type { Json } from "@/db/schemas/database.types";
import type {
  RedditBatchSearchInput,
  RedditDiscoveryProvider,
  RedditPost,
  RedditSearchInput,
} from "./types";
import { normalizeSubredditName } from "./common";

type ApifyRedditItem = {
  id?: string;
  postId?: string;
  parsedId?: string;
  name?: string;
  title?: string;
  text?: string;
  body?: string;
  selftext?: string;
  communityName?: string;
  parsedCommunityName?: string;
  subredditName?: string;
  subreddit?: string;
  author?: string;
  userName?: string;
  authorName?: string;
  url?: string;
  contentUrl?: string;
  postUrl?: string;
  permalink?: string;
  createdAt?: string;
  createdUtc?: string;
  created_utc?: number;
  upVotes?: number;
  upvotes?: number;
  score?: number;
  numberOfComments?: number;
  commentsCount?: number;
  numComments?: number;
  num_comments?: number;
  dataType?: string;
  type?: string;
  searchTerm?: string;
  posts?: unknown;
  post?: unknown;
  data?: unknown;
};

export class ApifyRedditProvider implements RedditDiscoveryProvider {
  async fetchNewPosts(input: { subreddit: string; limit: number }): Promise<RedditPost[]> {
    const subreddit = normalizeSubredditName(input.subreddit);
    const maxPostsCount = Math.min(Math.max(input.limit, 1), 100);

    const items = await this.runActor({
      startUrls: [{ url: `https://www.reddit.com/r/${subreddit}/new/` }],
      maxPostsCount,
      crawlCommentsPerPost: false,
      maxCommentsPerPost: 0,
    });

    const posts = items.flatMap((item) => mapApifyItem(item, subreddit)).slice(0, maxPostsCount);
    warnIfItemsUnmapped({
      context: `subreddit:new:${subreddit}`,
      items,
      mappedPosts: posts.length,
    });
    return posts;
  }

  async searchPosts(input: RedditSearchInput): Promise<RedditPost[]> {
    return this.searchPostsBatch({
      queries: [input.query],
      sort: input.sort,
      time: input.time,
      subreddit: input.subreddit,
      limitPerQuery: input.limit,
    });
  }

  async searchPostsBatch(input: RedditBatchSearchInput): Promise<RedditPost[]> {
    const maxPostsCount = Math.min(Math.max(input.limitPerQuery, 1), 100);

    const body: Record<string, unknown> = {
      searchTerms: input.queries,
      searchPosts: true,
      searchComments: false,
      searchCommunities: false,
      searchSort: input.sort ?? "new",
      searchTime: input.time ?? "week",
      maxPostsCount,
      includeNSFW: false,
    };

    if (input.subreddit) {
      body.withinCommunity = `r/${normalizeSubredditName(input.subreddit)}`;
    }

    const items = await this.runActor(body);
    const posts = items.flatMap((item) => mapApifyItem(item, ""));
    warnIfItemsUnmapped({
      context: `search:${input.queries.join(", ")}`,
      items,
      mappedPosts: posts.length,
    });
    return posts;
  }

  private async runActor(body: Record<string, unknown>): Promise<ApifyRedditItem[]> {
    const actorId = process.env.APIFY_REDDIT_ACTOR_ID ?? "harshmaur/reddit-scraper";
    const token = requireEnv("APIFY_API_TOKEN");
    // Apify's synchronous endpoint waits for the run and returns dataset items directly.
    // The API supports up to 300s for this request.
    const waitSecs = Math.min(readPositiveIntEnv("APIFY_REDDIT_TIMEOUT_SECS", 300), 300);
    const syncUrl = new URL(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`);
    syncUrl.searchParams.set("token", token);
    syncUrl.searchParams.set("timeout", String(waitSecs));
    syncUrl.searchParams.set("format", "json");

    const response = await fetch(syncUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Apify sync run failed: ${response.status}`);
    }
    return response.json() as Promise<ApifyRedditItem[]>;
  }
}

function mapApifyItem(item: ApifyRedditItem, fallbackSubreddit: string): RedditPost[] {
  const nestedItems = extractNestedPostItems(item);
  if (nestedItems.length > 0) {
    return nestedItems.flatMap((nested) => mapApifyItem(nested, fallbackSubreddit));
  }

  if (!isPostItem(item)) {
    return [];
  }

  const title = item.title?.trim();
  const id = normalizePostId(
    item.parsedId ?? item.postId ?? item.id ?? item.name ?? item.postUrl ?? item.url,
  );

  if (!title || !id) {
    return [];
  }

  const permalink = normalizePermalink(item.postUrl ?? item.permalink ?? item.url);
  const subreddit = normalizeSubredditName(
    item.parsedCommunityName ??
      item.communityName ??
      item.subredditName ??
      item.subreddit ??
      fallbackSubreddit,
  );

  return [
    {
      id,
      fullname: item.name?.startsWith("t3_") ? item.name : `t3_${id}`,
      title,
      body: item.text ?? item.body ?? item.selftext ?? null,
      subreddit,
      author: item.author ?? item.userName ?? item.authorName ?? null,
      permalink,
      url: item.contentUrl ?? item.url ?? item.postUrl ?? permalink,
      createdUtc: normalizeCreatedAt(item),
      score: item.upVotes ?? item.upvotes ?? item.score ?? null,
      numComments:
        item.numberOfComments ??
        item.commentsCount ??
        item.numComments ??
        item.num_comments ??
        null,
      rawData: item as unknown as Json,
    },
  ];
}

export function mapApifyItemsForTesting(items: unknown[], fallbackSubreddit = ""): RedditPost[] {
  return items.flatMap((item) => mapApifyItem(item as ApifyRedditItem, fallbackSubreddit));
}

function isPostItem(item: ApifyRedditItem) {
  const type = (item.dataType ?? item.type ?? "").toLocaleLowerCase();
  return !type || type.includes("post") || type.includes("thread");
}

function extractNestedPostItems(item: ApifyRedditItem): ApifyRedditItem[] {
  const nested: ApifyRedditItem[] = [];

  collectNestedPostItems(item.posts, nested);
  collectNestedPostItems(item.post, nested);

  if (item.data && typeof item.data === "object") {
    for (const value of Object.values(item.data as Record<string, unknown>)) {
      collectNestedPostItems(value, nested);
    }
  }

  return nested;
}

function collectNestedPostItems(value: unknown, output: ApifyRedditItem[], depth = 0) {
  if (!value || depth > 4) return;

  if (Array.isArray(value)) {
    for (const entry of value) {
      collectNestedPostItems(entry, output, depth + 1);
    }
    return;
  }

  if (typeof value !== "object") return;

  const record = value as Record<string, unknown>;

  if (looksLikePostRecord(record)) {
    output.push(record as ApifyRedditItem);
    return;
  }

  if ("posts" in record) collectNestedPostItems(record.posts, output, depth + 1);
  if ("post" in record) collectNestedPostItems(record.post, output, depth + 1);
  if ("data" in record) collectNestedPostItems(record.data, output, depth + 1);
}

function looksLikePostRecord(record: Record<string, unknown>) {
  return typeof record.title === "string"
    && (
      typeof record.id === "string"
      || typeof record.postId === "string"
      || typeof record.parsedId === "string"
      || typeof record.name === "string"
      || typeof record.postUrl === "string"
      || typeof record.permalink === "string"
      || typeof record.url === "string"
    );
}

function normalizePostId(value?: string) {
  if (!value) return null;

  const text = value.trim();
  const commentsMatch = /\/comments\/([^/?#]+)/i.exec(text);
  if (commentsMatch?.[1]) return commentsMatch[1];

  return text.replace(/^t3_/i, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 128) || null;
}

function normalizePermalink(value?: string) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  return `https://www.reddit.com${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeCreatedAt(item: ApifyRedditItem) {
  if (item.createdAt) return new Date(item.createdAt).toISOString();
  if (item.createdUtc) return new Date(item.createdUtc).toISOString();
  if (item.created_utc) return new Date(item.created_utc * 1_000).toISOString();
  return null;
}

function readPositiveIntEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  const value = rawValue ? Number.parseInt(rawValue, 10) : fallback;
  return !Number.isFinite(value) || value < 1 ? fallback : value;
}

function warnIfItemsUnmapped(input: {
  context: string;
  items: ApifyRedditItem[];
  mappedPosts: number;
}) {
  if (input.mappedPosts > 0 || input.items.length === 0) return;

  const sample = input.items.slice(0, 2).map((item) => ({
    type: item.type ?? item.dataType ?? null,
    keys: Object.keys(item).slice(0, 20),
  }));

  console.warn(`[apify] Received ${input.items.length} items for ${input.context}, but mapped 0 posts. Sample:`, sample);
}

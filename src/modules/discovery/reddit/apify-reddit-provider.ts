import "server-only";

import { requireEnv } from "@/lib/env";
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

    return items.flatMap((item) => mapApifyItem(item, subreddit)).slice(0, maxPostsCount);
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
    return items.flatMap((item) => mapApifyItem(item, ""));
  }

  private async runActor(body: Record<string, unknown>): Promise<ApifyRedditItem[]> {
    const actorId = process.env.APIFY_REDDIT_ACTOR_ID ?? "harshmaur/reddit-scraper";
    const token = requireEnv("APIFY_API_TOKEN");
    // How long to wait for the actor to finish before returning whatever it has collected.
    // Default 300s (5 min). Set APIFY_REDDIT_TIMEOUT_SECS higher if the actor is slow.
    const waitSecs = readPositiveIntEnv("APIFY_REDDIT_TIMEOUT_SECS", 300);

    // Start the actor run (non-blocking — returns immediately with a run ID).
    const startUrl = new URL(`https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/runs`);
    startUrl.searchParams.set("token", token);

    const startResp = await fetch(startUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!startResp.ok) {
      throw new Error(`Apify run start failed: ${startResp.status}`);
    }
    const { data: run } = await startResp.json() as { data: { id: string } };

    // Fetch dataset items, blocking until the actor finishes or waitSecs elapses.
    // If the actor is still running at that point, Apify returns whatever it has collected so far.
    const itemsUrl = new URL(`https://api.apify.com/v2/actor-runs/${run.id}/dataset/items`);
    itemsUrl.searchParams.set("token", token);
    itemsUrl.searchParams.set("waitForFinish", String(waitSecs));

    const itemsResp = await fetch(itemsUrl);
    if (!itemsResp.ok) {
      throw new Error(`Apify dataset fetch failed: ${itemsResp.status}`);
    }
    return itemsResp.json() as Promise<ApifyRedditItem[]>;
  }
}

function mapApifyItem(item: ApifyRedditItem, fallbackSubreddit: string): RedditPost[] {
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
      rawData: item,
    },
  ];
}

function isPostItem(item: ApifyRedditItem) {
  const type = (item.dataType ?? item.type ?? "").toLocaleLowerCase();
  return !type || type.includes("post") || type.includes("thread");
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

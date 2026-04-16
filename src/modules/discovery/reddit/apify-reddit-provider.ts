import "server-only";

import { requireEnv } from "@/lib/env";
import type { RedditDiscoveryProvider, RedditPost } from "./types";
import { normalizeSubredditName } from "./common";

type ApifyRedditItem = {
  id?: string;
  postId?: string;
  name?: string;
  title?: string;
  text?: string;
  body?: string;
  selftext?: string;
  communityName?: string;
  parsedCommunityName?: string;
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
};

export class ApifyRedditProvider implements RedditDiscoveryProvider {
  async fetchNewPosts(input: { subreddit: string; limit: number }): Promise<RedditPost[]> {
    const subreddit = normalizeSubredditName(input.subreddit);
    const actorId = process.env.APIFY_REDDIT_ACTOR_ID ?? "harshmaur/reddit-scraper";
    const timeoutSecs = readPositiveIntEnv("APIFY_REDDIT_TIMEOUT_SECS", 90);
    const maxItems = Math.min(Math.max(input.limit, 1), 100);
    const url = new URL(
      `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items`,
    );
    url.searchParams.set("token", requireEnv("APIFY_API_TOKEN"));
    url.searchParams.set("timeout", String(timeoutSecs));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        startUrls: [
          {
            url: `https://www.reddit.com/r/${subreddit}/new/`,
          },
        ],
        maxItems,
        maxPosts: maxItems,
        maxPostCount: maxItems,
        maxPostsCount: maxItems,
        sort: "new",
        searchSort: "new",
        includeComments: false,
        maxComments: 0,
      }),
    });

    if (!response.ok) {
      throw new Error(`Apify Reddit scraper failed for r/${subreddit}: ${response.status}`);
    }

    const items = (await response.json()) as ApifyRedditItem[];
    return items.flatMap((item) => mapApifyItem(item, subreddit)).slice(0, maxItems);
  }
}

function mapApifyItem(item: ApifyRedditItem, fallbackSubreddit: string): RedditPost[] {
  if (!isPostItem(item)) {
    return [];
  }

  const title = item.title?.trim();
  const id = normalizePostId(item.postId ?? item.id ?? item.name ?? item.url ?? item.postUrl);

  if (!title || !id) {
    return [];
  }

  const permalink = normalizePermalink(item.postUrl ?? item.permalink ?? item.url);
  const subreddit = normalizeSubredditName(
    item.parsedCommunityName ?? item.communityName ?? item.subreddit ?? fallbackSubreddit,
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
        item.numberOfComments ?? item.commentsCount ?? item.numComments ?? item.num_comments ?? null,
      rawData: item,
    },
  ];
}

function isPostItem(item: ApifyRedditItem) {
  const type = (item.dataType ?? item.type ?? "").toLocaleLowerCase();
  return !type || type.includes("post") || type.includes("thread");
}

function normalizePostId(value?: string) {
  if (!value) {
    return null;
  }

  const text = value.trim();
  const commentsMatch = /\/comments\/([^/?#]+)/i.exec(text);

  if (commentsMatch?.[1]) {
    return commentsMatch[1];
  }

  return text.replace(/^t3_/i, "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 128) || null;
}

function normalizePermalink(value?: string) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http")) {
    return value;
  }

  return `https://www.reddit.com${value.startsWith("/") ? value : `/${value}`}`;
}

function normalizeCreatedAt(item: ApifyRedditItem) {
  if (item.createdAt) {
    return new Date(item.createdAt).toISOString();
  }

  if (item.createdUtc) {
    return new Date(item.createdUtc).toISOString();
  }

  if (item.created_utc) {
    return new Date(item.created_utc * 1_000).toISOString();
  }

  return null;
}

function readPositiveIntEnv(name: string, fallback: number) {
  const rawValue = process.env[name];
  const value = rawValue ? Number.parseInt(rawValue, 10) : fallback;

  if (!Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return value;
}

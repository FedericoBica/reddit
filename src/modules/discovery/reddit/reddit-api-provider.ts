import "server-only";

import { requireEnv } from "@/lib/env";
import type { RedditBatchSearchInput, RedditComment, RedditDiscoveryProvider, RedditPost, RedditSearchInput } from "./types";
import {
  getRedditUserAgent,
  mapRedditListingResponse,
  normalizeSubredditName,
  type RedditListingResponse,
} from "./common";

type CachedRedditAccessToken = {
  token: string;
  expiresAt: number;
};

let cachedAccessToken: CachedRedditAccessToken | null = null;

export class RedditApiProvider implements RedditDiscoveryProvider {
  async fetchNewPosts(input: { subreddit: string; limit: number }): Promise<RedditPost[]> {
    const accessToken = await this.getAccessToken();
    const subreddit = normalizeSubredditName(input.subreddit);
    const userAgent = getRedditUserAgent();
    const url = new URL(`https://oauth.reddit.com/r/${subreddit}/new`);
    url.searchParams.set("limit", String(input.limit));

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API failed for r/${subreddit}: ${response.status}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return mapRedditListingResponse(payload);
  }

  async searchPosts(input: RedditSearchInput): Promise<RedditPost[]> {
    const accessToken = await this.getAccessToken();
    const userAgent = getRedditUserAgent();
    const url = new URL("https://oauth.reddit.com/search");
    url.searchParams.set("q", input.query);
    url.searchParams.set("sort", input.sort ?? "new");
    url.searchParams.set("limit", String(Math.min(Math.max(input.limit, 1), 100)));
    url.searchParams.set("type", "link");

    if (input.time) {
      url.searchParams.set("t", input.time);
    }

    if (input.subreddit) {
      url.searchParams.set("restrict_sr", "true");
      url.pathname = `/r/${normalizeSubredditName(input.subreddit)}/search`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit API search failed for "${input.query}": ${response.status}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return mapRedditListingResponse(payload);
  }

  async searchComments(input: RedditSearchInput): Promise<RedditComment[]> {
    const accessToken = await this.getAccessToken();
    const userAgent = getRedditUserAgent();
    const url = new URL("https://oauth.reddit.com/search");
    url.searchParams.set("q", input.query);
    url.searchParams.set("sort", input.sort ?? "new");
    url.searchParams.set("limit", String(Math.min(Math.max(input.limit, 1), 100)));
    url.searchParams.set("type", "comment");

    if (input.time) url.searchParams.set("t", input.time);

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, "User-Agent": userAgent },
    });

    if (!response.ok) {
      throw new Error(`Reddit comment search failed for "${input.query}": ${response.status}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return mapCommentListingResponse(payload);
  }

  async searchCommentsBatch(input: RedditBatchSearchInput): Promise<RedditComment[]> {
    const results = await Promise.all(
      input.queries.map((q) =>
        this.searchComments({
          query: q,
          sort: input.sort,
          time: input.time,
          limit: input.limitPerQuery,
        }),
      ),
    );
    return results.flat();
  }

  private async getAccessToken() {
    if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now()) {
      return cachedAccessToken.token;
    }

    const clientId = requireEnv("REDDIT_CLIENT_ID");
    const clientSecret = requireEnv("REDDIT_CLIENT_SECRET");
    const userAgent = getRedditUserAgent();
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent,
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      throw new Error(`Reddit OAuth failed: ${response.status}`);
    }

    const payload = (await response.json()) as { access_token?: string; expires_in?: number };

    if (!payload.access_token) {
      throw new Error("Reddit OAuth response did not include an access token");
    }

    cachedAccessToken = {
      token: payload.access_token,
      expiresAt: Date.now() + Math.max(60, (payload.expires_in ?? 3_600) - 60) * 1_000,
    };

    return payload.access_token;
  }
}

type RawComment = {
  id?: string;
  body?: string;
  author?: string;
  subreddit?: string;
  permalink?: string;
  score?: number;
  created_utc?: number;
  link_id?: string;
  link_title?: string;
  link_permalink?: string;
  link_url?: string;
};

function mapCommentListingResponse(listing: RedditListingResponse): RedditComment[] {
  const children = listing?.data?.children ?? [];
  return children
    .map((child): RedditComment | null => {
      const d = child?.data as RawComment | undefined;
      if (!d?.id || !d?.body || d.body === "[deleted]" || d.body === "[removed]") return null;
      const parentId = d.link_id?.replace(/^t3_/, "") ?? "";
      return {
        id: d.id,
        body: d.body,
        author: d.author && d.author !== "[deleted]" ? d.author : null,
        subreddit: d.subreddit ?? "",
        permalink: d.permalink ? `https://www.reddit.com${d.permalink}` : "",
        score: d.score ?? null,
        createdUtc: d.created_utc ? new Date(d.created_utc * 1_000).toISOString() : null,
        parentPostId: parentId,
        parentPostTitle: d.link_title ?? "",
        parentPostUrl: d.link_permalink
          ? `https://www.reddit.com${d.link_permalink}`
          : (d.link_url ?? ""),
      };
    })
    .filter((c): c is RedditComment => c !== null);
}

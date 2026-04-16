import "server-only";

import { requireEnv } from "@/lib/env";
import type { RedditDiscoveryProvider, RedditPost } from "./types";
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

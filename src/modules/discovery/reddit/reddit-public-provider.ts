import "server-only";

import type { RedditDiscoveryProvider, RedditPost } from "./types";
import {
  getRedditUserAgent,
  mapRedditListingResponse,
  normalizeSubredditName,
  type RedditListingResponse,
} from "./common";

export class RedditPublicProvider implements RedditDiscoveryProvider {
  async fetchNewPosts(input: { subreddit: string; limit: number }): Promise<RedditPost[]> {
    const subreddit = normalizeSubredditName(input.subreddit);
    const url = new URL(`https://www.reddit.com/r/${subreddit}/new.json`);
    url.searchParams.set("limit", String(Math.min(Math.max(input.limit, 1), 100)));
    url.searchParams.set("raw_json", "1");

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "User-Agent": getRedditUserAgent(),
      },
      next: {
        revalidate: 0,
      },
    });

    if (!response.ok) {
      throw new Error(`Reddit public listing failed for r/${subreddit}: ${response.status}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return mapRedditListingResponse(payload);
  }
}

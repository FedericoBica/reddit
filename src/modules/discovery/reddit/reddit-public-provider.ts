import "server-only";

import type { RedditDiscoveryProvider, RedditPost, RedditSearchInput } from "./types";
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

  async searchPosts(input: RedditSearchInput): Promise<RedditPost[]> {
    let url: URL;

    if (input.subreddit) {
      url = new URL(
        `https://www.reddit.com/r/${normalizeSubredditName(input.subreddit)}/search.json`,
      );
      url.searchParams.set("restrict_sr", "true");
    } else {
      url = new URL("https://www.reddit.com/search.json");
    }

    url.searchParams.set("q", input.query);
    url.searchParams.set("sort", input.sort ?? "new");
    url.searchParams.set("limit", String(Math.min(Math.max(input.limit, 1), 100)));
    url.searchParams.set("type", "link");
    url.searchParams.set("raw_json", "1");

    if (input.time) {
      url.searchParams.set("t", input.time);
    }

    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "User-Agent": getRedditUserAgent(),
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Reddit public search failed for "${input.query}": ${response.status}`);
    }

    const payload = (await response.json()) as RedditListingResponse;
    return mapRedditListingResponse(payload);
  }
}

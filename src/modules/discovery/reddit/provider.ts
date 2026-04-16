import "server-only";

import { ApifyRedditProvider } from "./apify-reddit-provider";
import { RedditApiProvider } from "./reddit-api-provider";
import { RedditPublicProvider } from "./reddit-public-provider";
import type { RedditDiscoveryProvider } from "./types";

export function createRedditDiscoveryProvider(): RedditDiscoveryProvider {
  const provider = process.env.REDDIT_PROVIDER?.trim().toLocaleLowerCase();

  if (provider === "apify") {
    return new ApifyRedditProvider();
  }

  if (provider === "oauth") {
    return new RedditApiProvider();
  }

  if (provider === "public" || provider === "public_json") {
    return new RedditPublicProvider();
  }

  if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
    return new RedditApiProvider();
  }

  if (process.env.APIFY_API_TOKEN) {
    return new ApifyRedditProvider();
  }

  return new RedditPublicProvider();
}

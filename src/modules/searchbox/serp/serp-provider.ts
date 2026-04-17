import "server-only";

import { requireEnv } from "@/lib/env";

export type GoogleRedditResult = {
  googleRank: number;
  redditPostId: string;
  permalink: string;
  title: string;
  snippet: string | null;
  subreddit: string;
};

type SerpApiOrganicResult = {
  position?: number;
  link: string;
  title?: string;
  snippet?: string;
};

type SerpApiResponse = {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
};

export async function searchGoogleForRedditPosts(
  query: string,
): Promise<GoogleRedditResult[]> {
  const apiKey = requireEnv("SERP_API_KEY");
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", `${query} site:reddit.com`);
  url.searchParams.set("num", "10");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("gl", "us");
  url.searchParams.set("hl", "en");

  const response = await fetch(url, { next: { revalidate: 0 } });

  if (!response.ok) {
    throw new Error(`SerpAPI request failed for "${query}": ${response.status}`);
  }

  const data = (await response.json()) as SerpApiResponse;

  if (data.error) {
    throw new Error(`SerpAPI error for "${query}": ${data.error}`);
  }

  const results: GoogleRedditResult[] = [];

  for (const item of data.organic_results ?? []) {
    const postId = extractRedditPostId(item.link);
    const subreddit = extractSubreddit(item.link);

    if (!postId || !subreddit) continue;

    results.push({
      googleRank: item.position ?? results.length + 1,
      redditPostId: postId,
      permalink: normalizePermalink(item.link),
      title: item.title?.trim() ?? "",
      snippet: item.snippet?.trim() ?? null,
      subreddit,
    });

    if (results.length >= 10) break;
  }

  return results;
}

function extractRedditPostId(url: string): string | null {
  const match = /\/comments\/([a-z0-9]+)/i.exec(url);
  return match?.[1] ?? null;
}

function extractSubreddit(url: string): string | null {
  const match = /reddit\.com\/r\/([^/?#]+)/i.exec(url);
  return match?.[1] ?? null;
}

function normalizePermalink(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.reddit.com${parsed.pathname}`;
  } catch {
    return url;
  }
}

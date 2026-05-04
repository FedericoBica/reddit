import "server-only";

import { requireEnv } from "@/lib/env";

const SEARCH_URL = "https://api.x.com/2/tweets/search/recent";

export type XSearchTweet = {
  id: string;
  text: string;
  authorId: string;
  authorUsername: string | null;
  authorName: string | null;
  authorVerified: boolean | null;
  authorFollowersCount: number | null;
  lang: string | null;
  createdAt: string | null;
  metrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    bookmarkCount: number | null;
    impressionCount: number | null;
  };
};

const LANG_MAP: Record<string, string> = {
  english: "en", spanish: "es", portuguese: "pt", french: "fr",
  german: "de", italian: "it", japanese: "ja", korean: "ko",
  chinese: "zh", arabic: "ar", russian: "ru", hindi: "hi",
  en: "en", es: "es", pt: "pt", fr: "fr", de: "de",
  it: "it", ja: "ja", ko: "ko", zh: "zh", ar: "ar", ru: "ru", hi: "hi",
};

function resolveXLang(primaryLanguage: string | null | undefined): string | null {
  if (!primaryLanguage) return null;
  return LANG_MAP[primaryLanguage.toLowerCase()] ?? null;
}

export async function searchRecentTweets(
  query: string,
  options: { startTime?: string; maxResults?: number; lang?: string } = {},
): Promise<XSearchTweet[]> {
  const bearer = requireEnv("X_API_BEARER_TOKEN");

  const langCode = resolveXLang(options.lang);
  const langFilter = langCode ? ` lang:${langCode}` : "";

  const params = new URLSearchParams({
    query: `${query} -is:retweet${langFilter}`,
    max_results: String(Math.max(10, Math.min(options.maxResults ?? 10, 100))),
    "tweet.fields": "created_at,author_id,lang,public_metrics",
    expansions: "author_id",
    "user.fields": "id,username,name,verified,public_metrics",
  });

  if (options.startTime) params.set("start_time", options.startTime);

  const response = await fetch(`${SEARCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: "no-store",
  });

  if (response.status === 429) throw new Error("X API rate limit reached");

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X search failed (${response.status}): ${body}`);
  }

  type RawTweet = {
    id: string;
    text: string;
    author_id: string;
    created_at?: string;
    lang?: string;
    public_metrics?: {
      like_count: number;
      retweet_count: number;
      reply_count: number;
      quote_count: number;
      bookmark_count?: number;
      impression_count?: number;
    };
  };

  type RawUser = {
    id: string;
    username: string;
    name: string;
    verified?: boolean;
    public_metrics?: { followers_count: number };
  };

  const payload = (await response.json()) as {
    data?: RawTweet[];
    includes?: { users?: RawUser[] };
  };

  const tweets = payload.data ?? [];
  const userMap = new Map((payload.includes?.users ?? []).map((u) => [u.id, u]));

  return tweets.map((tweet) => {
    const user = userMap.get(tweet.author_id);
    return {
      id: tweet.id,
      text: tweet.text,
      authorId: tweet.author_id,
      authorUsername: user?.username ?? null,
      authorName: user?.name ?? null,
      authorVerified: user?.verified ?? null,
      authorFollowersCount: user?.public_metrics?.followers_count ?? null,
      lang: tweet.lang ?? null,
      createdAt: tweet.created_at ?? null,
      metrics: {
        likeCount: tweet.public_metrics?.like_count ?? 0,
        retweetCount: tweet.public_metrics?.retweet_count ?? 0,
        replyCount: tweet.public_metrics?.reply_count ?? 0,
        quoteCount: tweet.public_metrics?.quote_count ?? 0,
        bookmarkCount: tweet.public_metrics?.bookmark_count ?? null,
        impressionCount: tweet.public_metrics?.impression_count ?? null,
      },
    };
  });
}

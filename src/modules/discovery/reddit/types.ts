import type { Json } from "@/db/schemas/database.types";

export type RedditPost = {
  id: string;
  fullname: string;
  title: string;
  body: string | null;
  subreddit: string;
  author: string | null;
  permalink: string;
  url: string | null;
  createdUtc: string | null;
  score: number | null;
  numComments: number | null;
  rawData: Json;
};

export type RedditSearchSort = "new" | "hot" | "top" | "relevance";
export type RedditSearchTime = "hour" | "day" | "week" | "month" | "year" | "all";

export type RedditSearchInput = {
  query: string;
  sort?: RedditSearchSort;
  time?: RedditSearchTime;
  subreddit?: string;
  limit: number;
};

export type RedditBatchSearchInput = {
  queries: string[];
  sort?: RedditSearchSort;
  time?: RedditSearchTime;
  subreddit?: string;
  limitPerQuery: number;
};

export type RedditComment = {
  id: string;
  body: string;
  author: string | null;
  subreddit: string;
  permalink: string;
  score: number | null;
  createdUtc: string | null;
  parentPostId: string;
  parentPostTitle: string;
  parentPostUrl: string;
};

export type RedditDiscoveryProvider = {
  fetchNewPosts(input: { subreddit: string; limit: number }): Promise<RedditPost[]>;
  searchPosts?(input: RedditSearchInput): Promise<RedditPost[]>;
  searchPostsBatch?(input: RedditBatchSearchInput): Promise<RedditPost[]>;
  searchComments?(input: RedditSearchInput): Promise<RedditComment[]>;
  searchCommentsBatch?(input: RedditBatchSearchInput): Promise<RedditComment[]>;
};

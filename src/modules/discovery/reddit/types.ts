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

export type RedditDiscoveryProvider = {
  fetchNewPosts(input: {
    subreddit: string;
    limit: number;
  }): Promise<RedditPost[]>;
};

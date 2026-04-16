import type { RedditPost } from "./types";

export type RedditListingResponse = {
  data?: {
    children?: {
      data?: RedditListingPost;
    }[];
  };
};

export type RedditListingPost = {
  id?: string;
  name?: string;
  title?: string;
  selftext?: string;
  subreddit?: string;
  author?: string;
  permalink?: string;
  url?: string;
  created_utc?: number;
  score?: number;
  num_comments?: number;
};

export function normalizeSubredditName(subreddit: string) {
  return subreddit.trim().replace(/^\/?r\//i, "").replace(/\s+/g, "");
}

export function getRedditUserAgent() {
  return (
    process.env.REDDIT_USER_AGENT?.trim() ||
    "web:reddprowl:0.1.0 (contact: local-dev)"
  );
}

export function mapRedditListingResponse(payload: RedditListingResponse): RedditPost[] {
  const children = payload.data?.children ?? [];

  return children.flatMap((child) => {
    const post = child.data;

    if (!post?.id || !post.name || !post.title || !post.subreddit) {
      return [];
    }

    return {
      id: post.id,
      fullname: post.name,
      title: post.title,
      body: post.selftext || null,
      subreddit: post.subreddit,
      author: post.author ?? null,
      permalink: post.permalink ? `https://www.reddit.com${post.permalink}` : "",
      url: post.url ?? null,
      createdUtc: post.created_utc ? new Date(post.created_utc * 1_000).toISOString() : null,
      score: post.score ?? null,
      numComments: post.num_comments ?? null,
      rawData: post,
    };
  });
}

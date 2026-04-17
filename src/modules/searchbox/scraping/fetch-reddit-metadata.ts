import "server-only";

export type RedditPostMetadata = {
  score: number | null;
  numComments: number | null;
  createdUtc: string | null;
};

export async function fetchRedditPostMetadata(postId: string): Promise<RedditPostMetadata> {
  const empty: RedditPostMetadata = { score: null, numComments: null, createdUtc: null };

  try {
    const res = await fetch(`https://www.reddit.com/by_id/t3_${postId}.json`, {
      headers: { "User-Agent": "ReddProwl/1.0 (+https://reddprowl.com)" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return empty;

    const json = await res.json();
    const post = json?.data?.children?.[0]?.data;
    if (!post) return empty;

    return {
      score: typeof post.score === "number" ? post.score : null,
      numComments: typeof post.num_comments === "number" ? post.num_comments : null,
      createdUtc:
        typeof post.created_utc === "number"
          ? new Date(post.created_utc * 1000).toISOString()
          : null,
    };
  } catch {
    return empty;
  }
}

import type { RedditPost } from "@/modules/discovery/reddit/types";

export type KeywordMatchTarget = {
  term: string;
};

export function findMatchedKeywords(post: RedditPost, keywords: KeywordMatchTarget[]) {
  const haystack = normalizeText(`${post.title}\n${post.body ?? ""}`);
  const matches = new Set<string>();

  for (const keyword of keywords) {
    const normalizedKeyword = normalizeText(keyword.term);

    if (normalizedKeyword.length === 0) {
      continue;
    }

    if (haystack.includes(normalizedKeyword)) {
      matches.add(keyword.term);
    }
  }

  return Array.from(matches);
}

function normalizeText(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

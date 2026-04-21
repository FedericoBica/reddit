import type { RedditPost } from "@/modules/discovery/reddit/types";

export type KeywordMatchTarget = {
  term: string;
  /**
   * high → competitor comparison / active buying keywords
   * Tells the classifier to weight these heavily in intent scoring.
   * normal → pain-point and general keywords (default)
   */
  weight?: "high" | "normal";
};

export function findMatchedKeywords(
  post: RedditPost,
  keywords: KeywordMatchTarget[],
): KeywordMatchTarget[] {
  const haystack = normalizeText(`${post.title}\n${post.body ?? ""}`);
  const matches: KeywordMatchTarget[] = [];

  for (const keyword of keywords) {
    const normalizedTerm = normalizeText(keyword.term);
    if (normalizedTerm.length === 0) continue;

    if (matchesWithWordBoundary(haystack, normalizedTerm)) {
      matches.push(keyword);
    }
  }

  return matches;
}

/**
 * Word-boundary aware match.
 * Single words → must be surrounded by non-word chars (prevents "notion" matching in "promotion").
 * Multi-word phrases → substring match is sufficient (phrase context is already specific).
 */
function matchesWithWordBoundary(haystack: string, term: string): boolean {
  const isMultiWord = term.includes(" ");

  if (isMultiWord) {
    return haystack.includes(term);
  }

  const idx = haystack.indexOf(term);
  if (idx === -1) return false;

  const before = idx === 0 ? " " : haystack[idx - 1];
  const after = idx + term.length >= haystack.length ? " " : haystack[idx + term.length];

  const isWordChar = (c: string) => /\w/.test(c);
  return !isWordChar(before) && !isWordChar(after);
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
}

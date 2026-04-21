import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Normalizes a Reddit permalink to a full URL regardless of whether it's a path (/r/...) or a full URL */
export function toRedditUrl(permalink: string): string {
  if (!permalink) return "https://www.reddit.com";
  if (permalink.startsWith("http")) return permalink;
  return `https://www.reddit.com${permalink}`;
}

/** Normalizes a Reddit permalink to a path (/r/...) regardless of whether it's a path or full URL */
export function toRedditPath(permalink: string): string {
  if (!permalink) return "";
  if (!permalink.startsWith("http")) return permalink;
  try {
    return new URL(permalink).pathname;
  } catch {
    return permalink;
  }
}

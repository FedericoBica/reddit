// Content script: handles messages from the background service worker.

type InboundMessage = {
  redditMessageId: string;
  fromUsername: string;
  body: string;
  receivedAt: string;
};

type SendDmMessage = { type: "SEND_DM"; username: string; message: string };
type PollInboxMessage = { type: "POLL_INBOX" };
type ScrapeThreadMessage = { type: "SCRAPE_THREAD"; postUrl: string };
type FetchSubredditMessage = {
  type: "FETCH_SUBREDDIT_POSTS";
  subreddit: string;
  keywords: string[];
  minScore: number;
  after?: string;
};
type ExtMessage = SendDmMessage | PollInboxMessage | ScrapeThreadMessage | FetchSubredditMessage;

type SendDmResult = { success: boolean; error?: string };

chrome.runtime.onMessage.addListener(
  (msg: ExtMessage, _sender, sendResponse: (result: unknown) => void) => {
    if (msg.type === "SEND_DM") {
      sendDm(msg.username, msg.message)
        .then((result) => sendResponse(result))
        .catch((err: unknown) =>
          sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }),
        );
      return true;
    }

    if (msg.type === "POLL_INBOX") {
      fetchInboxMessages()
        .then((messages) => sendResponse(messages))
        .catch((err: unknown) => {
          console.error("[ReddProwl] POLL_INBOX error", err);
          sendResponse([]);
        });
      return true;
    }

    if (msg.type === "SCRAPE_THREAD") {
      scrapeThreadCommenters(msg.postUrl)
        .then((usernames) => sendResponse(usernames))
        .catch((err: unknown) => {
          console.error("[ReddProwl] SCRAPE_THREAD error", err);
          sendResponse([]);
        });
      return true;
    }

    if (msg.type === "FETCH_SUBREDDIT_POSTS") {
      fetchSubredditPosters(msg.subreddit, msg.keywords, msg.minScore, msg.after)
        .then((result) => sendResponse(result))
        .catch((err: unknown) => {
          console.error("[ReddProwl] FETCH_SUBREDDIT_POSTS error", err);
          sendResponse({ authors: [], after: null });
        });
      return true;
    }

    return false;
  },
);

type RedditCommentData = {
  author: string;
  was_comment?: boolean;
  replies?: "" | { data: { children: RedditListingChild<RedditCommentData>[] } };
};

type RedditListingChild<T> = { kind: string; data: T };
type RedditListing<T> = { data: { children: RedditListingChild<T>[] } };
type RedditMessageData = {
  id: string;
  author: string;
  body: string;
  created_utc: number;
  was_comment: boolean;
  dest: string; // recipient username
};

type RedditPostData = {
  id: string;
  author: string;
  title: string;
  selftext: string;
  score: number;
};
type RedditPostListing = { data: { children: RedditListingChild<RedditPostData>[]; after: string | null } };

const SKIP_AUTHORS = new Set(["[deleted]", "AutoModerator"]);

async function fetchSubredditPosters(
  subreddit: string,
  keywords: string[],
  minScore: number,
  after?: string,
): Promise<{ authors: string[]; after: string | null }> {
  const params = new URLSearchParams({ limit: "100", sort: "new" });
  if (after) params.set("after", after);

  const res = await fetch(
    `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?${params}`,
    { credentials: "include", headers: { Accept: "application/json" } },
  );
  if (!res.ok) return { authors: [], after: null };

  const listing = (await res.json()) as RedditPostListing;
  const posts = listing?.data?.children ?? [];
  const nextAfter = listing?.data?.after ?? null;

  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  const authors = new Set<string>();
  for (const post of posts) {
    if (post.kind !== "t3") continue;
    const { author, title, selftext, score } = post.data;
    if (!author || SKIP_AUTHORS.has(author) || author.toLowerCase().endsWith("bot")) continue;
    if (score < minScore) continue;
    if (lowerKeywords.length > 0) {
      const text = `${title} ${selftext}`.toLowerCase();
      if (!lowerKeywords.some((kw) => text.includes(kw))) continue;
    }
    authors.add(author);
  }

  return { authors: [...authors], after: nextAfter };
}

async function scrapeThreadCommenters(postUrl: string): Promise<string[]> {
  const clean = postUrl.split("?")[0].replace(/\/$/, "");
  const jsonUrl = `${clean}.json?limit=500&depth=10`;

  const res = await fetch(jsonUrl, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as unknown[];
  if (!Array.isArray(data) || data.length < 2) return [];

  const commentsListing = data[1] as { data: { children: RedditListingChild<RedditCommentData>[] } };
  const authors = new Set<string>();

  function extract(children: RedditListingChild<RedditCommentData>[]): void {
    for (const child of children) {
      if (child.kind !== "t1") continue;
      const { author, replies } = child.data;
      if (author && !SKIP_AUTHORS.has(author) && !author.toLowerCase().endsWith("bot")) {
        authors.add(author);
      }
      if (replies && typeof replies === "object" && replies.data?.children) {
        extract(replies.data.children);
      }
    }
  }

  extract(commentsListing.data.children);
  return [...authors];
}

async function fetchInboxMessages(): Promise<InboundMessage[]> {
  // Fetch the last 25 inbox messages using the user's browser session.
  const res = await fetch("https://www.reddit.com/message/inbox.json?limit=25&mark=false", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) return [];

  const listing = (await res.json()) as RedditListing<RedditMessageData>;
  const children = listing?.data?.children ?? [];

  return children
    .filter((c) => c.kind === "t4" && !c.data.was_comment)
    .map((c) => ({
      redditMessageId: c.data.id,
      fromUsername: c.data.author,
      body: c.data.body,
      receivedAt: new Date(c.data.created_utc * 1000).toISOString(),
    }));
}

async function sendDm(username: string, message: string): Promise<SendDmResult> {
  try {
    // Navigate to Reddit's compose DM page.
    const composeUrl = `https://www.reddit.com/message/compose/?to=${encodeURIComponent(username)}`;
    window.location.href = composeUrl;

    // Wait for the compose form to appear.
    const subjectInput = await waitForElement<HTMLInputElement>('input[name="subject"]', 6000);
    const messageInput = await waitForElement<HTMLTextAreaElement>('textarea[name="text"]', 3000);
    const submitBtn = await waitForElement<HTMLButtonElement>('button[type="submit"]', 3000);

    if (!subjectInput || !messageInput || !submitBtn) {
      return { success: false, error: "Compose form not found" };
    }

    // Fill in the subject (required by Reddit).
    setNativeValue(subjectInput, "Hey!");
    subjectInput.dispatchEvent(new Event("input", { bubbles: true }));

    await sleep(200);

    setNativeValue(messageInput, message);
    messageInput.dispatchEvent(new Event("input", { bubbles: true }));

    await sleep(300);

    submitBtn.click();

    // Wait briefly and check for success indicators.
    await sleep(2000);

    const errorEl = document.querySelector(".error-message, .status-msg.error");
    if (errorEl) {
      return { success: false, error: errorEl.textContent?.trim() ?? "Send error" };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

function waitForElement<T extends Element>(selector: string, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const el = document.querySelector<T>(selector);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const found = document.querySelector<T>(selector);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeoutMs);
  });
}

// React-compatible value setter that triggers onChange events.
function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
    "value",
  )?.set;
  nativeInputValueSetter?.call(el, value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

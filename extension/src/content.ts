// Content script: handles messages from the background service worker.

type InboundMessage = {
  redditMessageId: string;
  fromUsername: string;
  body: string;
  receivedAt: string;
};

type PollInboxMessage = { type: "POLL_INBOX" };
type ScrapeThreadMessage = {
  type: "SCRAPE_THREAD";
  postUrl: string;
  firstLevelOnly?: boolean;
  skipPostAuthor?: boolean;
};
type ToggleDockMessage = { type: "TOGGLE_DOCK" };
type GetRedditContextMessage = { type: "GET_REDDIT_CONTEXT" };
type FetchSubredditMessage = {
  type: "FETCH_SUBREDDIT_POSTS";
  subreddit: string;
  keywords: string[];
  minScore: number;
  after?: string;
};
type ExtMessage = PollInboxMessage | ScrapeThreadMessage | FetchSubredditMessage | ToggleDockMessage | GetRedditContextMessage;
type DockState = "open" | "minimized" | "closed";
type RedditContext = {
  pageType: "thread" | "subreddit" | "other";
  url: string;
  subredditName: string | null;
  postTitle: string | null;
  postUrl: string | null;
  redditUsername: string | null;
  loggedIn: boolean;
};

const DOCK_STATE_KEY = "dockState";
const DOCK_HOST_ID = "reddprowl-dock-host";
const DOCK_IFRAME_ID = "reddprowl-dock-frame";
const SESSION_USERNAME_CACHE_MS = 5 * 60 * 1000;
let cachedSessionUsername: { value: string | null; expiresAt: number } | null = null;

chrome.runtime.onMessage.addListener(
  (msg: ExtMessage, _sender, sendResponse: (result: unknown) => void) => {
    if (msg.type === "TOGGLE_DOCK") {
      toggleDock()
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) => {
          console.error("[ReddProwl] TOGGLE_DOCK error", err);
          sendResponse({ ok: false });
        });
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
      scrapeThreadCommenters(msg.postUrl, {
        firstLevelOnly: msg.firstLevelOnly,
        skipPostAuthor: msg.skipPostAuthor,
      })
        .then((usernames) => sendResponse(usernames))
        .catch((err: unknown) => {
          console.error("[ReddProwl] SCRAPE_THREAD error", err);
          sendResponse([]);
        });
      return true;
    }

    if (msg.type === "GET_REDDIT_CONTEXT") {
      getRedditContext()
        .then((context) => sendResponse(context))
        .catch((err: unknown) => {
          console.error("[ReddProwl] GET_REDDIT_CONTEXT error", err);
          sendResponse({
            pageType: "other",
            url: window.location.href,
            subredditName: null,
            postTitle: null,
            postUrl: null,
            redditUsername: null,
            loggedIn: false,
          } satisfies RedditContext);
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

type DockRefs = {
  host: HTMLDivElement;
  panel: HTMLDivElement;
  launcher: HTMLButtonElement;
};

let dockRefs: DockRefs | null = null;

function ensureDock(): DockRefs {
  if (dockRefs?.host.isConnected) return dockRefs;

  const existing = document.getElementById(DOCK_HOST_ID);
  if (existing instanceof HTMLDivElement && existing !== dockRefs?.host) {
    existing.remove();
    dockRefs = null;
  }

  const host = document.createElement("div");
  host.id = DOCK_HOST_ID;
  host.style.all = "initial";
  host.style.position = "fixed";
  host.style.zIndex = "2147483647";
  host.style.top = "0";
  host.style.right = "0";
  host.style.pointerEvents = "none";

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .panel {
        position: fixed;
        top: 16px;
        right: 16px;
        bottom: 16px;
        width: min(420px, calc(100vw - 32px));
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.96);
        border: 1px solid rgba(224, 112, 0, 0.18);
        box-shadow: 0 22px 70px rgba(25, 24, 23, 0.24);
        overflow: hidden;
        pointer-events: auto;
        backdrop-filter: blur(14px);
      }
      .panel.hidden { display: none; }
      .toolbar {
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px 8px 14px;
        background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,243,236,0.95) 100%);
        border-bottom: 1px solid #EFE8DE;
      }
      .brand {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 800;
        color: #9A6841;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .actions {
        display: flex;
        gap: 8px;
      }
      .icon-btn {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 1px solid #E7DED2;
        background: #FFF;
        color: #6B6B6E;
        font: inherit;
        font-size: 16px;
        line-height: 1;
        cursor: pointer;
      }
      .icon-btn:hover {
        background: #F6F2EB;
      }
      .frame {
        width: 100%;
        height: calc(100% - 44px);
        border: 0;
        background: transparent;
      }
      .launcher {
        position: fixed;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        writing-mode: vertical-rl;
        text-orientation: mixed;
        border: 0;
        border-radius: 16px 0 0 16px;
        padding: 14px 10px;
        background: linear-gradient(180deg, #E07000 0%, #B85500 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        box-shadow: 0 18px 40px rgba(224, 112, 0, 0.3);
        pointer-events: auto;
        cursor: pointer;
      }
      .launcher.hidden { display: none; }
      @media (max-width: 520px) {
        .panel {
          top: 8px;
          right: 8px;
          bottom: 8px;
          width: calc(100vw - 16px);
        }
        .launcher {
          right: 4px;
        }
      }
    </style>
    <div id="reddprowl-panel" class="panel hidden">
      <div class="toolbar">
        <div class="brand">ReddProwl</div>
        <div class="actions">
          <button id="reddprowl-minimize" class="icon-btn" aria-label="Minimize panel">−</button>
          <button id="reddprowl-close" class="icon-btn" aria-label="Close panel">×</button>
        </div>
      </div>
      <iframe id="${DOCK_IFRAME_ID}" class="frame" src="${chrome.runtime.getURL("sidepanel.html")}"></iframe>
    </div>
    <button id="reddprowl-launcher" class="launcher hidden" aria-label="Open ReddProwl panel">ReddProwl</button>
  `;

  document.documentElement.appendChild(host);

  const panel = shadow.getElementById("reddprowl-panel");
  const launcher = shadow.getElementById("reddprowl-launcher");
  const minimize = shadow.getElementById("reddprowl-minimize");
  const close = shadow.getElementById("reddprowl-close");

  if (!(panel instanceof HTMLDivElement) || !(launcher instanceof HTMLButtonElement)) {
    throw new Error("Failed to initialize dock");
  }

  launcher.addEventListener("click", () => {
    void setDockState("open");
  });
  minimize?.addEventListener("click", () => {
    void setDockState("minimized");
  });
  close?.addEventListener("click", () => {
    void setDockState("closed");
  });

  dockRefs = { host, panel, launcher };
  return dockRefs;
}

function destroyDock() {
  if (dockRefs?.host.isConnected) {
    dockRefs.host.remove();
  }
  dockRefs = null;
}

function applyDockState(state: DockState) {
  const { panel, launcher } = ensureDock();
  panel.classList.toggle("hidden", state !== "open");
  launcher.classList.toggle("hidden", state !== "minimized");
}

async function setDockState(state: DockState): Promise<void> {
  chrome.storage.local.set({ [DOCK_STATE_KEY]: state }).catch((err) => {
    console.error("[ReddProwl] failed to persist dock state", err);
  });
  if (state === "closed") {
    destroyDock();
    return;
  }
  applyDockState(state);
}

async function getDockState(): Promise<DockState> {
  const stored = await chrome.storage.local.get([DOCK_STATE_KEY]);
  const state = stored[DOCK_STATE_KEY];
  return state === "open" || state === "minimized" || state === "closed" ? state : "closed";
}

async function toggleDock(): Promise<void> {
  const current = await getDockState();
  if (current === "open") {
    await setDockState("minimized");
    return;
  }
  destroyDock();
  await setDockState("open");
}

void getDockState().then((state) => {
  ensureDock();
  applyDockState(state);
});

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

async function scrapeThreadCommenters(
  postUrl: string,
  options?: { firstLevelOnly?: boolean; skipPostAuthor?: boolean },
): Promise<string[]> {
  const clean = postUrl.split("?")[0].replace(/\/$/, "");
  const jsonUrl = `${clean}.json?limit=500&depth=10`;

  const res = await fetch(jsonUrl, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as unknown[];
  if (!Array.isArray(data) || data.length < 2) return [];

  const postListing = data[0] as { data?: { children?: Array<{ kind: string; data: { author?: string } }> } };
  const commentsListing = data[1] as { data: { children: RedditListingChild<RedditCommentData>[] } };
  const postAuthor = postListing?.data?.children?.[0]?.kind === "t3"
    ? postListing.data.children[0].data.author ?? null
    : null;
  const authors = new Set<string>();

  function extract(children: RedditListingChild<RedditCommentData>[]): void {
    for (const child of children) {
      if (child.kind !== "t1") continue;
      const { author, replies } = child.data;
      if (
        author
        && !SKIP_AUTHORS.has(author)
        && !author.toLowerCase().endsWith("bot")
        && (!options?.skipPostAuthor || author !== postAuthor)
      ) {
        authors.add(author);
      }
      if (!options?.firstLevelOnly && replies && typeof replies === "object" && replies.data?.children) {
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

async function getRedditContext(): Promise<RedditContext> {
  const url = window.location.href;
  const path = window.location.pathname;
  const threadMatch = path.match(/^\/r\/([^/]+)\/comments\/([^/]+)/i);
  const subredditMatch = path.match(/^\/r\/([^/]+)/i);
  const profileMatch = path.match(/^\/(?:user|u)\/([^/]+)/i);
  const subredditName = threadMatch?.[1] ?? subredditMatch?.[1] ?? null;
  const postUrl = threadMatch ? url.split("?")[0] : null;
  const detection = await detectSessionRedditUsername();

  return {
    pageType: threadMatch ? "thread" : subredditMatch ? "subreddit" : "other",
    url,
    subredditName,
    postTitle: threadMatch ? getCurrentPostTitle() : null,
    postUrl,
    redditUsername: detection.username,
    loggedIn: Boolean(detection.username),
  };
}

function getCurrentPostTitle(): string | null {
  const selectors = [
    "shreddit-title",
    "[data-test-id='post-content'] h1",
    "h1",
    "faceplate-screen-reader-content",
    "meta[property='og:title']",
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    if (!node) continue;
    const text = node instanceof HTMLMetaElement ? node.content : node.textContent;
    const value = text?.trim();
    if (value) return value.replace(/\s+/g, " ");
  }

  return document.title.replace(/\s*\|\s*Reddit.*$/i, "").trim() || null;
}

async function detectSessionRedditUsername(): Promise<{
  username: string | null;
  profilePathUsername: string | null;
  domUsername: string | null;
  pageDataUsername: string | null;
  scriptRegexUsername: string | null;
}> {
  const now = Date.now();
  const profilePathUsername = extractUsernameFromHref(window.location.pathname);
  if (cachedSessionUsername && cachedSessionUsername.expiresAt > now) {
    return {
      username: cachedSessionUsername.value ?? profilePathUsername,
      profilePathUsername,
      domUsername: null,
      pageDataUsername: null,
      scriptRegexUsername: null,
    };
  }

  const domUsername = getSessionUsernameFromDom();
  const pageData = await getSessionUsernameFromPageData();
  const pageDataUsername = pageData.pageDataUsername;
  const scriptRegexUsername = pageData.scriptRegexUsername;
  const localUsername = profilePathUsername ?? domUsername ?? pageDataUsername ?? scriptRegexUsername;
  cachedSessionUsername = {
    value: localUsername,
    expiresAt: now + SESSION_USERNAME_CACHE_MS,
  };
  return {
    username: localUsername,
    profilePathUsername,
    domUsername,
    pageDataUsername,
    scriptRegexUsername,
  };
}

function getSessionUsernameFromDom(): string | null {
  const selectors = [
    "header shreddit-user-account-menu a[href^='/user/']",
    "header shreddit-user-account-menu a[href^='/u/']",
    "header a[id*='profile'][href^='/user/']",
    "header a[id*='profile'][href^='/u/']",
    "header nav a[href^='/user/']",
    "header nav a[href^='/u/']",
    "header a[aria-label*='profile' i][href]",
    "header a[aria-label*='account' i][href]",
  ];

  for (const selector of selectors) {
    const node = document.querySelector(selector);
    const username = extractUsernameFromNode(node);
    if (username) return username;
  }

  return null;
}

async function getSessionUsernameFromPageData(): Promise<{
  pageDataUsername: string | null;
  scriptRegexUsername: string | null;
}> {
  try {
    const username = await readUsernameFromPageContext();
    if (username) {
      return { pageDataUsername: username, scriptRegexUsername: null };
    }
  } catch (error) {
    console.debug("[ReddProwl] page context username lookup failed", error);
  }

  const scriptContents = Array.from(document.scripts)
    .map((script) => script.textContent ?? "")
    .filter(Boolean);

  const regexes = [
    /"loggedInAccount"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/s,
    /"currentUser"\s*:\s*\{[^}]*"account"\s*:\s*\{[^}]*"displayText"\s*:\s*"([^"]+)"/s,
    /"session"\s*:\s*\{[^}]*"user"\s*:\s*\{[^}]*"account"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/s,
    /"accounts"\s*:\s*\{\s*"([^"]+)":/s,
  ];

  for (const content of scriptContents) {
    for (const regex of regexes) {
      const match = content.match(regex);
      const username = normalizeRedditUsername(match?.[1]);
      if (username) return { pageDataUsername: null, scriptRegexUsername: username };
    }
  }

  return { pageDataUsername: null, scriptRegexUsername: null };
}

function extractUsernameFromNode(node: Element | null): string | null {
  if (!node) return null;

  if (node instanceof HTMLAnchorElement) {
    const hrefUsername = extractUsernameFromHref(node.getAttribute("href"));
    if (hrefUsername) return hrefUsername;
  }

  const attrCandidates = [
    node.getAttribute("href"),
    node.getAttribute("aria-label"),
    node.getAttribute("title"),
    node.getAttribute("data-testid"),
  ];
  for (const candidate of attrCandidates) {
    const username = normalizeRedditUsername(candidate);
    if (username) return username;
    const hrefUsername = extractUsernameFromHref(candidate);
    if (hrefUsername) return hrefUsername;
  }

  return normalizeRedditUsername(node.textContent);
}

function extractUsernameFromHref(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/\/(?:user|u)\/([^/?#]+)/i);
  return normalizeRedditUsername(match?.[1]);
}

function normalizeRedditUsername(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/^u\//i, "").replace(/^@/, "");
  if (!/^[A-Za-z0-9_-]{3,32}$/.test(trimmed)) return null;
  return trimmed;
}

async function readUsernameFromPageContext(): Promise<string | null> {
  return new Promise((resolve) => {
    const eventName = `reddprowl:username:${Math.random().toString(36).slice(2)}`;
    const cleanup = () => {
      window.removeEventListener(eventName, onResult as EventListener);
      script.remove();
    };

    const onResult = (event: Event) => {
      const customEvent = event as CustomEvent<{ username?: unknown }>;
      cleanup();
      resolve(normalizeRedditUsername(customEvent.detail?.username));
    };

    window.addEventListener(eventName, onResult as EventListener, { once: true });

    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("page-context.js");
    script.dataset.reddprowlEvent = eventName;

    (document.head ?? document.documentElement).appendChild(script);
    window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, 250);
  });
}


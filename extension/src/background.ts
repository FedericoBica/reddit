import { getStorage, setStorage } from "./storage";
import { getNextQueueItem, reportQueueResult, syncInboxMessages, listCampaigns, getCampaign, addContactsBatch, syncRedditAccount } from "./api";

const ALARM_NAME = "reddprowl-runner";
const ALARM_PERIOD_MINUTES = 1;

const INBOX_ALARM_NAME = "reddprowl-inbox-poll";
const INBOX_ALARM_PERIOD_MINUTES = 5;

const SUBREDDIT_ALARM_NAME = "reddprowl-subreddit-poll";
const SUBREDDIT_ALARM_PERIOD_MINUTES = 10;

const ACCOUNT_VERIFY_ALARM_NAME = "reddprowl-account-verify";
const ACCOUNT_VERIFY_PERIOD_MINUTES = 15;

chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
chrome.alarms.create(INBOX_ALARM_NAME, { periodInMinutes: INBOX_ALARM_PERIOD_MINUTES });
chrome.alarms.create(SUBREDDIT_ALARM_NAME, { periodInMinutes: SUBREDDIT_ALARM_PERIOD_MINUTES });
chrome.alarms.create(ACCOUNT_VERIFY_ALARM_NAME, { periodInMinutes: ACCOUNT_VERIFY_PERIOD_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await runCycle();
  } else if (alarm.name === INBOX_ALARM_NAME) {
    await pollInbox();
  } else if (alarm.name === SUBREDDIT_ALARM_NAME) {
    await pollSubreddits();
  } else if (alarm.name === ACCOUNT_VERIFY_ALARM_NAME) {
    await verifyRedditAccount();
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  const tabId = tab.id;
  const url = tab.url ?? "";

  if (!tabId) return;

  if (!/^https:\/\/(www|old)\.reddit\.com\//.test(url)) {
    await chrome.storage.local.set({ dockState: "open" });
    await chrome.tabs.create({ url: "https://www.reddit.com/" });
    return;
  }

  try {
    await sendMessageWithContentFallback(tabId, { type: "TOGGLE_DOCK" });
  } catch (err) {
    console.error("[ReddProwl action]", err);
  }
});

// Also run on extension startup.
chrome.runtime.onStartup.addListener(async () => {
  await verifyRedditAccount();
  await runCycle();
  await pollInbox();
  await pollSubreddits();
});

async function runCycle(): Promise<void> {
  const storage = await getStorage();
  if (!storage.token || !storage.activeCampaignId) return;
  if (!storage.linkedRedditUsername) {
    chrome.runtime.sendMessage({ type: "ACCOUNT_NOT_LINKED", linked: null }).catch(() => {});
    return;
  }

  try {
    const item = await getNextQueueItem(storage.token, storage.activeCampaignId);
    if (!item) return;

    const tabs = await chrome.tabs.query({ url: ["https://www.reddit.com/*", "https://old.reddit.com/*"] });

    if (tabs.length === 0) {
      // No Reddit session active — skip this cycle.
      return;
    }

    // Random delay between min and max.
    const delayMs = randomBetween(
      (item.delay_min_sec ?? 30) * 1000,
      (item.delay_max_sec ?? 120) * 1000,
    );
    await sleep(delayMs);

    const result = await sendDmViaTab(item.contact.reddit_username, item.interpolatedMessage);

    const success = result.success;
    await reportQueueResult(
      storage.token,
      item.id,
      item.campaign_id,
      success,
      result?.error,
    );

    chrome.runtime.sendMessage({ type: "RUNNER_TICK", success, username: item.contact.reddit_username }).catch(() => {});
  } catch (err) {
    console.error("[ReddProwl runner]", err);
  }
}

async function pollInbox(): Promise<void> {
  const storage = await getStorage();
  if (!storage.token) return;

  try {
    const tabs = await chrome.tabs.query({ url: ["https://www.reddit.com/*", "https://old.reddit.com/*"] });
    if (tabs.length === 0) return;

    const tab = tabs[0];
    if (!tab.id) return;

    const messages = await sendMessageWithContentFallback(tab.id, { type: "POLL_INBOX" }) as
      | Array<{ redditMessageId: string; fromUsername: string; body: string; receivedAt: string }>
      | undefined;

    if (!messages || messages.length === 0) return;

    const result = await syncInboxMessages(storage.token, messages);
    console.log("[ReddProwl inbox]", result);
  } catch (err) {
    console.error("[ReddProwl inbox]", err);
  }
}

async function pollSubreddits(): Promise<void> {
  const storage = await getStorage();
  if (!storage.token) return;

  let campaigns;
  try {
    campaigns = await listCampaigns(storage.token);
  } catch {
    return;
  }

  const active = campaigns.filter((c) => c.type === "subreddit" && c.status === "active");
  if (active.length === 0) return;

  const tabs = await chrome.tabs.query({ url: ["https://www.reddit.com/*", "https://old.reddit.com/*"] });
  if (tabs.length === 0) return;
  const tab = tabs[0];
  if (!tab.id) return;

  for (const campaign of active) {
    try {
      const detail = await getCampaign(storage.token, campaign.id);
      const cfg = (detail.source_config ?? {}) as Record<string, unknown>;
      const subreddit = typeof cfg.subreddit === "string" ? cfg.subreddit : null;
      if (!subreddit) continue;

      const keywords = Array.isArray(cfg.keywords)
        ? (cfg.keywords as unknown[]).filter((k): k is string => typeof k === "string")
        : [];
      const minScore = typeof cfg.minScore === "number" ? cfg.minScore : 0;

      const cursorKey = `subreddit_cursor_${campaign.id}`;
      const stored = await chrome.storage.local.get([cursorKey]);
      const after = (stored[cursorKey] as string | undefined) ?? undefined;

      const result = await sendMessageWithContentFallback(tab.id, {
        type: "FETCH_SUBREDDIT_POSTS",
        subreddit,
        keywords,
        minScore,
        after,
      }) as { authors: string[]; after: string | null } | undefined;

      if (!result || result.authors.length === 0) continue;

      await addContactsBatch(storage.token, campaign.id, result.authors);

      if (result.after) {
        await chrome.storage.local.set({ [cursorKey]: result.after });
      }

      console.log(`[ReddProwl subreddit] r/${subreddit} → ${result.authors.length} authors`);
    } catch (err) {
      console.error(`[ReddProwl subreddit] campaign ${campaign.id}`, err);
    }
  }
}

async function verifyRedditAccount(): Promise<void> {
  const storage = await getStorage();
  if (!storage.token) return;

  // Account verification is explicit: the user must navigate to their Reddit
  // profile page and click "Link current account". The background alarm only
  // broadcasts current storage state so any open panel can sync its UI.
  if (storage.linkedRedditUsername) {
    chrome.runtime.sendMessage({
      type: "ACCOUNT_VERIFIED",
      username: storage.linkedRedditUsername,
      changed: false,
    }).catch(() => {});
  } else {
    chrome.runtime.sendMessage({ type: "ACCOUNT_NOT_LINKED", linked: null }).catch(() => {});
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendMessageWithContentFallback(tabId: number, message: unknown): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (!isMissingReceiverError(error)) throw error;

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });

    await sleep(150);
    return chrome.tabs.sendMessage(tabId, message);
  }
}

function isMissingReceiverError(error: unknown): boolean {
  return error instanceof Error && /Receiving end does not exist/i.test(error.message);
}

// ── Tab-based DM sender ──────────────────────────────────────────
// Opens a background old.reddit.com compose tab, fills and submits
// the form via executeScript, then uses tab URL change as the
// success signal (old Reddit redirects to /message/sent/ on send).

async function sendDmViaTab(
  username: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const composeUrl = `https://old.reddit.com/message/compose/?to=${encodeURIComponent(username)}`;
  let tabId: number | undefined;

  try {
    const tab = await chrome.tabs.create({ url: composeUrl, active: false });
    tabId = tab.id;
    if (!tabId) return { success: false, error: "Failed to open compose tab" };

    await waitForTabLoaded(tabId, 12_000);

    const [scriptResult] = await chrome.scripting.executeScript({
      target: { tabId },
      func: fillComposeForm,
      args: [username, message],
    });

    const fill = scriptResult?.result as { submitted: boolean; error?: string } | undefined;
    if (!fill?.submitted) {
      return { success: false, error: fill?.error ?? "Compose form not found" };
    }

    // Old Reddit redirects away from /message/compose on success.
    const sent = await waitForTabNavAway(tabId, "/message/compose", 10_000);
    return sent
      ? { success: true }
      : { success: false, error: "No redirect after submit — message may not have sent" };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Send failed" };
  } finally {
    if (tabId !== undefined) await chrome.tabs.remove(tabId).catch(() => {});
  }
}

function waitForTabLoaded(tabId: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Compose tab load timeout"));
    }, timeoutMs);

    function listener(id: number, info: chrome.tabs.TabChangeInfo) {
      if (id === tabId && info.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

function waitForTabNavAway(tabId: number, urlFragment: string, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve(false);
    }, timeoutMs);

    function listener(id: number, info: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
      if (id === tabId && info.status === "complete" && tab.url && !tab.url.includes(urlFragment)) {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

// Runs inside the compose page via chrome.scripting.executeScript —
// no access to outer scope. Uses old.reddit.com's standard HTML form.
async function fillComposeForm(
  expectedUsername: string,
  message: string,
): Promise<{ submitted: boolean; error?: string }> {
  function waitEl(selector: string, ms: number): Promise<Element | null> {
    return new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const found = (document as any).querySelector(selector);
      if (found) return resolve(found as Element);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obs = new (globalThis as any).MutationObserver(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = (document as any).querySelector(selector);
        if (el) { obs.disconnect(); resolve(el as Element); }
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      obs.observe((document as any).body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); resolve(null); }, ms);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toInput = (document as any).querySelector('input[name="to"]') as { value: string } | null;
  if (toInput) {
    const actual = toInput.value.trim().toLowerCase();
    if (actual && actual !== expectedUsername.toLowerCase()) {
      return { submitted: false, error: `Recipient mismatch: form has "${actual}", expected "${expectedUsername}"` };
    }
  }

  const subjectInput = await waitEl('input[name="subject"]', 6000) as ({ value: string } & EventTarget) | null;
  const messageInput = await waitEl('textarea[name="text"], textarea[name="message"]', 4000) as ({ value: string } & EventTarget) | null;
  const submitBtn = await waitEl('button[type="submit"], input[type="submit"]', 4000) as ({ click(): void } & EventTarget) | null;

  if (!subjectInput || !messageInput || !submitBtn) {
    return { submitted: false, error: "Compose form elements not found" };
  }

  // Vary subject across messages to avoid repetition patterns.
  const subjectPool = ["Reaching out", "Hey there", "Quick note", "Following up", "Hi from Reddit"];
  const subject = subjectPool[message.charCodeAt(0) % subjectPool.length];

  subjectInput.value = subject;
  subjectInput.dispatchEvent(new Event("input", { bubbles: true }));
  subjectInput.dispatchEvent(new Event("change", { bubbles: true }));

  await new Promise<void>((r) => setTimeout(r, 200));

  messageInput.value = message;
  messageInput.dispatchEvent(new Event("input", { bubbles: true }));
  messageInput.dispatchEvent(new Event("change", { bubbles: true }));

  await new Promise<void>((r) => setTimeout(r, 300));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const preError = (document as any).querySelector(".error-message, .status-msg.error");
  if (preError?.textContent?.trim()) {
    return { submitted: false, error: preError.textContent.trim() as string };
  }

  submitBtn.click();
  return { submitted: true };
}

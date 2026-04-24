import { getStorage, setStorage } from "./storage";
import { getNextQueueItem, reportQueueResult, syncInboxMessages, listCampaigns, getCampaign, addContactsBatch } from "./api";

const ALARM_NAME = "reddprowl-runner";
const ALARM_PERIOD_MINUTES = 1;

const INBOX_ALARM_NAME = "reddprowl-inbox-poll";
const INBOX_ALARM_PERIOD_MINUTES = 5;

const SUBREDDIT_ALARM_NAME = "reddprowl-subreddit-poll";
const SUBREDDIT_ALARM_PERIOD_MINUTES = 10;

chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_PERIOD_MINUTES });
chrome.alarms.create(INBOX_ALARM_NAME, { periodInMinutes: INBOX_ALARM_PERIOD_MINUTES });
chrome.alarms.create(SUBREDDIT_ALARM_NAME, { periodInMinutes: SUBREDDIT_ALARM_PERIOD_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await runCycle();
  } else if (alarm.name === INBOX_ALARM_NAME) {
    await pollInbox();
  } else if (alarm.name === SUBREDDIT_ALARM_NAME) {
    await pollSubreddits();
  }
});

// Also run on extension startup.
chrome.runtime.onStartup.addListener(async () => {
  await runCycle();
  await pollInbox();
  await pollSubreddits();
});

async function runCycle(): Promise<void> {
  const storage = await getStorage();
  if (!storage.token || !storage.activeCampaignId) return;

  try {
    const item = await getNextQueueItem(storage.token, storage.activeCampaignId);
    if (!item) return;

    // Notify content script to send the DM.
    const tabs = await chrome.tabs.query({ url: ["https://www.reddit.com/*", "https://old.reddit.com/*"] });

    if (tabs.length === 0) {
      // No Reddit tab open — skip this cycle.
      await setStorage({ ...storage });
      return;
    }

    const tab = tabs[0];
    if (!tab.id) return;

    // Random delay between min and max.
    const delayMs = randomBetween(
      (item.delay_min_sec ?? 30) * 1000,
      (item.delay_max_sec ?? 120) * 1000,
    );
    await sleep(delayMs);

    const result = await chrome.tabs.sendMessage(tab.id, {
      type: "SEND_DM",
      username: item.contact.reddit_username,
      message: item.interpolatedMessage,
    }) as { success: boolean; error?: string } | undefined;

    const success = result?.success ?? false;
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

    const messages = await chrome.tabs.sendMessage(tab.id, { type: "POLL_INBOX" }) as
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

      const result = await chrome.tabs.sendMessage(tab.id, {
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

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

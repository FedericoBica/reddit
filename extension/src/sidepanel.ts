import { clearStorage, getStorage, setStorage } from "./storage";
import {
  addContactsBatch,
  connect,
  createCampaign,
  getCampaign,
  getStatus,
  listCampaigns,
  startCampaign,
  syncRedditAccount,
} from "./api";

type PanelView = "home" | "campaign" | "settings";
type CampaignType = "thread" | "subreddit" | "lead";

type RedditContext = {
  pageType: "thread" | "subreddit" | "other";
  url: string;
  subredditName: string | null;
  postTitle: string | null;
  postUrl: string | null;
  redditUsername: string | null;
  loggedIn: boolean;
};

type CampaignSummary = Awaited<ReturnType<typeof listCampaigns>>[number];
const DEFAULT_CONTEXT: RedditContext = {
  pageType: "other",
  url: "",
  subredditName: null,
  postTitle: null,
  postUrl: null,
  redditUsername: null,
  loggedIn: false,
};

const state: {
  view: PanelView;
  selectedType: CampaignType;
  context: RedditContext;
  campaigns: CampaignSummary[];
  selectedCampaignId: string;
  linkedRedditUsername: string | null;
  linkedRedditVerifiedAt: string | null;
} = {
  view: "home",
  selectedType: "thread",
  context: DEFAULT_CONTEXT,
  campaigns: [],
  selectedCampaignId: "new",
  linkedRedditUsername: null,
  linkedRedditVerifiedAt: null,
};

let contextPollHandle: number | null = null;

function $(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing element #${id}`);
  return element;
}

function setText(id: string, value: string) {
  $(id).textContent = value;
}

function setVisible(id: string, visible: boolean) {
  const element = $(id);
  element.classList.toggle("active", visible);
  element.style.display = visible ? "" : "none";
}

function setView(view: PanelView) {
  state.view = view;
  document.querySelectorAll<HTMLElement>(".panel-view").forEach((node) => {
    node.classList.toggle("active", node.id === `view-${view}`);
  });
  document.querySelectorAll<HTMLButtonElement>(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function setAppError(message: string | null) {
  const node = document.getElementById("app-error") as HTMLDivElement | null;
  if (!node) return;
  if (!message) {
    node.textContent = "";
    node.style.display = "none";
    return;
  }
  node.textContent = message;
  node.style.display = "block";
}

function setFeedback(message: string | null, tone: "error" | "success" | "muted" = "muted") {
  const feedback = $("campaign-feedback");
  if (!message) {
    feedback.textContent = "";
    feedback.className = "feedback";
    feedback.style.display = "none";
    return;
  }

  feedback.textContent = message;
  feedback.className = `feedback ${tone}`;
  feedback.style.display = "block";
}

function defaultMessageTemplate(type: CampaignType, context: RedditContext): string {
  if (type === "thread") {
    return "{Hey|Hi|Hello} {{username}}, saw your comment"
      + (context.postTitle ? ` on \"${context.postTitle}\"` : "")
      + (context.subredditName ? ` in r/${context.subredditName}` : "")
      + " and wanted to reach out.";
  }

  if (type === "subreddit") {
    return "{Hey|Hi|Hello} {{username}}, saw your post"
      + (context.subredditName ? ` in r/${context.subredditName}` : "")
      + " and thought this might be relevant.";
  }

  return "{Hey|Hi|Hello} {{username}}, wanted to send you a quick note from our lead list.";
}

function applyCampaignDefaults(type: CampaignType, context: RedditContext) {
  const prefix = type.charAt(0).toUpperCase() + type.slice(1);
  const contextName = type === "thread"
    ? context.postTitle || context.subredditName || "post"
    : type === "subreddit"
      ? context.subredditName || "subreddit"
      : "lead list";

  (document.getElementById("campaign-name") as HTMLInputElement).value = `${prefix} campaign · ${contextName}`;
  (document.getElementById("campaign-message") as HTMLTextAreaElement).value = defaultMessageTemplate(type, context);
  (document.getElementById("campaign-dm-limit") as HTMLInputElement).value = "25";
  (document.getElementById("behavior-skip-author") as HTMLInputElement).checked = true;
  (document.getElementById("behavior-first-level") as HTMLInputElement).checked = false;
}

function renderCampaignOptions() {
  const select = document.getElementById("campaign-picker") as HTMLSelectElement;
  const matching = state.campaigns.filter((campaign) => campaign.type === state.selectedType);
  const options = ['<option value="new">New campaign</option>']
    .concat(
      matching.map((campaign) => (
        `<option value="${campaign.id}">${campaign.name} · ${campaign.status}</option>`
      )),
    )
    .join("");
  select.innerHTML = options;
  select.value = state.selectedCampaignId;
}

function renderHome() {
  const context = state.context;
  const activeCampaigns = state.campaigns.filter((campaign) => campaign.status === "active");
  const totalSent = state.campaigns.reduce((sum, campaign) => sum + campaign.sent_count, 0);
  const activeProgressSource = activeCampaigns[0];
  const dailyLimit = activeProgressSource?.daily_limit ?? 25;
  const sentToday = activeProgressSource?.sent_count ?? 0;
  const progress = Math.min(100, dailyLimit > 0 ? Math.round((sentToday / dailyLimit) * 100) : 0);

  const linkedUsername = state.linkedRedditUsername;

  setText("reddit-account-name", linkedUsername ? `u/${linkedUsername}` : "Reddit account not linked");
  setText(
    "reddit-account-status",
    linkedUsername
      ? "Linked and ready to send"
      : "Open reddit.com/user/yourname then click Link account",
  );
  setText("metric-active-campaigns", String(activeCampaigns.length));
  setText("metric-total-dms", String(totalSent));
  setText("todays-dms-label", `${sentToday}/${dailyLimit}`);
  (document.getElementById("todays-dms-fill") as HTMLDivElement).style.width = `${progress}%`;

  const syncParts = [
    "Extension connected",
    linkedUsername ? `Linked to u/${linkedUsername}` : "Account not linked",
    context.pageType === "other" ? "No target detected" : `${context.pageType} detected`,
  ];
  setText("sync-status-copy", syncParts.join(" · "));

  renderHomeCard(
    "thread",
    context.pageType === "thread",
    context.pageType === "thread"
      ? `r/${context.subredditName ?? "unknown"}`
      : "Open a Reddit post to target commenters in that thread.",
    context.pageType === "thread"
      ? context.postTitle ?? "Current Reddit post"
      : "Target commenters in a Reddit post",
  );

  const hasSubreddit = Boolean(context.subredditName);
  renderHomeCard(
    "subreddit",
    hasSubreddit,
    hasSubreddit
      ? `r/${context.subredditName ?? "unknown"}`
      : "Open a subreddit or a post inside a subreddit to target that community.",
    hasSubreddit
      ? "Will navigate to the subreddit homepage first."
      : "Target users in an entire subreddit",
  );

  renderHomeCard(
    "lead",
    true,
    "Current project leads",
    "Message users from your lead lists",
  );
}

function renderHomeCard(type: CampaignType, enabled: boolean, contextLabel: string, subtitle: string) {
  setText(`${type}-context-label`, contextLabel);
  setText(`${type}-context-subtitle`, subtitle);
  const button = document.getElementById(`start-${type}-campaign`) as HTMLButtonElement;
  button.disabled = !enabled;
}

function renderCampaignTarget() {
  const context = state.context;
  const typeLabel = state.selectedType === "lead"
    ? "List campaign"
    : `${state.selectedType.charAt(0).toUpperCase()}${state.selectedType.slice(1)} campaign`;
  setText("campaign-context-type", typeLabel);

  if (state.selectedType === "thread") {
    setText("campaign-target-title", context.postTitle || "Targeting this Reddit post");
    setText("campaign-target-subline", context.subredditName ? `r/${context.subredditName}` : "Open a Reddit post to continue");
  } else if (state.selectedType === "subreddit") {
    setText("campaign-target-title", context.subredditName ? `r/${context.subredditName}` : "Targeting this subreddit");
    setText("campaign-target-subline", context.subredditName ? "Will navigate to subreddit homepage first" : "Open a subreddit or a post to continue");
  } else {
    setText("campaign-target-title", "Using your lead lists");
    setText("campaign-target-subline", "Messages will use your project lead inbox as source");
  }

  setVisible("thread-settings", state.selectedType === "thread");
  setVisible("subreddit-settings", state.selectedType === "subreddit");
  setVisible("lead-settings", state.selectedType === "lead");
}

async function loadCampaignSelection() {
  renderCampaignOptions();
  renderCampaignTarget();

  const isNew = state.selectedCampaignId === "new";
  const editableIds = ["campaign-name", "campaign-message", "campaign-dm-limit", "behavior-skip-author", "behavior-first-level"];
  editableIds.forEach((id) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.disabled = !isNew;
  });

  if (isNew) {
    applyCampaignDefaults(state.selectedType, state.context);
    setFeedback(null);
    return;
  }

  const storage = await getStorage();
  if (!storage.token) return;

  try {
    const campaign = await getCampaign(storage.token, state.selectedCampaignId);
    (document.getElementById("campaign-name") as HTMLInputElement).value = campaign.name;
    (document.getElementById("campaign-message") as HTMLTextAreaElement).value = campaign.message_template;
    (document.getElementById("campaign-dm-limit") as HTMLInputElement).value = String(campaign.daily_limit);

    const sourceConfig = (campaign.source_config ?? {}) as Record<string, unknown>;
    (document.getElementById("behavior-skip-author") as HTMLInputElement).checked = sourceConfig.skipPostAuthor !== false;
    (document.getElementById("behavior-first-level") as HTMLInputElement).checked = sourceConfig.onlyFirstLevelComments === true;
  } catch {
    setFeedback("Failed to load the selected campaign.", "error");
  }
}

async function refreshCampaigns() {
  const storage = await getStorage();
  if (!storage.token) return;

  state.campaigns = await listCampaigns(storage.token);
  renderHome();
  renderCampaignOptions();
}

async function refreshContext() {
  const context = await getCurrentRedditContext();
  state.context = context;
  renderHome();
  renderCampaignTarget();
}

async function getCurrentRedditContext(): Promise<RedditContext> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https:\/\/(www|old)\.reddit\.com\//.test(tab.url)) {
    return { ...DEFAULT_CONTEXT, url: tab?.url ?? "" };
  }

  try {
    const context = await sendMessageWithFallback(tab.id, { type: "GET_REDDIT_CONTEXT" }) as RedditContext;
    return context ?? { ...DEFAULT_CONTEXT, url: tab.url };
  } catch {
    return { ...DEFAULT_CONTEXT, url: tab.url };
  }
}

async function sendMessageWithFallback(tabId: number, message: unknown): Promise<unknown> {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    if (!(error instanceof Error) || !/Receiving end does not exist/i.test(error.message)) {
      throw error;
    }

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    await new Promise((resolve) => setTimeout(resolve, 150));
    return chrome.tabs.sendMessage(tabId, message);
  }
}

function handleStartFromHome(type: CampaignType) {
  state.selectedType = type;
  state.selectedCampaignId = "new";
  renderCampaignTarget();
  void loadCampaignSelection();
  setView("campaign");
}

function buildSourceConfig(context: RedditContext): Record<string, unknown> {
  if (state.selectedType === "thread") {
    return {
      subreddit: context.subredditName,
      postTitle: context.postTitle,
      skipPostAuthor: (document.getElementById("behavior-skip-author") as HTMLInputElement).checked,
      onlyFirstLevelComments: (document.getElementById("behavior-first-level") as HTMLInputElement).checked,
      skipIfAlreadyDmedProject: true,
    };
  }

  if (state.selectedType === "subreddit") {
    return {
      subreddit: context.subredditName,
      keywords: [],
      minScore: 0,
      skipIfAlreadyDmedProject: true,
    };
  }

  return {
    minIntentScore: 40,
    maxLeads: 100,
    onlyNew: true,
    listSource: "project_leads",
  };
}

async function submitCampaign() {
  setFeedback(null);
  const storage = await getStorage();
  if (!storage.token) return;

  const name = (document.getElementById("campaign-name") as HTMLInputElement).value.trim();
  const messageTemplate = (document.getElementById("campaign-message") as HTMLTextAreaElement).value.trim();
  const dailyLimit = parseInt((document.getElementById("campaign-dm-limit") as HTMLInputElement).value, 10) || 25;

  if (!name) {
    setFeedback("Campaign name is required.", "error");
    return;
  }

  if (!messageTemplate) {
    setFeedback("Campaign message is required.", "error");
    return;
  }

  if (state.selectedType === "thread" && state.context.pageType !== "thread") {
    setFeedback("Open the Reddit post you want to target before starting a thread campaign.", "error");
    return;
  }

  if (state.selectedType === "subreddit" && !state.context.subredditName) {
    setFeedback("Open a subreddit or a Reddit post inside it before starting a subreddit campaign.", "error");
    return;
  }

  const startButton = document.getElementById("campaign-start-btn") as HTMLButtonElement;
  startButton.disabled = true;
  startButton.textContent = "Starting…";

  try {
    const isNewCampaign = state.selectedCampaignId === "new";
    let campaignId = state.selectedCampaignId;

    if (isNewCampaign) {
      const sourceUrl = state.selectedType === "thread"
        ? state.context.postUrl
        : state.selectedType === "subreddit" && state.context.subredditName
          ? `https://www.reddit.com/r/${state.context.subredditName}/`
          : undefined;

      const campaign = await createCampaign(storage.token, {
        name,
        type: state.selectedType,
        sourceUrl,
        sourceConfig: buildSourceConfig(state.context),
        messageTemplate,
        dailyLimit,
        delayMinSec: 30,
        delayMaxSec: 120,
      });
      campaignId = campaign.id;
    }

    if (isNewCampaign && state.selectedType === "thread" && state.context.postUrl) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("Open the target Reddit post and try again.");

      const usernames = await sendMessageWithFallback(tab.id, {
        type: "SCRAPE_THREAD",
        postUrl: state.context.postUrl,
        firstLevelOnly: (document.getElementById("behavior-first-level") as HTMLInputElement).checked,
        skipPostAuthor: (document.getElementById("behavior-skip-author") as HTMLInputElement).checked,
      }) as string[];

      if (!usernames || usernames.length === 0) {
        setFeedback("Campaign created, but no matching commenters were found in that post.", "muted");
      } else {
        await addContactsBatch(storage.token, campaignId, usernames);
      }
    }

    await startCampaign(storage.token, campaignId);
    await setStorage({ activeCampaignId: campaignId });
    state.selectedCampaignId = campaignId;
    await refreshCampaigns();
    await loadCampaignSelection();
    setFeedback("Campaign started.", "success");
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : "Failed to start campaign.", "error");
  } finally {
    startButton.disabled = false;
    startButton.textContent = "Start campaign";
  }
}

async function initApp() {
  const storage = await getStorage();
  if (!storage.token) {
    showConnect();
    return;
  }

  try {
    const status = await getStatus(storage.token);
    const projectName = status.project?.name ?? "Unknown project";
    state.linkedRedditUsername = status.redditAccount?.username ?? storage.linkedRedditUsername ?? null;
    state.linkedRedditVerifiedAt = status.redditAccount?.verifiedAt ?? storage.linkedRedditVerifiedAt ?? null;
    await setStorage({
      projectName,
      linkedRedditUsername: state.linkedRedditUsername,
      linkedRedditVerifiedAt: state.linkedRedditVerifiedAt,
    });
    await bootstrapConnectedState(projectName);
  } catch {
    await clearStorage();
    showConnect();
  }
}

async function bootstrapConnectedState(projectName: string) {
  setText("project-name", projectName);
  showApp();
  setAppError(null);
  renderHome();

  const [campaignsResult, contextResult] = await Promise.allSettled([
    refreshCampaigns(),
    refreshContext(),
  ]);

  if (campaignsResult.status === "rejected") {
    console.error("[ReddProwl panel] campaigns bootstrap failed", campaignsResult.reason);
    state.campaigns = [];
    renderHome();
    renderCampaignOptions();
    setAppError("Could not load campaigns. Check your connection and try again.");
  }

  if (contextResult.status === "rejected") {
    console.error("[ReddProwl panel] context bootstrap failed", contextResult.reason);
    state.context = { ...DEFAULT_CONTEXT };
    renderHome();
    renderCampaignTarget();
    setAppError("Could not detect the current Reddit page. Open a Reddit tab and retry.");
  }

  try {
    startContextPolling();
    await loadCampaignSelection();
  } catch (error) {
    console.error("[ReddProwl panel] selection bootstrap failed", error);
    setAppError("The panel loaded, but campaign details could not be initialized.");
  }
}

function showConnect() {
  setVisible("screen-connect", true);
  setVisible("screen-app", false);
}

function showApp() {
  setVisible("screen-connect", false);
  setVisible("screen-app", true);
  setView("home");
}

function startContextPolling() {
  if (contextPollHandle !== null) return;
  contextPollHandle = window.setInterval(() => {
    void refreshContext();
  }, 8000);
}

document.getElementById("connect-btn")!.addEventListener("click", async () => {
  const tokenInput = document.getElementById("connect-token-input") as HTMLInputElement;
  const labelInput = document.getElementById("connect-label-input") as HTMLInputElement;
  const errorEl = document.getElementById("connect-error") as HTMLDivElement;
  const button = document.getElementById("connect-btn") as HTMLButtonElement;

  errorEl.style.display = "none";
  button.disabled = true;
  button.textContent = "Connecting…";

  try {
    const result = await connect(tokenInput.value.trim(), labelInput.value.trim() || undefined);
    const status = await getStatus(result.token);
    const projectName = status.project?.name ?? "Unknown project";
    state.linkedRedditUsername = status.redditAccount?.username ?? null;
    state.linkedRedditVerifiedAt = status.redditAccount?.verifiedAt ?? null;
    await setStorage({
      token: result.token,
      tokenId: result.tokenId,
      projectId: result.projectId,
      projectName,
      activeCampaignId: null,
      linkedRedditUsername: state.linkedRedditUsername,
      linkedRedditVerifiedAt: state.linkedRedditVerifiedAt,
    });
    await bootstrapConnectedState(projectName);
    applyCampaignDefaults(state.selectedType, state.context);
  } catch (error) {
    errorEl.textContent = error instanceof Error ? error.message : "Connection failed";
    errorEl.style.display = "block";
  } finally {
    button.disabled = false;
    button.textContent = "Connect";
  }
});

document.querySelectorAll<HTMLButtonElement>(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => {
    setView(button.dataset.view as PanelView);
  });
});

document.getElementById("start-thread-campaign")!.addEventListener("click", () => handleStartFromHome("thread"));
document.getElementById("start-subreddit-campaign")!.addEventListener("click", () => handleStartFromHome("subreddit"));
document.getElementById("start-lead-campaign")!.addEventListener("click", () => handleStartFromHome("lead"));

document.getElementById("campaign-picker")!.addEventListener("change", (event) => {
  const target = event.target as HTMLSelectElement;
  state.selectedCampaignId = target.value;
  void loadCampaignSelection();
});

document.getElementById("campaign-start-btn")!.addEventListener("click", () => {
  void submitCampaign();
});

document.getElementById("disconnect-btn")!.addEventListener("click", async () => {
  await clearStorage();
  if (contextPollHandle !== null) {
    window.clearInterval(contextPollHandle);
    contextPollHandle = null;
  }
  showConnect();
});

// ── Background messages ───────────────────────────────────────
chrome.runtime.onMessage.addListener((msg: { type: string; username?: string | null; current?: string | null; linked?: string | null; changed?: boolean }) => {
  if (msg.type === "ACCOUNT_VERIFIED") {
    updateAccountBadge(msg.username ?? null, false);
  } else if (msg.type === "ACCOUNT_NOT_LINKED") {
    updateAccountBadge(msg.username ?? null, false, msg.linked ?? null);
  } else if (msg.type === "ACCOUNT_MISMATCH") {
    updateAccountBadge(msg.current ?? null, true, msg.linked ?? null);
  }
});

function updateAccountBadge(username: string | null, mismatch: boolean, linkedUsername: string | null = null) {
  if (mismatch) {
    state.linkedRedditUsername = linkedUsername ?? state.linkedRedditUsername;
  } else if (username) {
    state.linkedRedditUsername = username;
    state.linkedRedditVerifiedAt = new Date().toISOString();
  } else if (linkedUsername !== null) {
    state.linkedRedditUsername = linkedUsername;
  }
  renderHome();
}

// ── Link Reddit account button ────────────────────────────────
document.getElementById("link-reddit-btn")?.addEventListener("click", async () => {
  const btn = document.getElementById("link-reddit-btn") as HTMLButtonElement | null;
  if (btn) { btn.disabled = true; btn.textContent = "Verifying…"; }

  try {
    const storage = await getStorage();
    if (!storage.token) return;

    // The profile URL is the only reliable identity source — no DOM selector
    // fragility. The user must be on reddit.com/user/{name}/ to link.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const profileMatch = /^https?:\/\/(www|old)\.reddit\.com\/(?:user|u)\/([^/?#]+)/i.exec(tab?.url ?? "");
    if (!profileMatch) {
      setAppError("Open your Reddit profile (reddit.com/user/yourname) then click Link account.");
      return;
    }

    const username = profileMatch[2];
    await syncRedditAccount(storage.token, username);
    const now = new Date().toISOString();
    state.linkedRedditUsername = username;
    state.linkedRedditVerifiedAt = now;
    await setStorage({ linkedRedditUsername: username, linkedRedditVerifiedAt: now });
    renderHome();
    setAppError(null);
  } catch (err) {
    setAppError(err instanceof Error ? err.message : "Failed to link account");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Link current account"; }
  }
});

void initApp();

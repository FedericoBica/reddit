import { getStorage, setStorage, clearStorage } from "./storage";
import { connect, getStatus, listCampaigns, createCampaign, startCampaign, pauseCampaign, addContactsBatch } from "./api";

// ── Screen routing ─────────────────────────────────────────────

function showScreen(id: string) {
  document.querySelectorAll<HTMLElement>(".screen").forEach((s) => s.classList.remove("active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const storage = await getStorage();

  if (!storage.token) {
    showScreen("screen-connect");
    return;
  }

  // Validate token is still good.
  try {
    const status = await getStatus(storage.token);
    const name = status.project?.name ?? "Unknown project";
    await setStorage({ projectName: name });
    document.getElementById("project-name")!.textContent = name;
    showScreen("screen-home");
    await loadHome();
  } catch {
    await clearStorage();
    showScreen("screen-connect");
  }
}

// ── Connect screen ─────────────────────────────────────────────

document.getElementById("connect-btn")!.addEventListener("click", async () => {
  const tokenInput = document.getElementById("connect-token-input") as HTMLInputElement;
  const labelInput = document.getElementById("connect-label-input") as HTMLInputElement;
  const errorEl = document.getElementById("connect-error")!;
  const btn = document.getElementById("connect-btn") as HTMLButtonElement;

  errorEl.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Connecting…";

  try {
    const result = await connect(tokenInput.value.trim(), labelInput.value.trim() || undefined);
    const status = await getStatus(result.token);
    const projectName = status.project?.name ?? "Unknown";

    await setStorage({
      token: result.token,
      tokenId: result.tokenId,
      projectId: result.projectId,
      projectName,
      activeCampaignId: null,
    });

    document.getElementById("project-name")!.textContent = projectName;
    showScreen("screen-home");
    await loadHome();
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : "Connection failed";
    errorEl.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Connect";
  }
});

// ── Home screen ────────────────────────────────────────────────

async function loadHome() {
  const storage = await getStorage();
  if (!storage.token) return;

  updateRunnerStatus(storage.activeCampaignId ?? null);

  const listEl = document.getElementById("campaigns-list")!;
  listEl.innerHTML = '<div class="empty">Loading…</div>';

  try {
    const campaigns = await listCampaigns(storage.token);

    if (campaigns.length === 0) {
      listEl.innerHTML = '<div class="empty">No campaigns yet.</div>';
      return;
    }

    listEl.innerHTML = "";
    for (const c of campaigns) {
      const card = renderCampaignCard(c, storage.activeCampaignId ?? null);
      listEl.appendChild(card);
    }
  } catch {
    listEl.innerHTML = '<div class="empty" style="color:#DC2626;">Failed to load campaigns.</div>';
  }
}

function updateRunnerStatus(activeCampaignId: string | null) {
  const el = document.getElementById("runner-status")!;
  el.innerHTML = activeCampaignId
    ? `Runner: <strong style="color:#16A34A;">active</strong>`
    : `Runner: <strong>idle</strong>`;
}

function renderCampaignCard(
  c: { id: string; name: string; status: string; sent_count: number; reply_count: number },
  activeCampaignId: string | null,
): HTMLElement {
  const div = document.createElement("div");
  div.className = "campaign-card";

  const dotClass = `status-${c.status}`;
  const isActive = c.status === "active";
  const isThisActive = activeCampaignId === c.id;

  div.innerHTML = `
    <div class="campaign-name">
      <span class="status-dot ${dotClass}"></span>${c.name}
    </div>
    <div class="campaign-meta">
      <span>${c.status}</span>
      <span>${c.sent_count} sent</span>
      <span>${c.reply_count} replies</span>
    </div>
    <div style="margin-top: 8px; display: flex; gap: 6px;">
      ${isActive && !isThisActive ? `<button class="btn btn-primary" data-action="run" data-id="${c.id}" style="flex:1; margin-top:0; font-size:11px; padding:6px;">Run this</button>` : ""}
      ${isThisActive ? `<button class="btn btn-secondary" data-action="stop" data-id="${c.id}" style="flex:1; margin-top:0; font-size:11px; padding:6px;">Stop running</button>` : ""}
      ${c.status !== "active" ? `<button class="btn btn-primary" data-action="start" data-id="${c.id}" style="flex:1; margin-top:0; font-size:11px; padding:6px;">Start</button>` : `<button class="btn btn-secondary" data-action="pause" data-id="${c.id}" style="flex:1; margin-top:0; font-size:11px; padding:6px;">Pause</button>`}
    </div>
  `;

  div.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    const id = target.dataset.id;
    if (!action || !id) return;

    const storage = await getStorage();
    if (!storage.token) return;

    if (action === "start") await startCampaign(storage.token, id);
    if (action === "pause") await pauseCampaign(storage.token, id);
    if (action === "run") await setStorage({ activeCampaignId: id });
    if (action === "stop") await setStorage({ activeCampaignId: null });

    await loadHome();
  });

  return div;
}

document.getElementById("new-campaign-btn")!.addEventListener("click", () => {
  showWizardStep(1);
  selectedCampaignType = null;
  showScreen("screen-new-campaign");
});

document.getElementById("back-to-home")!.addEventListener("click", () => {
  showScreen("screen-home");
});

document.getElementById("disconnect-btn")!.addEventListener("click", async () => {
  await clearStorage();
  showScreen("screen-connect");
});

// ── New campaign wizard ────────────────────────────────────────

let selectedCampaignType: string | null = null;

function showWizardStep(step: number) {
  document.querySelectorAll<HTMLElement>(".wizard-step").forEach((s) => s.classList.remove("active"));
  document.getElementById(`wizard-step-${step}`)?.classList.add("active");
}

document.querySelectorAll<HTMLButtonElement>(".campaign-type-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedCampaignType = btn.dataset.type ?? null;

    // Show relevant audience panel.
    (["lead", "thread", "subreddit"] as const).forEach((t) => {
      const el = document.getElementById(`audience-${t}`)!;
      el.style.display = t === selectedCampaignType ? "block" : "none";
    });

    showWizardStep(2);
  });
});

document.getElementById("step2-back")!.addEventListener("click", () => showWizardStep(1));
document.getElementById("step2-next")!.addEventListener("click", () => showWizardStep(3));
document.getElementById("step3-back")!.addEventListener("click", () => showWizardStep(2));

async function submitWizard(startAfter: boolean) {
  const errorEl = document.getElementById("wizard-error")!;
  errorEl.style.display = "none";

  const storage = await getStorage();
  if (!storage.token) return;

  const name = (document.getElementById("campaign-name") as HTMLInputElement).value.trim();
  const messageTemplate = (document.getElementById("message-template") as HTMLTextAreaElement).value;
  const dailyLimit = parseInt((document.getElementById("daily-limit") as HTMLInputElement).value);
  const delayMinSec = parseInt((document.getElementById("delay-min") as HTMLInputElement).value);
  const delayMaxSec = parseInt((document.getElementById("delay-max") as HTMLInputElement).value);

  if (!name) {
    errorEl.textContent = "Campaign name is required";
    errorEl.style.display = "block";
    return;
  }

  let sourceConfig: Record<string, unknown> = {};
  let sourceUrl: string | undefined;

  if (selectedCampaignType === "lead") {
    sourceConfig = {
      minIntentScore: parseInt((document.getElementById("min-intent") as HTMLInputElement).value),
      maxLeads: parseInt((document.getElementById("max-leads") as HTMLInputElement).value),
      onlyNew: (document.getElementById("only-new") as HTMLInputElement).checked,
    };
  } else if (selectedCampaignType === "thread") {
    sourceUrl = (document.getElementById("thread-url") as HTMLInputElement).value.trim();
    sourceConfig = { postUrl: sourceUrl };
  } else if (selectedCampaignType === "subreddit") {
    const sub = (document.getElementById("subreddit-name") as HTMLInputElement).value.trim();
    const keywordsRaw = (document.getElementById("subreddit-keywords") as HTMLInputElement).value.trim();
    const keywords = keywordsRaw
      ? keywordsRaw.split(",").map((k) => k.trim()).filter(Boolean)
      : [];
    const minScore = parseInt((document.getElementById("subreddit-min-score") as HTMLInputElement).value) || 0;
    sourceConfig = { subreddit: sub, keywords, minScore };
  }

  try {
    const campaign = await createCampaign(storage.token, {
      name,
      type: selectedCampaignType,
      sourceUrl,
      sourceConfig,
      messageTemplate,
      dailyLimit,
      delayMinSec,
      delayMaxSec,
    });

    // For thread campaigns, scrape commenters and seed queue immediately.
    if (selectedCampaignType === "thread" && sourceConfig.postUrl) {
      errorEl.textContent = "Scraping thread commenters…";
      errorEl.style.display = "block";
      errorEl.style.color = "#6B7280";
      errorEl.style.background = "#F9FAFB";
      errorEl.style.borderColor = "#E5E7EB";

      try {
        const tabs = await chrome.tabs.query({
          url: ["https://www.reddit.com/*", "https://old.reddit.com/*"],
        });

        if (tabs.length === 0 || !tabs[0].id) {
          errorEl.textContent = "No Reddit tab open — open Reddit then retry the campaign";
        } else {
          const usernames = (await chrome.tabs.sendMessage(tabs[0].id, {
            type: "SCRAPE_THREAD",
            postUrl: sourceConfig.postUrl as string,
          })) as string[];

          if (usernames.length === 0) {
            errorEl.textContent = "No commenters found in that thread";
          } else {
            const result = await addContactsBatch(storage.token, campaign.id, usernames);
            errorEl.textContent = `Seeded ${result.inserted} contacts (${result.skipped} already known)`;
          }
        }
      } catch (scrapeErr) {
        errorEl.textContent =
          scrapeErr instanceof Error ? scrapeErr.message : "Scrape failed — campaign saved as draft";
      }

      await new Promise<void>((r) => setTimeout(r, 1800));
    }

    if (startAfter) {
      await startCampaign(storage.token, campaign.id);
      await setStorage({ activeCampaignId: campaign.id });
    }

    showScreen("screen-home");
    await loadHome();
  } catch (err) {
    errorEl.textContent = err instanceof Error ? err.message : "Failed to create campaign";
    errorEl.style.display = "block";
  }
}

document.getElementById("create-draft-btn")!.addEventListener("click", () => submitWizard(false));
document.getElementById("create-start-btn")!.addEventListener("click", () => submitWizard(true));

// ── Listen for runner ticks from background ────────────────────

chrome.runtime.onMessage.addListener((msg: { type: string }) => {
  if (msg.type === "RUNNER_TICK") {
    getStorage().then((s) => updateRunnerStatus(s.activeCampaignId ?? null));
  }
});

// ── Boot ───────────────────────────────────────────────────────

init();

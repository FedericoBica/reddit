import { clearStorage, getStorage } from "./storage";
import { getStatus } from "./api";

const statusEl = document.getElementById("connection-status");
const projectEl = document.getElementById("project-name");
const errorEl = document.getElementById("popup-error");
const openBtn = document.getElementById("open-sidepanel-btn") as HTMLButtonElement | null;
const refreshBtn = document.getElementById("reload-status-btn") as HTMLButtonElement | null;

function setError(message: string | null) {
  if (!errorEl) return;
  if (!message) {
    errorEl.textContent = "";
    errorEl.style.display = "none";
    return;
  }
  errorEl.textContent = message;
  errorEl.style.display = "block";
}

async function refreshStatus() {
  setError(null);

  const storage = await getStorage();
  if (!storage.token) {
    if (projectEl) projectEl.textContent = "Not connected";
    if (statusEl) statusEl.textContent = "Connect the extension from ReddProwl, then open the side panel.";
    if (openBtn) openBtn.disabled = false;
    return;
  }

  try {
    const status = await getStatus(storage.token);
    const projectName = status.project?.name ?? storage.projectName ?? "Unknown project";
    if (projectEl) projectEl.textContent = projectName;
    if (statusEl) statusEl.textContent = "Connected. Use the side panel to manage campaigns while browsing Reddit.";
  } catch {
    await clearStorage();
    if (projectEl) projectEl.textContent = "Not connected";
    if (statusEl) statusEl.textContent = "Session expired. Reconnect from the side panel.";
    setError("Saved token is no longer valid.");
  }
}

async function openSidePanel() {
  setError(null);
  openBtn?.setAttribute("disabled", "true");

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        path: "sidepanel.html",
        enabled: true,
      });
      await chrome.sidePanel.open({ tabId: tab.id });
    } else if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      throw new Error("No active Chrome window found.");
    }
    window.close();
  } catch (error) {
    setError(error instanceof Error ? error.message : "Failed to open side panel.");
  } finally {
    openBtn?.removeAttribute("disabled");
  }
}

openBtn?.addEventListener("click", () => {
  void openSidePanel();
});

refreshBtn?.addEventListener("click", () => {
  void refreshStatus();
});

void refreshStatus();

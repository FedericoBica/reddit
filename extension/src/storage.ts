export type ExtStorage = {
  token: string;
  tokenId: string;
  projectId: string;
  projectName: string;
  activeCampaignId: string | null;
  linkedRedditUsername: string | null;
  linkedRedditVerifiedAt: string | null;
};

export async function getStorage(): Promise<Partial<ExtStorage>> {
  return chrome.storage.local.get([
    "token",
    "tokenId",
    "projectId",
    "projectName",
    "activeCampaignId",
    "linkedRedditUsername",
    "linkedRedditVerifiedAt",
  ]) as Promise<Partial<ExtStorage>>;
}

export async function setStorage(values: Partial<ExtStorage>): Promise<void> {
  return chrome.storage.local.set(values);
}

export async function clearStorage(): Promise<void> {
  return chrome.storage.local.clear();
}

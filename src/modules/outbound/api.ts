import { createDmCampaignSchema, dmContactStatusSchema } from "../../db/schemas/domain";
import type {
  CreateDmCampaignInput,
  DmCampaignType,
  DmContactStatus,
} from "../../db/schemas/domain";
import type { ExtAuthContext } from "../../lib/ext-auth";

export type ApiResult = {
  status: number;
  body: unknown;
};

type SeededResult = {
  contactsCreated: number;
  queueItemsCreated: number;
};

type QueueResultBody = {
  campaignId?: string;
  success?: boolean;
  errorReason?: string;
};

type CampaignConfig = {
  minIntentScore: number;
  maxLeads: number;
  onlyNew: boolean;
};

export function parseLeadCampaignConfig(sourceConfig: Record<string, unknown>): CampaignConfig {
  return {
    minIntentScore: typeof sourceConfig.minIntentScore === "number" ? sourceConfig.minIntentScore : 40,
    maxLeads: typeof sourceConfig.maxLeads === "number" ? sourceConfig.maxLeads : 100,
    onlyNew: sourceConfig.onlyNew !== false,
  };
}

export function validateQueueResultBody(body: QueueResultBody): {
  ok: true;
  value: { campaignId: string; success: boolean; errorReason?: string };
} | {
  ok: false;
  message: string;
} {
  if (!body.campaignId) return { ok: false, message: "Missing campaignId" };
  if (typeof body.success !== "boolean") return { ok: false, message: "Missing success field" };

  return {
    ok: true,
    value: {
      campaignId: body.campaignId,
      success: body.success,
      errorReason: body.errorReason,
    },
  };
}

export function validateOutcomeStatus(status: unknown): {
  ok: true;
  value: DmContactStatus;
} | {
  ok: false;
  message: string;
} {
  const parsed = dmContactStatusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, message: "Invalid status" };
  return { ok: true, value: parsed.data };
}

export async function handleListCampaigns(
  authHeader: string | null,
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    listCampaigns: (projectId: string) => Promise<unknown[]>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const campaigns = await deps.listCampaigns(auth.projectId);
  return { status: 200, body: { campaigns } };
}

export async function handleCreateCampaign(
  authHeader: string | null,
  body: unknown,
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    createCampaign: (input: CreateDmCampaignInput & { createdBy: string }) => Promise<{ id: string } & Record<string, unknown>>;
    seedLeadCampaignQueue: (input: {
      campaignId: string;
      projectId: string;
      minIntentScore: number;
      maxLeads: number;
      onlyNew: boolean;
    }) => Promise<SeededResult>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const parsed = createDmCampaignSchema.parse({ ...(body as object), projectId: auth.projectId });
  const campaign = await deps.createCampaign({ ...parsed, createdBy: auth.userId });

  let seeded: SeededResult = { contactsCreated: 0, queueItemsCreated: 0 };
  if (parsed.type === "lead") {
    const config = parseLeadCampaignConfig((parsed.sourceConfig ?? {}) as Record<string, unknown>);
    seeded = await deps.seedLeadCampaignQueue({
      campaignId: campaign.id,
      projectId: auth.projectId,
      ...config,
    });
  }

  return { status: 201, body: { campaign, seeded } };
}

export async function handleSetCampaignStatus(
  authHeader: string | null,
  campaignId: string,
  status: Extract<DmCampaignType, never> | "active" | "paused" | "completed" | "failed",
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    setCampaignStatus: (
      campaignId: string,
      projectId: string,
      status: "active" | "paused" | "completed" | "failed",
    ) => Promise<unknown>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const campaign = await deps.setCampaignStatus(campaignId, auth.projectId, status);
  return { status: 200, body: { campaign } };
}

export async function handleGetNextQueueItem(
  authHeader: string | null,
  campaignId: string,
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    getNextQueueItem: (campaignId: string, projectId: string) => Promise<unknown | null>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const item = await deps.getNextQueueItem(campaignId, auth.projectId);
  if (!item) return { status: 200, body: { item: null, reason: "no_pending_items" } };

  return { status: 200, body: { item } };
}

export async function handleRecordQueueResult(
  authHeader: string | null,
  queueItemId: string,
  body: QueueResultBody,
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    recordQueueResult: (input: {
      queueItemId: string;
      campaignId: string;
      projectId: string;
      success: boolean;
      errorReason?: string;
    }) => Promise<boolean>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const validated = validateQueueResultBody(body);
  if (!validated.ok) return { status: 400, body: { error: validated.message } };

  const processed = await deps.recordQueueResult({
    queueItemId,
    campaignId: validated.value.campaignId,
    projectId: auth.projectId,
    success: validated.value.success,
    errorReason: validated.value.errorReason,
  });

  return { status: 200, body: { ok: true, processed } };
}

export async function handleUpdateContactOutcome(
  authHeader: string | null,
  contactId: string,
  body: { status?: unknown },
  deps: {
    resolveAuth: (authHeader: string | null) => Promise<ExtAuthContext | null>;
    updateContactStatus: (input: {
      contactId: string;
      projectId: string;
      status: DmContactStatus;
    }) => Promise<void>;
  },
): Promise<ApiResult> {
  const auth = await deps.resolveAuth(authHeader);
  if (!auth) return { status: 401, body: { error: "Unauthorized" } };

  const validated = validateOutcomeStatus(body.status);
  if (!validated.ok) return { status: 400, body: { error: validated.message } };

  await deps.updateContactStatus({
    contactId,
    projectId: auth.projectId,
    status: validated.value,
  });

  return { status: 200, body: { ok: true } };
}

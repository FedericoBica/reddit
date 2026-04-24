import test from "node:test";
import assert from "node:assert/strict";
import {
  handleCreateCampaign,
  handleGetNextQueueItem,
  handleListCampaigns,
  handleRecordQueueResult,
  handleSetCampaignStatus,
  handleUpdateContactOutcome,
  parseLeadCampaignConfig,
  validateOutcomeStatus,
  validateQueueResultBody,
} from "./api";

const auth = {
  userId: "11111111-1111-4111-8111-111111111111",
  projectId: "22222222-2222-4222-8222-222222222222",
  tokenId: "33333333-3333-4333-8333-333333333333",
};

test("parseLeadCampaignConfig applies outbound defaults", () => {
  assert.deepEqual(parseLeadCampaignConfig({}), {
    minIntentScore: 40,
    maxLeads: 100,
    onlyNew: true,
  });

  assert.deepEqual(parseLeadCampaignConfig({
    minIntentScore: 70,
    maxLeads: 25,
    onlyNew: false,
  }), {
    minIntentScore: 70,
    maxLeads: 25,
    onlyNew: false,
  });
});

test("validateQueueResultBody rejects incomplete payloads", () => {
  assert.deepEqual(validateQueueResultBody({ success: true }), {
    ok: false,
    message: "Missing campaignId",
  });
  assert.deepEqual(validateQueueResultBody({ campaignId: "camp-1" }), {
    ok: false,
    message: "Missing success field",
  });
});

test("validateOutcomeStatus accepts only outbound CRM statuses", () => {
  assert.deepEqual(validateOutcomeStatus("won"), { ok: true, value: "won" });
  assert.deepEqual(validateOutcomeStatus("invalid"), { ok: false, message: "Invalid status" });
});

test("handleListCampaigns returns unauthorized without auth", async () => {
  const result = await handleListCampaigns(null, {
    resolveAuth: async () => null,
    listCampaigns: async () => [],
  });

  assert.equal(result.status, 401);
  assert.deepEqual(result.body, { error: "Unauthorized" });
});

test("handleListCampaigns returns campaigns for the auth project", async () => {
  let receivedProjectId = "";
  const result = await handleListCampaigns("Bearer token", {
    resolveAuth: async () => auth,
    listCampaigns: async (projectId) => {
      receivedProjectId = projectId;
      return [{ id: "campaign-1" }];
    },
  });

  assert.equal(receivedProjectId, auth.projectId);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { campaigns: [{ id: "campaign-1" }] });
});

test("handleCreateCampaign seeds lead campaigns with parsed defaults", async () => {
  let seededInput: Record<string, unknown> | null = null;
  const result = await handleCreateCampaign(
    "Bearer token",
    {
      name: "Lead wave",
      type: "lead",
      sourceUrl: "https://reddit.com/r/test",
      sourceConfig: {},
      messageTemplate: "Hi",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    },
    {
      resolveAuth: async () => auth,
      createCampaign: async (input) => ({ id: "campaign-1", ...input }),
      seedLeadCampaignQueue: async (input) => {
        seededInput = input;
        return { contactsCreated: 12, queueItemsCreated: 12 };
      },
    },
  );

  assert.equal(result.status, 201);
  assert.deepEqual(seededInput, {
    campaignId: "campaign-1",
    projectId: auth.projectId,
    minIntentScore: 40,
    maxLeads: 100,
    onlyNew: true,
  });
  assert.match(JSON.stringify(result.body), /"contactsCreated":12/);
});

test("handleCreateCampaign skips seeding for non-lead campaigns", async () => {
  let called = false;
  const result = await handleCreateCampaign(
    "Bearer token",
    {
      name: "Thread wave",
      type: "thread",
      sourceUrl: "https://reddit.com/r/test/comments/1",
      sourceConfig: {},
      messageTemplate: "Hi",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    },
    {
      resolveAuth: async () => auth,
      createCampaign: async (input) => ({ id: "campaign-2", ...input }),
      seedLeadCampaignQueue: async () => {
        called = true;
        return { contactsCreated: 0, queueItemsCreated: 0 };
      },
    },
  );

  assert.equal(result.status, 201);
  assert.equal(called, false);
  assert.deepEqual(result.body, {
    campaign: {
      id: "campaign-2",
      createdBy: auth.userId,
      dailyLimit: 20,
      delayMaxSec: 60,
      delayMinSec: 30,
      messageTemplate: "Hi",
      name: "Thread wave",
      projectId: auth.projectId,
      sourceConfig: {},
      sourceUrl: "https://reddit.com/r/test/comments/1",
      type: "thread",
    },
    seeded: { contactsCreated: 0, queueItemsCreated: 0 },
  });
});

test("handleSetCampaignStatus forwards auth project and chosen status", async () => {
  let args: unknown[] = [];
  const result = await handleSetCampaignStatus("Bearer token", "campaign-1", "active", {
    resolveAuth: async () => auth,
    setCampaignStatus: async (campaignId, projectId, status) => {
      args = [campaignId, projectId, status];
      return { id: campaignId, status };
    },
  });

  assert.deepEqual(args, ["campaign-1", auth.projectId, "active"]);
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { campaign: { id: "campaign-1", status: "active" } });
});

test("handleGetNextQueueItem returns no_pending_items when queue is empty", async () => {
  const result = await handleGetNextQueueItem("Bearer token", "campaign-1", {
    resolveAuth: async () => auth,
    getNextQueueItem: async () => null,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { item: null, reason: "no_pending_items" });
});

test("handleGetNextQueueItem returns the claimed item when present", async () => {
  const item = { id: "queue-1", interpolatedMessage: "Hi alice" };
  const result = await handleGetNextQueueItem("Bearer token", "campaign-1", {
    resolveAuth: async () => auth,
    getNextQueueItem: async () => item,
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { item });
});

test("handleRecordQueueResult validates body before calling mutation", async () => {
  let called = false;
  const result = await handleRecordQueueResult("Bearer token", "queue-1", { success: true }, {
    resolveAuth: async () => auth,
    recordQueueResult: async () => {
      called = true;
      return true;
    },
  });

  assert.equal(result.status, 400);
  assert.equal(called, false);
  assert.deepEqual(result.body, { error: "Missing campaignId" });
});

test("handleRecordQueueResult forwards auth project and mutation result", async () => {
  let received: Record<string, unknown> | null = null;
  const result = await handleRecordQueueResult(
    "Bearer token",
    "queue-1",
    { campaignId: "campaign-1", success: false, errorReason: "rate limit" },
    {
      resolveAuth: async () => auth,
      recordQueueResult: async (input) => {
        received = input;
        return false;
      },
    },
  );

  assert.deepEqual(received, {
    queueItemId: "queue-1",
    campaignId: "campaign-1",
    projectId: auth.projectId,
    success: false,
    errorReason: "rate limit",
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { ok: true, processed: false });
});

test("handleUpdateContactOutcome rejects invalid statuses", async () => {
  let called = false;
  const result = await handleUpdateContactOutcome(
    "Bearer token",
    "contact-1",
    { status: "not-valid" },
    {
      resolveAuth: async () => auth,
      updateContactStatus: async () => {
        called = true;
      },
    },
  );

  assert.equal(result.status, 400);
  assert.equal(called, false);
  assert.deepEqual(result.body, { error: "Invalid status" });
});

test("handleUpdateContactOutcome updates a valid CRM status inside the auth project", async () => {
  let received: Record<string, unknown> | null = null;
  const result = await handleUpdateContactOutcome(
    "Bearer token",
    "contact-1",
    { status: "won" },
    {
      resolveAuth: async () => auth,
      updateContactStatus: async (input) => {
        received = input;
      },
    },
  );

  assert.equal(result.status, 200);
  assert.deepEqual(received, {
    contactId: "contact-1",
    projectId: auth.projectId,
    status: "won",
  });
  assert.deepEqual(result.body, { ok: true });
});

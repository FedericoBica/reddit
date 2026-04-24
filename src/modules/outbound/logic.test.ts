import test from "node:test";
import assert from "node:assert/strict";
import type { DmCampaignDTO, DmContactDTO } from "@/db/schemas/domain";
import {
  computeCrmStats,
  filterSeedableLeadCandidates,
  formatRelativeTime,
  getOutcomeTransitions,
  interpolateDmMessageTemplate,
} from "./logic";

function createContact(
  overrides: Partial<DmContactDTO>,
): DmContactDTO {
  return {
    id: "contact-id",
    project_id: "00000000-0000-0000-0000-000000000001",
    lead_id: null,
    reddit_username: "alice",
    source_type: "lead",
    first_campaign_id: null,
    last_campaign_id: null,
    status: "queued",
    last_message_at: null,
    last_reply_at: null,
    created_at: "2026-04-24T00:00:00.000Z",
    updated_at: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

function createCampaign(
  overrides: Partial<DmCampaignDTO>,
): DmCampaignDTO {
  return {
    id: "campaign-id",
    project_id: "00000000-0000-0000-0000-000000000001",
    created_by: "00000000-0000-0000-0000-000000000002",
    name: "Campaign",
    type: "lead",
    status: "draft",
    source_url: null,
    source_config: {},
    message_template: "Hi {{username}}",
    daily_limit: 20,
    delay_min_sec: 30,
    delay_max_sec: 120,
    sent_count: 0,
    reply_count: 0,
    failed_count: 0,
    started_at: null,
    completed_at: null,
    created_at: "2026-04-24T00:00:00.000Z",
    updated_at: "2026-04-24T00:00:00.000Z",
    ...overrides,
  };
}

test("filterSeedableLeadCandidates excludes already queued and already contacted usernames", () => {
  const leads = [
    { id: "lead-1", author: "alice" },
    { id: "lead-2", author: "bob" },
    { id: "lead-3", author: "carol" },
    { id: "lead-4", author: null },
  ];
  const existingContacts = [
    { reddit_username: "alice", status: "queued" as const },
    { reddit_username: "bob", status: "sent" as const },
  ];

  const filtered = filterSeedableLeadCandidates(leads, existingContacts);

  assert.deepEqual(filtered, [{ id: "lead-3", author: "carol" }]);
});

test("interpolateDmMessageTemplate replaces supported placeholders", () => {
  const contact = createContact({ reddit_username: "carol" });

  const message = interpolateDmMessageTemplate(
    "Hey {{username}}, saw your post in {{subreddit}}.",
    contact,
  );

  assert.equal(message, "Hey carol, saw your post in .");
});

test("getOutcomeTransitions exposes the CRM progression rules", () => {
  assert.deepEqual(getOutcomeTransitions("queued"), []);
  assert.deepEqual(getOutcomeTransitions("sent"), ["replied", "lost"]);
  assert.deepEqual(getOutcomeTransitions("interested"), ["won", "lost"]);
});

test("computeCrmStats aggregates statuses and response rate across campaigns", () => {
  const contacts = [
    createContact({ status: "queued" }),
    createContact({ id: "contact-2", reddit_username: "bob", status: "sent" }),
    createContact({ id: "contact-3", reddit_username: "carol", status: "won" }),
  ];
  const campaigns = [
    createCampaign({ sent_count: 10, reply_count: 2 }),
    createCampaign({ id: "campaign-2", sent_count: 5, reply_count: 1 }),
  ];

  const stats = computeCrmStats(contacts, campaigns);

  assert.deepEqual(stats.byStatus, {
    queued: 1,
    sent: 1,
    replied: 0,
    interested: 0,
    won: 1,
    lost: 0,
  });
  assert.equal(stats.responseRate, 20);
});

test("formatRelativeTime uses minutes, hours, and days buckets", () => {
  const now = new Date("2026-04-24T12:00:00.000Z").getTime();

  assert.equal(formatRelativeTime("2026-04-24T11:45:00.000Z", now), "15m ago");
  assert.equal(formatRelativeTime("2026-04-24T09:00:00.000Z", now), "3h ago");
  assert.equal(formatRelativeTime("2026-04-21T12:00:00.000Z", now), "3d ago");
});

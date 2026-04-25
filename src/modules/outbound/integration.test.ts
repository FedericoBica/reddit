import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/schemas/database.types";
import {
  createCampaign,
  getNextQueueItem,
  recordQueueResult,
  seedLeadCampaignQueue,
  setCampaignStatus,
} from "@/db/mutations/outbound";

type DbClient = SupabaseClient<Database>;

type Fixture = {
  admin: DbClient;
  userId: string;
  projectId: string;
  email: string;
};

let localSupabaseEnvLoaded = false;

function ensureLocalSupabaseEnv() {
  if (localSupabaseEnvLoaded) return;

  const envFile = path.join(process.cwd(), ".test-dist", "outbound-integration.env");
  const output = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";

  for (const rawLine of output.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("Stopped services:")) continue;

    const match = line.match(/^([A-Z0-9_]+)="?(.*?)"?$/);
    if (!match) continue;

    const [, key, value] = match;
    process.env[key] = value;
  }

  process.env.SUPABASE_SERVICE_ROLE_KEY ??= process.env.SERVICE_ROLE_KEY;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing local Supabase credentials from `supabase status -o env`");
  }

  localSupabaseEnvLoaded = true;
}

function createLocalAdminClient(): DbClient {
  ensureLocalSupabaseEnv();

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

async function createFixture(name: string): Promise<Fixture> {
  const admin = createLocalAdminClient();
  const email = `outbound-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password: "Passw0rd!123",
    email_confirm: true,
    user_metadata: { full_name: `Outbound ${name}` },
  });

  if (createUserError || !createdUser.user) {
    throw new Error(`Failed to create auth user: ${createUserError?.message ?? "missing user"}`);
  }

  const userId = createdUser.user.id;
  const projectId = randomUUID();

  const { error: profileError } = await admin.from("users").upsert({
    id: userId,
    email,
    full_name: `Outbound ${name}`,
  });
  if (profileError) throw new Error(`Failed to ensure user profile: ${profileError.message}`);

  const { error: projectError } = await admin.from("projects").insert({
    id: projectId,
    owner_id: userId,
    name: `Outbound ${name}`,
  });
  if (projectError) throw new Error(`Failed to create project: ${projectError.message}`);

  const { error: memberError } = await admin.from("project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: "owner",
  });
  if (memberError) throw new Error(`Failed to create project membership: ${memberError.message}`);

  return { admin, userId, projectId, email };
}

async function cleanupFixture(fixture: Fixture) {
  const { error: projectError } = await fixture.admin
    .from("projects")
    .delete()
    .eq("id", fixture.projectId);

  if (projectError) {
    throw new Error(`Failed to clean up project ${fixture.projectId}: ${projectError.message}`);
  }

  const { error } = await fixture.admin.auth.admin.deleteUser(fixture.userId);
  if (error) {
    throw new Error(`Failed to clean up auth user ${fixture.email}: ${error.message}`);
  }
}

async function insertLead(
  admin: DbClient,
  projectId: string,
  overrides: Partial<Database["public"]["Tables"]["leads"]["Insert"]>,
) {
  const redditPostId = overrides.reddit_post_id ?? `post-${randomUUID()}`;
  const { data, error } = await admin
    .from("leads")
    .insert({
      project_id: projectId,
      reddit_post_id: redditPostId,
      title: overrides.title ?? `Title ${redditPostId}`,
      subreddit: overrides.subreddit ?? "testing",
      permalink: overrides.permalink ?? `https://reddit.com/${redditPostId}`,
      author: overrides.author ?? "user",
      intent_score: overrides.intent_score ?? 80,
      status: overrides.status ?? "new",
      ...overrides,
    })
    .select("id, author")
    .single();

  if (error || !data) throw new Error(`Failed to insert lead: ${error?.message ?? "missing lead"}`);
  return data;
}

test("outbound integration: seedLeadCampaignQueue only enqueues eligible leads", async () => {
  const fixture = await createFixture("seed");

  try {
    const campaign = await createCampaign({
      projectId: fixture.projectId,
      createdBy: fixture.userId,
      name: "Seed campaign",
      type: "lead",
      sourceUrl: null,
      sourceConfig: {},
      messageTemplate: "Hi {{username}}",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    });

    await insertLead(fixture.admin, fixture.projectId, { author: "alice", intent_score: 95, status: "new" });
    await insertLead(fixture.admin, fixture.projectId, { author: "bob", intent_score: 88, status: "reviewing" });
    await insertLead(fixture.admin, fixture.projectId, { author: "carol", intent_score: 20, status: "new" });
    await insertLead(fixture.admin, fixture.projectId, { author: null, intent_score: 90, status: "new" });
    const daveLead = await insertLead(fixture.admin, fixture.projectId, { author: "dave", intent_score: 92, status: "new" });
    const erinLead = await insertLead(fixture.admin, fixture.projectId, { author: "erin", intent_score: 91, status: "new" });

    const { error: existingContactsError } = await fixture.admin.from("dm_contacts").insert([
      {
        project_id: fixture.projectId,
        lead_id: daveLead.id,
        reddit_username: "dave",
        source_type: "lead",
        first_campaign_id: campaign.id,
        last_campaign_id: campaign.id,
        status: "sent",
      },
      {
        project_id: fixture.projectId,
        lead_id: erinLead.id,
        reddit_username: "erin",
        source_type: "lead",
        first_campaign_id: campaign.id,
        last_campaign_id: campaign.id,
        status: "queued",
      },
    ]);
    if (existingContactsError) throw new Error(existingContactsError.message);

    const seeded = await seedLeadCampaignQueue({
      campaignId: campaign.id,
      projectId: fixture.projectId,
      minIntentScore: 50,
      maxLeads: 10,
      onlyNew: false,
    });

    assert.deepEqual(seeded, { contactsCreated: 2, queueItemsCreated: 2 });

    const { data: contacts, error: contactsError } = await fixture.admin
      .from("dm_contacts")
      .select("reddit_username, status")
      .eq("project_id", fixture.projectId)
      .order("reddit_username", { ascending: true });
    if (contactsError) throw new Error(contactsError.message);

    assert.deepEqual(contacts, [
      { reddit_username: "alice", status: "queued" },
      { reddit_username: "bob", status: "queued" },
      { reddit_username: "dave", status: "sent" },
      { reddit_username: "erin", status: "queued" },
    ]);

    const { data: queueItems, error: queueError } = await fixture.admin
      .from("dm_queue")
      .select("status, dm_contacts!inner(reddit_username)")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: true });
    if (queueError) throw new Error(queueError.message);

    assert.equal(queueItems?.length, 2);
    assert.deepEqual(
      queueItems?.map((item) => ({
        status: item.status,
        reddit_username: (item.dm_contacts as { reddit_username: string }).reddit_username,
      })),
      [
        { status: "pending", reddit_username: "alice" },
        { status: "pending", reddit_username: "bob" },
      ],
    );
  } finally {
    await cleanupFixture(fixture);
  }
});

test("outbound integration: getNextQueueItem claims the highest priority eligible item", async () => {
  const fixture = await createFixture("next-item");

  try {
    const campaign = await createCampaign({
      projectId: fixture.projectId,
      createdBy: fixture.userId,
      name: "Execution campaign",
      type: "lead",
      sourceUrl: null,
      sourceConfig: {},
      messageTemplate: "Hey {{username}} from {{subreddit}}",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    });

    await setCampaignStatus(campaign.id, fixture.projectId, "active");

    const { data: contacts, error: contactsError } = await fixture.admin
      .from("dm_contacts")
      .insert([
        {
          project_id: fixture.projectId,
          reddit_username: "alpha",
          source_type: "lead",
          first_campaign_id: campaign.id,
          last_campaign_id: campaign.id,
          status: "queued",
        },
        {
          project_id: fixture.projectId,
          reddit_username: "bravo",
          source_type: "lead",
          first_campaign_id: campaign.id,
          last_campaign_id: campaign.id,
          status: "queued",
        },
      ])
      .select("id, reddit_username");
    if (contactsError || !contacts) throw new Error(contactsError?.message ?? "missing contacts");

    const alpha = contacts.find((contact) => contact.reddit_username === "alpha");
    const bravo = contacts.find((contact) => contact.reddit_username === "bravo");
    if (!alpha || !bravo) throw new Error("Missing seeded contacts");

    const now = Date.now();
    const { error: queueError } = await fixture.admin.from("dm_queue").insert([
      {
        campaign_id: campaign.id,
        contact_id: alpha.id,
        priority: 0,
        status: "pending",
        scheduled_at: new Date(now - 60_000).toISOString(),
      },
      {
        campaign_id: campaign.id,
        contact_id: bravo.id,
        priority: 10,
        status: "pending",
        scheduled_at: new Date(now - 30_000).toISOString(),
      },
    ]);
    if (queueError) throw new Error(queueError.message);

    const item = await getNextQueueItem(campaign.id, fixture.projectId);

    assert.ok(item);
    assert.equal(item.contact.reddit_username, "bravo");
    assert.equal(item.status, "pending");
    assert.match(item.interpolatedMessage, /bravo/);
    assert.doesNotMatch(item.interpolatedMessage, /\{\{username\}\}|\{\{subreddit\}\}|\{\{post_title\}\}/);

    const { data: claimedRow, error: claimedError } = await fixture.admin
      .from("dm_queue")
      .select("status")
      .eq("id", item.id)
      .single();
    if (claimedError || !claimedRow) throw new Error(claimedError?.message ?? "missing claimed row");

    assert.equal(claimedRow.status, "sending");
  } finally {
    await cleanupFixture(fixture);
  }
});

test("outbound integration: getNextQueueItem respects campaign daily limit", async () => {
  const fixture = await createFixture("daily-limit");

  try {
    const campaign = await createCampaign({
      projectId: fixture.projectId,
      createdBy: fixture.userId,
      name: "Limited campaign",
      type: "lead",
      sourceUrl: null,
      sourceConfig: {},
      messageTemplate: "Hi {{username}}",
      dailyLimit: 1,
      delayMinSec: 30,
      delayMaxSec: 60,
    });

    await setCampaignStatus(campaign.id, fixture.projectId, "active");

    const { data: contact, error: contactError } = await fixture.admin
      .from("dm_contacts")
      .insert({
        project_id: fixture.projectId,
        reddit_username: "limited-user",
        source_type: "lead",
        first_campaign_id: campaign.id,
        last_campaign_id: campaign.id,
        status: "queued",
      })
      .select("id")
      .single();
    if (contactError || !contact) throw new Error(contactError?.message ?? "missing contact");

    const { data: queueItem, error: queueError } = await fixture.admin
      .from("dm_queue")
      .insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        priority: 0,
        status: "pending",
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
      })
      .select("id")
      .single();
    if (queueError || !queueItem) throw new Error(queueError?.message ?? "missing queue item");

    const { error: messageError } = await fixture.admin.from("dm_messages").insert({
      project_id: fixture.projectId,
      campaign_id: campaign.id,
      contact_id: contact.id,
      queue_item_id: queueItem.id,
      direction: "out",
      body: "",
      sent_at: new Date().toISOString(),
    });
    if (messageError) throw new Error(messageError.message);

    const item = await getNextQueueItem(campaign.id, fixture.projectId);
    assert.equal(item, null);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("outbound integration: recordQueueResult success updates message, contact, queue and counters idempotently", async () => {
  const fixture = await createFixture("record-success");

  try {
    const campaign = await createCampaign({
      projectId: fixture.projectId,
      createdBy: fixture.userId,
      name: "Result campaign",
      type: "lead",
      sourceUrl: null,
      sourceConfig: {},
      messageTemplate: "Hi {{username}}",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    });

    const { data: contact, error: contactError } = await fixture.admin
      .from("dm_contacts")
      .insert({
        project_id: fixture.projectId,
        reddit_username: "result-user",
        source_type: "lead",
        first_campaign_id: campaign.id,
        last_campaign_id: campaign.id,
        status: "queued",
      })
      .select("id")
      .single();
    if (contactError || !contact) throw new Error(contactError?.message ?? "missing contact");

    const { data: queueItem, error: queueError } = await fixture.admin
      .from("dm_queue")
      .insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        priority: 0,
        status: "sending",
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
      })
      .select("id")
      .single();
    if (queueError || !queueItem) throw new Error(queueError?.message ?? "missing queue item");

    const first = await recordQueueResult({
      queueItemId: queueItem.id,
      campaignId: campaign.id,
      projectId: fixture.projectId,
      success: true,
    });
    const second = await recordQueueResult({
      queueItemId: queueItem.id,
      campaignId: campaign.id,
      projectId: fixture.projectId,
      success: true,
    });

    assert.equal(first, true);
    assert.equal(second, false);

    const [{ data: queueRow }, { data: contactRow }, { data: messages }, { data: campaignRow }, { data: userRow }] = await Promise.all([
      fixture.admin.from("dm_queue").select("status, sent_at, error_reason").eq("id", queueItem.id).single(),
      fixture.admin.from("dm_contacts").select("status, last_message_at, last_campaign_id").eq("id", contact.id).single(),
      fixture.admin.from("dm_messages").select("id, queue_item_id, direction").eq("queue_item_id", queueItem.id),
      fixture.admin.from("dm_campaigns").select("sent_count").eq("id", campaign.id).single(),
      fixture.admin.from("users").select("dm_monthly_used").eq("id", fixture.userId).single(),
    ]);

    assert.equal(queueRow?.status, "sent");
    assert.ok(queueRow?.sent_at);
    assert.equal(queueRow?.error_reason, null);
    assert.equal(contactRow?.status, "sent");
    assert.ok(contactRow?.last_message_at);
    assert.equal(contactRow?.last_campaign_id, campaign.id);
    assert.equal(messages?.length, 1);
    assert.deepEqual(messages?.[0], {
      id: messages?.[0].id,
      queue_item_id: queueItem.id,
      direction: "out",
    });
    assert.equal(campaignRow?.sent_count, 1);
    assert.equal(userRow?.dm_monthly_used, 1);
  } finally {
    await cleanupFixture(fixture);
  }
});

test("outbound integration: recordQueueResult failure marks queue item failed without side effects", async () => {
  const fixture = await createFixture("record-failure");

  try {
    const campaign = await createCampaign({
      projectId: fixture.projectId,
      createdBy: fixture.userId,
      name: "Failure campaign",
      type: "lead",
      sourceUrl: null,
      sourceConfig: {},
      messageTemplate: "Hi {{username}}",
      dailyLimit: 20,
      delayMinSec: 30,
      delayMaxSec: 60,
    });

    const { data: contact, error: contactError } = await fixture.admin
      .from("dm_contacts")
      .insert({
        project_id: fixture.projectId,
        reddit_username: "failed-user",
        source_type: "lead",
        first_campaign_id: campaign.id,
        last_campaign_id: campaign.id,
        status: "queued",
      })
      .select("id")
      .single();
    if (contactError || !contact) throw new Error(contactError?.message ?? "missing contact");

    const { data: queueItem, error: queueError } = await fixture.admin
      .from("dm_queue")
      .insert({
        campaign_id: campaign.id,
        contact_id: contact.id,
        priority: 0,
        status: "sending",
        scheduled_at: new Date(Date.now() - 60_000).toISOString(),
      })
      .select("id")
      .single();
    if (queueError || !queueItem) throw new Error(queueError?.message ?? "missing queue item");

    const processed = await recordQueueResult({
      queueItemId: queueItem.id,
      campaignId: campaign.id,
      projectId: fixture.projectId,
      success: false,
      errorReason: "rate limit",
    });

    assert.equal(processed, true);

    const [{ data: queueRow }, { data: contactRow }, { data: messages }, { data: campaignRow }, { data: userRow }] = await Promise.all([
      fixture.admin.from("dm_queue").select("status, sent_at, error_reason").eq("id", queueItem.id).single(),
      fixture.admin.from("dm_contacts").select("status, last_message_at").eq("id", contact.id).single(),
      fixture.admin.from("dm_messages").select("id").eq("queue_item_id", queueItem.id),
      fixture.admin.from("dm_campaigns").select("sent_count").eq("id", campaign.id).single(),
      fixture.admin.from("users").select("dm_monthly_used").eq("id", fixture.userId).single(),
    ]);

    assert.equal(queueRow?.status, "failed");
    assert.equal(queueRow?.sent_at, null);
    assert.equal(queueRow?.error_reason, "rate limit");
    assert.equal(contactRow?.status, "queued");
    assert.equal(contactRow?.last_message_at, null);
    assert.equal(messages?.length, 0);
    assert.equal(campaignRow?.sent_count, 0);
    assert.equal(userRow?.dm_monthly_used, 0);
  } finally {
    await cleanupFixture(fixture);
  }
});

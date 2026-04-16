import "server-only";

import webpush, { type PushSubscription } from "web-push";
import { deletePushSubscriptionByEndpoint } from "@/db/mutations/push-subscriptions";
import { getLeadById } from "@/db/queries/leads";
import { getProjectById } from "@/db/queries/projects";
import {
  listPushSubscriptionsForProject,
  type PushSubscriptionDTO,
} from "@/db/queries/push-subscriptions";

type HighIntentLeadPushInput = {
  projectId: string;
  leadId: string;
};

let webPushConfigured = false;

export async function sendHighIntentLeadPush({
  projectId,
  leadId,
}: HighIntentLeadPushInput) {
  configureWebPush();

  const [project, lead, subscriptions] = await Promise.all([
    getProjectById(projectId),
    getLeadById(projectId, leadId),
    listPushSubscriptionsForProject(projectId),
  ]);

  if (!project || !lead || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  const payload = JSON.stringify({
    title: `${project.name}: lead score ${lead.intent_score ?? 0}`,
    body: trimNotificationBody(lead.title),
    url: `${origin}/leads/${lead.id}?projectId=${project.id}`,
    tag: `lead-${lead.id}`,
  });

  const results = await Promise.allSettled(
    subscriptions.map((subscription) => sendPush(subscription, payload)),
  );

  return results.reduce(
    (acc, result) => {
      if (result.status === "fulfilled") {
        acc.sent += 1;
      } else {
        acc.failed += 1;
      }

      return acc;
    },
    { sent: 0, failed: 0 },
  );
}

async function sendPush(subscription: PushSubscriptionDTO, payload: string) {
  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSubscription, payload);
  } catch (error) {
    if (isExpiredSubscriptionError(error)) {
      await deletePushSubscriptionByEndpoint(subscription.endpoint);
    }

    throw error;
  }
}

function configureWebPush() {
  if (webPushConfigured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_SUBJECT ?? "mailto:admin@localhost";

  if (!publicKey || !privateKey) {
    throw new Error("Web Push VAPID keys are not configured");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  webPushConfigured = true;
}

function isExpiredSubscriptionError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error.statusCode === 404 || error.statusCode === 410)
  );
}

function trimNotificationBody(title: string) {
  return title.length > 110 ? `${title.slice(0, 107)}...` : title;
}

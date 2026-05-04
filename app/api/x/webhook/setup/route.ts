import { NextResponse } from "next/server";
import { setupXWebhookStream, listWebhooks } from "@/modules/x/x-webhook-manager";

export const maxDuration = 30;

// Secured with X_CONSUMER_SECRET — only the app operator knows this value.
function isAuthorized(request: Request): boolean {
  const secret = request.headers.get("x-setup-secret");
  const expected = process.env.X_CONSUMER_SECRET;
  return Boolean(expected && secret === expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhooks = await listWebhooks();
  return NextResponse.json({ webhooks });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await setupXWebhookStream();
  return NextResponse.json({ ok: true, ...result });
}

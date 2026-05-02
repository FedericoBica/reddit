import { NextResponse } from "next/server";
import { syncLemonSqueezyBillingWebhook } from "@/modules/billing/lemon-squeezy-sync";
import { verifyLemonSqueezyWebhookSignature } from "@/modules/billing/lemon-squeezy";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  if (!verifyLemonSqueezyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const result = await syncLemonSqueezyBillingWebhook(rawBody);
  return NextResponse.json({ ok: true, ...result });
}

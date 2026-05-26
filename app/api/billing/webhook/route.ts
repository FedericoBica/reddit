import { NextResponse } from "next/server";
import { syncPaddleBillingWebhook } from "@/modules/billing/paddle-sync";
import { verifyPaddleWebhookSignature } from "@/modules/billing/paddle";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature");

  if (!verifyPaddleWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const result = await syncPaddleBillingWebhook(rawBody);
  return NextResponse.json({ ok: true, ...result });
}

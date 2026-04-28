import { NextResponse } from "next/server";
import { buildXCrcResponseToken, processXWebhook, verifyXWebhookSignature } from "@/modules/x/x-webhook-handler";

export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const crcToken = searchParams.get("crc_token");

  if (!crcToken) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({
    response_token: buildXCrcResponseToken(crcToken),
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyXWebhookSignature(rawBody, request.headers)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const result = await processXWebhook(rawBody);
  return NextResponse.json({ ok: true, ...result });
}

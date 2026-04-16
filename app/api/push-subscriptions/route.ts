import { NextResponse, type NextRequest } from "next/server";
import {
  deletePushSubscription,
  savePushSubscription,
} from "@/db/mutations/push-subscriptions";

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    await savePushSubscription(subscription, request.headers.get("user-agent"));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save subscription" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { endpoint?: string };

    if (!body.endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    await deletePushSubscription(body.endpoint);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete subscription" },
      { status: 400 },
    );
  }
}

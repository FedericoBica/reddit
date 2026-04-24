import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, serverError } from "@/lib/ext-auth";
import { recordQueueResult } from "@/db/mutations/outbound";
import { handleRecordQueueResult } from "@/modules/outbound/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: queueItemId } = await params;
    const result = await handleRecordQueueResult(
      request.headers.get("authorization"),
      queueItemId,
      await request.json(),
      {
        resolveAuth: resolveExtToken,
        recordQueueResult,
      },
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

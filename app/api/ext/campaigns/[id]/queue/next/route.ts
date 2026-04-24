import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, serverError } from "@/lib/ext-auth";
import { getNextQueueItem } from "@/db/mutations/outbound";
import { handleGetNextQueueItem } from "@/modules/outbound/api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await handleGetNextQueueItem(
      request.headers.get("authorization"),
      id,
      {
        resolveAuth: resolveExtToken,
        getNextQueueItem,
      },
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

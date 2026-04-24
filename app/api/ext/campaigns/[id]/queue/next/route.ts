import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, unauthorized, serverError } from "@/lib/ext-auth";
import { getNextQueueItem } from "@/db/mutations/outbound";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id } = await params;
    const item = await getNextQueueItem(id, auth.projectId);

    if (!item) {
      return NextResponse.json({ item: null, reason: "no_pending_items" });
    }

    return NextResponse.json({ item });
  } catch (err) {
    return serverError(err);
  }
}

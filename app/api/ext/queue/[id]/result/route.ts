import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, unauthorized, badRequest, serverError } from "@/lib/ext-auth";
import { recordQueueResult } from "@/db/mutations/outbound";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id: queueItemId } = await params;
    const body = (await request.json()) as {
      campaignId?: string;
      success?: boolean;
      errorReason?: string;
    };

    if (!body.campaignId) return badRequest("Missing campaignId");
    if (typeof body.success !== "boolean") return badRequest("Missing success field");

    const processed = await recordQueueResult({
      queueItemId,
      campaignId: body.campaignId,
      projectId: auth.projectId,
      success: body.success,
      errorReason: body.errorReason,
    });

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    return serverError(err);
  }
}

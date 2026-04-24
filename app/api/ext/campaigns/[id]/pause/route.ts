import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, unauthorized, serverError } from "@/lib/ext-auth";
import { setCampaignStatus } from "@/db/mutations/outbound";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) return unauthorized();

    const { id } = await params;
    const campaign = await setCampaignStatus(id, auth.projectId, "paused");
    return NextResponse.json({ campaign });
  } catch (err) {
    return serverError(err);
  }
}

import { NextResponse, type NextRequest } from "next/server";
import { resolveExtToken, serverError } from "@/lib/ext-auth";
import { setCampaignStatus } from "@/db/mutations/outbound";
import { handleSetCampaignStatus } from "@/modules/outbound/api";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const result = await handleSetCampaignStatus(
      request.headers.get("authorization"),
      id,
      "active",
      {
        resolveAuth: resolveExtToken,
        setCampaignStatus,
      },
    );

    return NextResponse.json(result.body, { status: result.status });
  } catch (err) {
    return serverError(err);
  }
}

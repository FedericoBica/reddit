import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveExtToken } from "@/lib/ext-auth";

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveExtToken(request.headers.get("authorization"));
    if (!auth) {
      return NextResponse.json({ error: "Invalid, expired, or unauthorized token" }, { status: 401 });
    }

    const body = (await request.json()) as { username?: string };
    const username = body.username?.trim();
    if (!username || username.length > 30) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const now = new Date().toISOString();

    // Only update reddit_username when unbound or already bound to the same account.
    // This prevents a token holder from overwriting a binding with an arbitrary username.
    const { data: updated, error: updateError } = await supabase
      .from("extension_tokens")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ reddit_username: username, reddit_verified_at: now, last_used_at: now } as any)
      .eq("id", auth.tokenId)
      .or(`reddit_username.is.null,reddit_username.eq.${username}`)
      .select("id")
      .maybeSingle();

    if (updateError) throw new Error(updateError.message);

    if (!updated) {
      return NextResponse.json(
        { error: "Token already bound to a different Reddit account" },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: true, username, verifiedAt: now });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}

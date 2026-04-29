import { type NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/modules/auth/server";
import { resolveCurrentProject } from "@/modules/projects/current";
import {
  exchangeCodeForTokens,
  fetchXUserProfile,
  getXCallbackUrl,
} from "@/modules/x/x-oauth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/x/context?error=${encodeURIComponent(error)}`, request.url),
    );
  }

  const cookieStore = await cookies();
  const savedVerifier = cookieStore.get("x_oauth_verifier")?.value;
  const savedState = cookieStore.get("x_oauth_state")?.value;

  if (!code || !savedVerifier || !savedState || returnedState !== savedState) {
    return NextResponse.redirect(
      new URL("/x/context?error=invalid_state", request.url),
    );
  }

  const projectId = savedState.split(":")[0];

  // Clear PKCE cookies
  cookieStore.delete("x_oauth_verifier");
  cookieStore.delete("x_oauth_state");

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? request.nextUrl.origin;

  try {
    const projectState = await resolveCurrentProject(projectId);
    if (projectState.status === "missing" || projectState.currentProject.id !== projectId) {
      throw new Error("Invalid project for X connection");
    }

    const tokens = await exchangeCodeForTokens({
      code,
      verifier: savedVerifier,
      callbackUrl: getXCallbackUrl(origin),
    });

    const xUser = await fetchXUserProfile(tokens.access_token);

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    const supabase = createSupabaseAdminClient();
    const { error: upsertError } = await supabase.from("x_connected_accounts").upsert(
      {
        project_id: projectId,
        user_id: user.id,
        x_user_id: xUser.id,
        x_username: xUser.username,
        x_name: xUser.name,
        x_profile_image_url: xUser.profile_image_url ?? null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "project_id,x_user_id" },
    );

    if (upsertError) {
      throw new Error(`Failed to persist X connection: ${upsertError.message}`);
    }

    return NextResponse.redirect(
      new URL(`/x/context?projectId=${projectId}&connected=1`, request.url),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Connection failed";
    return NextResponse.redirect(
      new URL(`/x/context?projectId=${projectId}&error=${encodeURIComponent(msg)}`, request.url),
    );
  }
}

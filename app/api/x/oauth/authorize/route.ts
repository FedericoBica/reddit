import { type NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { getCurrentUser } from "@/modules/auth/server";
import {
  generatePKCE,
  buildXAuthUrl,
  getXClientId,
  getXCallbackUrl,
} from "@/modules/x/x-oauth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const projectId = request.nextUrl.searchParams.get("projectId") ?? "";
  if (!projectId) return NextResponse.redirect(new URL("/dashboard", request.url));

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? request.nextUrl.origin;

  const { verifier, challenge } = await generatePKCE();
  const state = `${projectId}:${crypto.randomUUID()}`;

  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 10,
    path: "/",
  };
  cookieStore.set("x_oauth_verifier", verifier, cookieOpts);
  cookieStore.set("x_oauth_state", state, cookieOpts);

  const authUrl = buildXAuthUrl({
    clientId: getXClientId(),
    callbackUrl: getXCallbackUrl(origin),
    challenge,
    state,
  });

  return NextResponse.redirect(authUrl);
}

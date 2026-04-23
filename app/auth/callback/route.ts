import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostAuthPath } from "@/modules/auth/post-auth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeNextPath(url.searchParams.get("next") ?? "/dashboard");
  const oauthError =
    url.searchParams.get("error_description") ??
    url.searchParams.get("error") ??
    null;

  if (oauthError) {
    return NextResponse.redirect(authErrorUrl(url.origin, next, oauthError));
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(await resolvePostAuthPath(next), url.origin));
    }

    return NextResponse.redirect(authErrorUrl(url.origin, next, error.message));
  }

  return NextResponse.redirect(authErrorUrl(url.origin, next, "Invalid auth callback"));
}

function sanitizeNextPath(next: string) {
  if (!next.startsWith("/") || next.startsWith("//") || next === "/") {
    return "/dashboard";
  }

  return next;
}

function authErrorUrl(origin: string, next: string, message: string) {
  const path = next.startsWith("/signup") ? "/signup" : "/login";
  const url = new URL(path, origin);
  url.searchParams.set("error", message);

  if (path === "/login") {
    url.searchParams.set("next", next);
  }

  return url;
}

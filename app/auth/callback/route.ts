import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/db/schemas/database.types";
import { requireEnv } from "@/lib/env";
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
    const { supabase, response } = createSupabaseRouteHandlerClient(request);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return redirectWithCookies(
        new URL(await resolvePostAuthPath(next), url.origin),
        response,
      );
    }

    return redirectWithCookies(authErrorUrl(url.origin, next, error.message), response);
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

function createSupabaseRouteHandlerClient(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return { supabase, response };
}

function redirectWithCookies(
  destination: URL,
  responseWithCookies: NextResponse,
) {
  const redirectResponse = NextResponse.redirect(destination);

  responseWithCookies.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

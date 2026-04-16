import { NextResponse, type NextRequest } from "next/server";
import { listProjectsForCurrentUser } from "@/db/queries/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

async function resolvePostAuthPath(next: string) {
  if (next.startsWith("/signup")) {
    return next;
  }

  const projects = await listProjectsForCurrentUser();

  if (projects.length === 0) {
    return "/signup/company";
  }

  const currentProject = projects[0];

  if (currentProject.onboarding_status !== "completed") {
    return `/onboarding/project?projectId=${currentProject.id}`;
  }

  return next;
}

function sanitizeNextPath(next: string) {
  if (!next.startsWith("/") || next.startsWith("//")) {
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

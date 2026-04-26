import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/ext/")) {
    const origin = request.headers.get("origin") ?? "*";
    if (request.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: { "Access-Control-Allow-Origin": origin, ...CORS_HEADERS },
      });
    }
    const response = await updateSession(request);
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
    return response;
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

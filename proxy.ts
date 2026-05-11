import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { buildExtCorsHeaders } from "@/lib/ext-cors";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/ext/")) {
    const origin = request.headers.get("origin");
    const corsHeaders = buildExtCorsHeaders(origin);

    if (request.method === "OPTIONS") {
      if (!corsHeaders) {
        return new NextResponse(null, { status: 403 });
      }

      return new NextResponse(null, { status: 204, headers: corsHeaders });
    }

    const response = await updateSession(request);
    if (corsHeaders) {
      Object.entries(corsHeaders).forEach(([k, v]) => response.headers.set(k, v));
    }
    return response;
  }

  return updateSession(request);
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

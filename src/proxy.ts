import type { NextRequest } from "next/server";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

// Routes that require a signed-in user. Anything else is public.
const protectedPaths = ["/dashboard", "/profile", "/onboarding"];

function isProtected(pathname: string) {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { user, response } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    return redirectWithSession(request, response, "/login");
  }

  if (user && pathname === "/login") {
    return redirectWithSession(request, response, "/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every request except Next.js internals and static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

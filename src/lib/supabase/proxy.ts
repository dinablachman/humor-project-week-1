import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

// Runs inside src/proxy.ts on every matched request. It refreshes an expired
// access token (writing the new cookies to both the forwarded request and the
// response) and reports whether the request belongs to a signed-in user.
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Responses that set auth cookies must not be cached by a CDN.
        Object.entries(headers).forEach(([key, value]) =>
          response.headers.set(key, value),
        );
      },
    },
  });

  // Do not run other code between createServerClient and getUser. A token
  // refresh happens inside this call and must finish before anything else
  // reads the cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, response };
}

// When the proxy decides to redirect, the redirect response must carry any
// cookies that updateSession just refreshed, or the user gets logged out.
export function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

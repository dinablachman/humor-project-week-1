import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// For use in Server Components, Server Actions, and Route Handlers.
// Create a new client per request; never share one across requests.
export async function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies. That is fine here because
          // src/proxy.ts refreshes the session cookies on every request.
        }
      },
    },
  });
}

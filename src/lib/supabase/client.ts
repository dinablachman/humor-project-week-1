import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

// For use in Client Components. Reads and writes the auth cookies through
// document.cookie, so it shares the session with the server client.
export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

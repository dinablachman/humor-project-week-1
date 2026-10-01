"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Works out the public origin of this deployment so the OAuth redirect lands
// back on the same host (localhost in dev, the Vercel URL in production).
async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;

  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getOrigin();

  // The redirect target must be exactly /auth/callback with no query string.
  // Supabase appends ?code=... itself; the callback route finishes the login.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(
      `/login?error=${encodeURIComponent(error?.message ?? "Could not start Google sign-in.")}`,
    );
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

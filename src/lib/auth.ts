import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Data access layer for auth. Every protected page and Server Action goes
// through these helpers, so the "who is this?" check lives in one place.
// React's cache() dedupes the calls within a single server render.

const getSupabase = cache(createClient);

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, email, first_name, last_name, avatar_url, favorite_movie, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await getSupabase();
  return fetchProfile(supabase, user.id);
});

export function isProfileComplete(profile: Profile | null) {
  return Boolean(profile?.first_name?.trim() && profile?.last_name?.trim());
}

// Redirects to /login when nobody is signed in. src/proxy.ts does the same
// check earlier, but Server Actions and pages must not rely on the proxy alone.
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// For pages that need a finished profile: sends new users to /onboarding.
export async function requireCompleteProfile(): Promise<{
  user: User;
  profile: Profile;
}> {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (!isProfileComplete(profile)) redirect("/onboarding");
  return { user, profile: profile as Profile };
}

// Pulls a display name from the profile, falling back to what Google sent.
export function displayName(profile: Profile | null, user: User | null) {
  const fromProfile = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (fromProfile) return fromProfile;
  const meta = user?.user_metadata ?? {};
  return (
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    user?.email ??
    "there"
  );
}

// Google sends "full_name" (and sometimes given/family names). Used to prefill
// the onboarding form so the user only has to confirm.
export function guessNames(user: User) {
  const meta = user.user_metadata ?? {};
  const given = meta.given_name as string | undefined;
  const family = meta.family_name as string | undefined;
  if (given || family) return { first: given ?? "", last: family ?? "" };

  const full = ((meta.full_name ?? meta.name) as string | undefined)?.trim();
  if (!full) return { first: "", last: "" };
  const [first, ...rest] = full.split(/\s+/);
  return { first, last: rest.join(" ") };
}

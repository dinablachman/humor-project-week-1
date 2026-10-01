"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { fetchProfile, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FieldErrors = Partial<
  Record<"first_name" | "last_name" | "favorite_movie", string>
>;

export type ProfileFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
};

const AVATAR_BUCKET = "avatars";
const MAX_NAME_LENGTH = 60;
const MAX_MOVIE_LENGTH = 120;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function validateNames(first: string, last: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!first) errors.first_name = "First name is required.";
  else if (first.length > MAX_NAME_LENGTH)
    errors.first_name = `Keep it under ${MAX_NAME_LENGTH} characters.`;
  if (!last) errors.last_name = "Last name is required.";
  else if (last.length > MAX_NAME_LENGTH)
    errors.last_name = `Keep it under ${MAX_NAME_LENGTH} characters.`;
  return errors;
}

// Onboarding: first login, names are still null. Saves them and moves on.
export async function completeOnboarding(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const first = readText(formData, "first_name");
  const last = readText(formData, "last_name");
  const errors = validateNames(first, last);
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  const supabase = await createClient();
  // upsert rather than update so a user whose row is somehow missing
  // (created before the trigger existed) still ends up with a profile.
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name: first,
      last_name: last,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  redirect("/dashboard");
}

// Profile page: edit names and the optional extra field.
export async function updateProfile(
  _previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();

  const first = readText(formData, "first_name");
  const last = readText(formData, "last_name");
  const favoriteMovie = readText(formData, "favorite_movie");

  const errors = validateNames(first, last);
  if (favoriteMovie.length > MAX_MOVIE_LENGTH) {
    errors.favorite_movie = `Keep it under ${MAX_MOVIE_LENGTH} characters.`;
  }
  if (Object.keys(errors).length > 0) {
    return { status: "error", errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      first_name: first,
      last_name: last,
      favorite_movie: favoriteMovie || null,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  refresh();
  return { status: "success", message: "Profile saved." };
}

// Turns a public Storage URL from our bucket back into its object path, or
// returns null when the URL points somewhere else (a Google avatar, say).
function storagePathFromUrl(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = url.slice(index + marker.length).split("?")[0];
  return path ? decodeURIComponent(path) : null;
}

export type AvatarResult =
  | { status: "success"; avatarUrl: string | null }
  | { status: "error"; message: string };

// Called by the client after it has uploaded the file straight to Storage.
// The browser never sends image bytes through this server; only the path.
export async function setAvatar(path: string): Promise<AvatarResult> {
  const user = await requireUser();

  // A user may only point their profile at a file inside their own folder.
  if (
    typeof path !== "string" ||
    !path.startsWith(`${user.id}/`) ||
    path.includes("..")
  ) {
    return { status: "error", message: "That file does not belong to you." };
  }

  const supabase = await createClient();
  const previous = await fetchProfile(supabase, user.id);

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  const { error } = await supabase.from("profiles").upsert(
    { id: user.id, email: user.email ?? null, avatar_url: publicUrl },
    { onConflict: "id" },
  );
  if (error) {
    return { status: "error", message: error.message };
  }

  // Tidy up the old file if it lived in our bucket.
  const oldPath = storagePathFromUrl(previous?.avatar_url ?? null);
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  refresh();
  return { status: "success", avatarUrl: publicUrl };
}

export async function removeAvatar(): Promise<AvatarResult> {
  const user = await requireUser();
  const supabase = await createClient();
  const previous = await fetchProfile(supabase, user.id);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) {
    return { status: "error", message: error.message };
  }

  const oldPath = storagePathFromUrl(previous?.avatar_url ?? null);
  if (oldPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  refresh();
  return { status: "success", avatarUrl: null };
}

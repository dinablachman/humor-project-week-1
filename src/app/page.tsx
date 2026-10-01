import Link from "next/link";
import {
  getCurrentProfile,
  getCurrentUser,
  isProfileComplete,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Movie } from "@/lib/types";

export const dynamic = "force-dynamic";

// Gated UI on a public page: the movie list is for everyone, the card at the
// bottom changes with the visitor's sign-in state.
async function MembersCard() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <aside className="mt-12 rounded-xl border border-dashed border-neutral-300 p-6 dark:border-neutral-700">
        <h2 className="text-lg font-medium">Members area</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Sign in with Google to get a profile, upload a photo, and see the
          dashboard.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Sign in
        </Link>
      </aside>
    );
  }

  const profile = await getCurrentProfile();

  if (!isProfileComplete(profile)) {
    return (
      <aside className="mt-12 rounded-xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950">
        <h2 className="text-lg font-medium text-amber-900 dark:text-amber-100">
          Finish setting up your profile
        </h2>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
          We still need your first and last name before the dashboard opens.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-block rounded-lg bg-amber-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
        >
          Add your name
        </Link>
      </aside>
    );
  }

  return (
    <aside className="mt-12 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="text-lg font-medium">
        Welcome back, {profile?.first_name}.
      </h2>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Your dashboard and profile are ready.
      </p>
      <div className="mt-4 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Open dashboard
        </Link>
        <Link
          href="/profile"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Edit profile
        </Link>
      </div>
    </aside>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movies")
    .select("id, title, release_year, director, genre")
    .order("title", { ascending: true });

  const movies = (data ?? []) as Movie[];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        Humor project
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Most famous movies
      </h1>
      <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
        A short list pulled from the movies table in Supabase.
      </p>

      {error ? (
        <p className="mt-10 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Could not load movies. {error.message}
        </p>
      ) : movies.length === 0 ? (
        <p className="mt-10 text-neutral-600 dark:text-neutral-400">
          The movies table is empty.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {movies.map((movie) => (
            <li key={movie.id} className="flex flex-col gap-1 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-lg font-medium">{movie.title}</h2>
                <span className="shrink-0 text-sm text-neutral-500">
                  {movie.release_year}
                </span>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {movie.director}
                <span className="px-2 text-neutral-400">·</span>
                {movie.genre}
              </p>
            </li>
          ))}
        </ul>
      )}

      <MembersCard />
    </main>
  );
}

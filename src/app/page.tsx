import { createSupabaseClient, type Movie } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = createSupabaseClient();
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
    </main>
  );
}

import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { displayName, getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { Avatar } from "@/components/avatar";

const linkStyles =
  "rounded-md px-2 py-1 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100";

// Gated UI: the header changes depending on whether someone is signed in.
export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentProfile() : null;
  const name = displayName(profile, user);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-3">
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="mr-2 text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100"
          >
            Humor project
          </Link>
          <Link href="/" className={linkStyles}>
            Movies
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={linkStyles}>
                Dashboard
              </Link>
              <Link href="/profile" className={linkStyles}>
                Profile
              </Link>
            </>
          ) : null}
        </nav>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full pr-2 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
              title="Edit your profile"
            >
              <Avatar src={profile?.avatar_url} name={name} size={32} />
              <span className="hidden sm:inline">{name}</span>
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}

export function SiteHeaderFallback() {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-3">
        <span className="text-sm font-semibold tracking-tight">
          Humor project
        </span>
        <span className="h-8 w-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </header>
  );
}

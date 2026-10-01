import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { displayName, requireCompleteProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
};

function formatDate(value: string | undefined) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// Members-only route. src/proxy.ts redirects anonymous visitors to /login
// before this renders, and requireCompleteProfile() checks again here.
export default async function DashboardPage() {
  const { user, profile } = await requireCompleteProfile();
  const name = displayName(profile, user);
  const provider = (user.app_metadata?.provider as string | undefined) ?? "email";

  const rows: { label: string; value: string }[] = [
    { label: "Email", value: user.email ?? "Unknown" },
    { label: "Signed in with", value: provider },
    { label: "Member since", value: formatDate(user.created_at) },
    { label: "Last sign-in", value: formatDate(user.last_sign_in_at) },
    {
      label: "Favorite movie",
      value: profile.favorite_movie ?? "Not set yet",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        Members area
      </p>
      <div className="mt-2 flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={name} size={56} />
        <h1 className="text-4xl font-semibold tracking-tight">
          Welcome back, {profile.first_name}.
        </h1>
      </div>
      <p className="mt-3 max-w-xl text-neutral-600 dark:text-neutral-400">
        This page only renders for signed-in users. Visit it in a private
        window and you will land on the sign-in page instead.
      </p>

      <dl className="mt-10 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-baseline justify-between gap-4 py-4"
          >
            <dt className="text-sm text-neutral-500">{row.label}</dt>
            <dd className="text-right text-sm font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/profile"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Edit profile
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Browse movies
        </Link>
      </div>
    </main>
  );
}

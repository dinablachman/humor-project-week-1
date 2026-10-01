import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage(props: PageProps<"/login">) {
  // The proxy already bounces signed-in users away from here; this is the
  // belt to its braces.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { error } = await props.searchParams;
  const errorMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        Humor project
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Use your Google account. The first time you sign in we create a
        profile for you and ask for your name.
      </p>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8">
        <GoogleSignInButton className="w-full" />
      </div>

      <p className="mt-8 text-sm text-neutral-500">
        Just browsing?{" "}
        <Link
          href="/"
          className="underline underline-offset-4 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          Back to the movie list
        </Link>
        .
      </p>
    </main>
  );
}

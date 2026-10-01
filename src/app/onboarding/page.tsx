import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import {
  getCurrentProfile,
  guessNames,
  isProfileComplete,
  requireUser,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Finish your profile",
};

// Shown right after the first login, when first_name / last_name are null.
export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (isProfileComplete(profile)) redirect("/dashboard");

  const guess = guessNames(user);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        One more step
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">
        What should we call you?
      </h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        Your profile does not have a name yet. We filled in what Google told
        us; change anything that is wrong.
      </p>

      <div className="mt-8">
        <OnboardingForm
          defaultFirstName={guess.first}
          defaultLastName={guess.last}
        />
      </div>

      <p className="mt-8 text-xs text-neutral-500">
        Signed in as {user.email}. You can add a photo on the profile page
        afterwards.
      </p>
    </main>
  );
}

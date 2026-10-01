"use client";

import { useActionState } from "react";
import { completeOnboarding, type ProfileFormState } from "@/app/actions/profile";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";

const initialState: ProfileFormState = { status: "idle" };

type Props = {
  defaultFirstName: string;
  defaultLastName: string;
};

export function OnboardingForm({ defaultFirstName, defaultLastName }: Props) {
  const [state, action] = useActionState(completeOnboarding, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="First name"
          name="first_name"
          defaultValue={defaultFirstName}
          autoComplete="given-name"
          required
          maxLength={60}
          error={state.errors?.first_name}
        />
        <FormField
          label="Last name"
          name="last_name"
          defaultValue={defaultLastName}
          autoComplete="family-name"
          required
          maxLength={60}
          error={state.errors?.last_name}
        />
      </div>

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton pendingText="Saving..." className="self-start">
        Save and continue
      </SubmitButton>
    </form>
  );
}

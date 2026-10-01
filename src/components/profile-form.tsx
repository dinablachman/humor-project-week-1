"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/app/actions/profile";
import { FormField } from "@/components/form-field";
import { SubmitButton } from "@/components/submit-button";
import type { Profile } from "@/lib/types";

const initialState: ProfileFormState = { status: "idle" };

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, action] = useActionState(updateProfile, initialState);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          label="First name"
          name="first_name"
          defaultValue={profile?.first_name ?? ""}
          autoComplete="given-name"
          required
          maxLength={60}
          error={state.errors?.first_name}
        />
        <FormField
          label="Last name"
          name="last_name"
          defaultValue={profile?.last_name ?? ""}
          autoComplete="family-name"
          required
          maxLength={60}
          error={state.errors?.last_name}
        />
      </div>

      <FormField
        label="Favorite movie"
        name="favorite_movie"
        defaultValue={profile?.favorite_movie ?? ""}
        placeholder="Optional"
        maxLength={120}
        error={state.errors?.favorite_movie}
        hint="Shown on your dashboard. Leave blank if you cannot pick one."
      />

      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton pendingText="Saving...">Save changes</SubmitButton>
        {state.status === "success" ? (
          <p
            role="status"
            className="text-sm text-green-700 dark:text-green-400"
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}

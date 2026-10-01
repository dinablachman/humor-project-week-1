import type { Metadata } from "next";
import { AvatarUploader } from "@/components/avatar-uploader";
import { ProfileForm } from "@/components/profile-form";
import { displayName, getCurrentProfile, requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Your profile",
};

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const name = displayName(profile, user);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        Profile
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">{name}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        {user.email}
      </p>

      <section className="mt-10 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Photo</h2>
        <div className="mt-4">
          <AvatarUploader
            userId={user.id}
            name={name}
            avatarUrl={profile?.avatar_url ?? null}
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Details</h2>
        <div className="mt-4">
          <ProfileForm profile={profile} />
        </div>
      </section>
    </main>
  );
}

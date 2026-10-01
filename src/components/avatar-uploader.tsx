"use client";

import { useRef, useState, useTransition } from "react";
import { removeAvatar, setAvatar } from "@/app/actions/profile";
import { Avatar } from "@/components/avatar";
import { buttonStyles } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type Props = {
  userId: string;
  name: string;
  avatarUrl: string | null;
};

// Uploads the picture straight from the browser to Supabase Storage (so no
// image bytes pass through the Next.js server), then asks the server to
// record the new URL on the profile.
export function AvatarUploader({ userId, name, avatarUrl }: Props) {
  const [currentUrl, setCurrentUrl] = useState(avatarUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Please choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 5 MB. Please pick a smaller one.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        // Unique file name per upload so browsers never show a stale cached image.
        const path = `${userId}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });

        if (uploadError) {
          setError(uploadError.message);
          setPreview(null);
          return;
        }

        const result = await setAvatar(path);
        if (result.status === "error") {
          setError(result.message);
          setPreview(null);
          return;
        }

        setCurrentUrl(result.avatarUrl);
        setPreview(null);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Upload failed. Try again.",
        );
        setPreview(null);
      } finally {
        URL.revokeObjectURL(objectUrl);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  function handleRemove() {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setCurrentUrl(null);
    });
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar
        src={preview ?? currentUrl}
        name={name}
        size={96}
        className={isPending ? "opacity-60" : ""}
      />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`${buttonStyles.secondary} cursor-pointer ${isPending ? "pointer-events-none opacity-60" : ""}`}
          >
            {isPending ? "Working..." : currentUrl ? "Change photo" : "Upload photo"}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="sr-only"
              disabled={isPending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
          {currentUrl ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-60 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-100"
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="text-xs text-neutral-500">
          JPEG, PNG, WebP, or GIF up to 5 MB. Stored in Supabase Storage; only
          the URL is saved on your profile.
        </p>
        {error ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-400">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

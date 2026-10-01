"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:hover:bg-neutral-900",
};

export function SubmitButton({
  children,
  pendingText,
  variant = "primary",
  className = "",
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`${buttonStyles[variant]} ${className}`}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

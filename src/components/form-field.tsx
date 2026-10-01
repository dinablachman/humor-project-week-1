import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export const inputStyles =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-xs outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-neutral-400 dark:focus:ring-neutral-800";

export function FormField({ label, name, error, hint, ...input }: Props) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`${inputStyles} ${error ? "border-red-400 dark:border-red-700" : ""}`}
        {...input}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

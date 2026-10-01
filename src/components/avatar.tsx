type Props = {
  src: string | null | undefined;
  name: string;
  size?: number;
  className?: string;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ src, name, size = 40, className = "" }: Props) {
  const dimension = { width: size, height: size };

  if (src) {
    // Plain <img>: avatar URLs come from two hosts (Google and Supabase
    // Storage) and are tiny, so next/image optimisation is not worth the
    // remotePatterns configuration.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={dimension}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      aria-label={name}
      role="img"
      style={{ ...dimension, fontSize: Math.max(10, size * 0.38) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 ${className}`}
    >
      {initials(name)}
    </span>
  );
}

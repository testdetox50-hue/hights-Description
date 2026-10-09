"use client";

import { useState } from "react";

type AvatarSize = "sm" | "md" | "lg" | "xl";

type EmployeeAvatarProps = {
  name: string;
  imageUrl?: string;
  size?: AvatarSize;
  className?: string;
};

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl"
};

const GRADIENTS = [
  "from-violet-600 to-fuchsia-600",
  "from-indigo-600 to-violet-600",
  "from-fuchsia-600 to-pink-600",
  "from-sky-600 to-indigo-600",
  "from-emerald-600 to-teal-600",
  "from-amber-600 to-orange-600"
];

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// Stable hash so the same person always gets the same colour.
function pickGradient(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function EmployeeAvatar({ name, imageUrl, size = "md", className = "" }: EmployeeAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(imageUrl) && failedUrl !== imageUrl;
  const base = `${SIZE_CLASSES[size]} shrink-0 overflow-hidden rounded-2xl border border-white/10 ${className}`;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${base} object-cover`}
        onError={() => setFailedUrl(imageUrl ?? null)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={`${base} flex items-center justify-center bg-gradient-to-br ${pickGradient(name)} font-bold text-white shadow-[0_8px_20px_rgba(124,58,237,0.25)]`}
    >
      {getInitials(name)}
    </div>
  );
}

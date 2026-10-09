"use client";

import { useRef } from "react";

export type ProfileSummary = {
  fullName: string;
  email: string;
  role?: string;
  department?: string;
  joinedOn?: string | null;
  avatarUrl?: string | null;
};

type ProfileHeaderProps = {
  profile: ProfileSummary;
  onAvatarSelect?: (file: File) => void;
  onLogout?: () => void;
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function formatTenure(joinedOn: string | null | undefined, now = new Date()): string | null {
  if (!joinedOn) {
    return null;
  }
  const joined = new Date(joinedOn);
  if (Number.isNaN(joined.getTime())) {
    return null;
  }
  let months = (now.getFullYear() - joined.getFullYear()) * 12 + (now.getMonth() - joined.getMonth());
  if (now.getDate() < joined.getDate()) {
    months -= 1;
  }
  if (months < 1) {
    return "Joined this month";
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [years ? `${years} yr` : "", rest ? `${rest} mo` : ""].filter(Boolean);
  return `${parts.join(" ")} with the team`;
}

export default function ProfileHeader({ profile, onAvatarSelect, onLogout }: ProfileHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tenure = formatTenure(profile.joinedOn);

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES) {
      return;
    }
    onAvatarSelect?.(file);
  };

  return (
    <header className="flex flex-wrap items-center gap-5 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-slate-950/60 to-fuchsia-600/10 p-6">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={!onAvatarSelect}
        aria-label="Change profile photo"
        className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/15 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-2xl font-bold text-white disabled:cursor-default"
      >
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt={profile.fullName} className="h-full w-full object-cover" />
        ) : (
          getInitials(profile.fullName)
        )}
        {onAvatarSelect ? (
          <span className="absolute inset-0 hidden items-center justify-center bg-black/55 text-[10px] font-semibold uppercase tracking-widest group-hover:flex">
            Change
          </span>
        ) : null}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-2xl font-bold text-white">{profile.fullName || "Unnamed user"}</h2>
        <p className="truncate text-sm text-slate-300">{profile.email}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
          {[profile.role, profile.department, tenure].filter(Boolean).map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {item}
            </span>
          ))}
        </div>
      </div>

      {onLogout ? (
        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
        >
          Sign out
        </button>
      ) : null}
    </header>
  );
}

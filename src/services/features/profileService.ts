import { api } from "../api/client";
import { TtlCache, str, type RawRow } from "./employeesService";

export type Profile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  joiningDate: string;
  experience: string;
  address: string;
  profileImage: string;
};

export type ProfileUpdate = Partial<Profile>;

export function normalizeProfile(row: RawRow): Profile {
  return {
    name: str(row, "name", "fullName", "full_name"),
    email: str(row, "email").toLowerCase(),
    phone: str(row, "phone", "phoneNumber", "phone_number"),
    role: str(row, "role") || "Employee",
    department: str(row, "department") || "General",
    joiningDate: str(row, "joiningDate", "joining_date"),
    experience: str(row, "experience", "experienceLevel", "experience_level") || "Fresher",
    address: str(row, "address"),
    profileImage: str(row, "profileImage", "profile_image")
  };
}

const cache = new TtlCache<Profile>(60_000);

export function invalidateProfile() {
  cache.clear();
}

export async function getMyProfile(force = false): Promise<Profile> {
  return cache.get(async () => {
    const res = await api<{ data?: RawRow }>("/profile/me");
    return normalizeProfile(res.data ?? {});
  }, force);
}

export function validateProfile(profile: ProfileUpdate): string[] {
  const errors: string[] = [];
  if (profile.name !== undefined && profile.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }
  if (profile.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
    errors.push("Email address is not valid");
  }
  if (profile.phone && !/^[+\d][\d\s-]{6,17}$/.test(profile.phone)) {
    errors.push("Phone number is not valid");
  }
  return errors;
}

/** Merges the changes over the current profile (the API replaces the whole record) and saves. */
export async function updateMyProfile(changes: ProfileUpdate): Promise<Profile> {
  const current = await getMyProfile();
  const next: Profile = { ...current, ...changes };
  const errors = validateProfile(next);
  if (errors.length > 0) {
    throw new Error(errors.join(". "));
  }
  await api<{ message: string }>("/profile/me", { method: "PUT", body: JSON.stringify(next) });
  invalidateProfile();
  return next;
}

export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 8) {
    problems.push("Use at least 8 characters");
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    problems.push("Include both letters and numbers");
  }
  return problems;
}

export async function changePassword(newPassword: string): Promise<string> {
  const problems = passwordProblems(newPassword);
  if (problems.length > 0) {
    throw new Error(problems.join(". "));
  }
  const res = await api<{ message: string }>("/profile/change-password", {
    method: "PATCH",
    body: JSON.stringify({ newPassword })
  });
  return res.message;
}

export function initialsOf(profile: Pick<Profile, "name" | "email">): string {
  const source = profile.name.trim() || profile.email.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2)).toUpperCase();
}

export async function profileCompleteness(): Promise<{ percent: number; missing: Array<keyof Profile> }> {
  const profile = await getMyProfile();
  const required: Array<keyof Profile> = ["name", "email", "phone", "joiningDate", "address", "profileImage"];
  const missing = required.filter((key) => !profile[key]);
  return { percent: Math.round(((required.length - missing.length) / required.length) * 100), missing };
}

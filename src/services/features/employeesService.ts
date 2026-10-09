import { api } from "../api/client";

export type RawRow = Record<string, unknown>;

/** Return the first non-empty value among several candidate keys (camelCase, lowercase, snake_case). */
export function pick(row: RawRow, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

export function str(row: RawRow, ...keys: string[]): string {
  return String(pick(row, ...keys) ?? "").trim();
}

export function num(row: RawRow, ...keys: string[]): number {
  const value = Number(pick(row, ...keys) ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/** Tiny time-based cache so repeated screens do not re-hit the data layer. */
export class TtlCache<T> {
  private value: T | null = null;
  private expiresAt = 0;

  constructor(private readonly ttlMs: number) {}

  async get(loader: () => Promise<T>, force = false): Promise<T> {
    if (!force && this.value !== null && Date.now() < this.expiresAt) {
      return this.value;
    }
    const fresh = await loader();
    this.value = fresh;
    this.expiresAt = Date.now() + this.ttlMs;
    return fresh;
  }

  clear() {
    this.value = null;
    this.expiresAt = 0;
  }
}

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  department: string;
  education: string;
  address: string;
  experienceLevel: string;
  joiningDate: string;
  profileImage: string;
};

export type NewEmployeeInput = Partial<Omit<Employee, "id">> & { fullName: string; email: string };

export function normalizeEmployee(row: RawRow): Employee {
  return {
    id: str(row, "_id", "id", "employeeid", "employee_id"),
    fullName: str(row, "fullName", "fullname", "full_name", "name"),
    email: str(row, "email").toLowerCase(),
    phoneNumber: str(row, "phoneNumber", "phonenumber", "phone_number", "phone"),
    role: str(row, "role"),
    department: str(row, "department") || "General",
    education: str(row, "education"),
    address: str(row, "address"),
    experienceLevel: str(row, "experienceLevel", "experiencelevel", "experience_level") || "Fresher",
    joiningDate: str(row, "joiningDate", "joiningdate", "joining_date"),
    profileImage: str(row, "profileImage", "profileimage", "profile_image")
  };
}

const cache = new TtlCache<Employee[]>(30_000);

export function invalidateEmployees() {
  cache.clear();
}

export async function listEmployees(force = false): Promise<Employee[]> {
  return cache.get(async () => {
    const res = await api<{ items?: RawRow[] }>("/employees");
    return (res.items ?? []).map(normalizeEmployee);
  }, force);
}

export async function getEmployee(idOrEmail: string): Promise<Employee | undefined> {
  const needle = idOrEmail.trim().toLowerCase();
  const all = await listEmployees();
  return all.find((e) => e.id === idOrEmail || e.email === needle);
}

export async function searchEmployees(query: string): Promise<Employee[]> {
  const q = query.trim().toLowerCase();
  const all = await listEmployees();
  if (!q) {
    return all;
  }
  return all.filter((e) => [e.fullName, e.email, e.role, e.department].some((v) => v.toLowerCase().includes(q)));
}

export async function createEmployee(input: NewEmployeeInput): Promise<string> {
  const res = await api<{ message: string }>("/employees", {
    method: "POST",
    body: JSON.stringify(input)
  });
  invalidateEmployees();
  return res.message;
}

export async function deleteEmployee(id: string): Promise<string> {
  const res = await api<{ message: string }>(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" });
  invalidateEmployees();
  return res.message;
}

export async function countEmployeesBy(field: "role" | "department" | "experienceLevel"): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const employee of await listEmployees()) {
    const key = employee[field] || "Unspecified";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

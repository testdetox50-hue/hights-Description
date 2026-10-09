export type ExperienceLevel = "Fresher" | "Junior" | "Mid" | "Senior";

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  department: string;
  education: string;
  address: string;
  experienceLevel: ExperienceLevel;
  joiningDate: string;
  birthDate: string;
  profileImage: string;
};

export type EmployeeErrors = Partial<Record<keyof Employee, string>>;

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

export const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = ["Fresher", "Junior", "Mid", "Senior"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toDateOnly = (value: unknown): string => {
  const date = new Date(str(value) || NaN);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const isExperienceLevel = (value: unknown): value is ExperienceLevel => (EXPERIENCE_LEVELS as readonly string[]).includes(value as string);

export function isEmployee(value: unknown): value is Employee {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.fullName === "string" &&
    typeof record.email === "string" &&
    typeof record.role === "string" &&
    isExperienceLevel(record.experienceLevel)
  );
}

export function normalizeEmployee(raw: Record<string, unknown>): Employee {
  const level = str(firstDefined(raw, ["experienceLevel", "experiencelevel", "experience_level"]), "Fresher");
  return {
    id: str(firstDefined(raw, ["_id", "id", "employeeid", "employee_id"])),
    fullName: str(firstDefined(raw, ["fullName", "fullname", "full_name", "name"])),
    email: str(raw.email).toLowerCase(),
    phoneNumber: str(firstDefined(raw, ["phoneNumber", "phonenumber", "phone_number", "phone"])),
    role: str(raw.role),
    department: str(raw.department, "General"),
    education: str(raw.education),
    address: str(raw.address),
    experienceLevel: isExperienceLevel(level) ? level : "Fresher",
    joiningDate: toDateOnly(firstDefined(raw, ["joiningDate", "joiningdate", "joining_date"])),
    birthDate: toDateOnly(firstDefined(raw, ["birthDate", "birthdate", "birth_date", "dob"])),
    profileImage: str(firstDefined(raw, ["profileImage", "profileimage", "profile_image"]))
  };
}

export function validateEmployeeInput(raw: Record<string, unknown>): EmployeeErrors {
  const employee = normalizeEmployee(raw);
  const errors: EmployeeErrors = {};

  if (employee.fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }
  if (!EMAIL_PATTERN.test(employee.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (employee.phoneNumber && !/^\+?[0-9\s-]{7,15}$/.test(employee.phoneNumber)) {
    errors.phoneNumber = "Phone number must be 7 to 15 digits.";
  }
  if (!employee.role) {
    errors.role = "Role is required.";
  }
  if (!employee.joiningDate) {
    errors.joiningDate = "A valid joining date is required.";
  } else if (new Date(employee.joiningDate).getTime() > Date.now()) {
    errors.joiningDate = "Joining date cannot be in the future.";
  }
  if (str(raw.birthDate ?? raw.birthdate ?? raw.birth_date) && !employee.birthDate) {
    errors.birthDate = "Birth date is not a valid date.";
  }
  return errors;
}

export function getInitials(employee: Pick<Employee, "fullName">): string {
  const parts = employee.fullName.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
}

export function getTenureMonths(employee: Pick<Employee, "joiningDate">, now = new Date()): number {
  if (!employee.joiningDate) {
    return 0;
  }
  const start = new Date(employee.joiningDate);
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

export function hasBirthdayToday(employee: Pick<Employee, "birthDate">, now = new Date()): boolean {
  if (!employee.birthDate) {
    return false;
  }
  const birth = new Date(employee.birthDate);
  return birth.getUTCDate() === now.getDate() && birth.getUTCMonth() === now.getMonth();
}

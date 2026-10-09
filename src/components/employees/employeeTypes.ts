export type ExperienceLevel = "Fresher" | "Experienced";

export type Employee = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  education: string;
  address: string;
  experienceLevel: ExperienceLevel;
  joiningDate: string;
  profileImage: string;
};

export type EmployeeFilterState = {
  search: string;
  role: string;
  experience: ExperienceLevel | "All";
};

export type SortKey = "name" | "role" | "joining";

export const EMPTY_FILTERS: EmployeeFilterState = {
  search: "",
  role: "All",
  experience: "All"
};

type RawRecord = Record<string, unknown>;

function pickString(raw: RawRecord, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

export function normalizeEmployee(raw: RawRecord): Employee {
  const experience = pickString(raw, ["experienceLevel", "experiencelevel", "experience_level"]);
  const email = pickString(raw, ["email"]);

  return {
    id: pickString(raw, ["_id", "id", "employeeId", "employee_id"]) || email,
    fullName: pickString(raw, ["fullName", "fullname", "full_name", "name"]) || "Unnamed",
    email,
    phoneNumber: pickString(raw, ["phoneNumber", "phonenumber", "phone_number", "phone"]),
    role: pickString(raw, ["role"]) || "Unassigned",
    education: pickString(raw, ["education"]),
    address: pickString(raw, ["address"]),
    experienceLevel: /^exp/i.test(experience) ? "Experienced" : "Fresher",
    joiningDate: pickString(raw, ["joiningDate", "joiningdate", "joining_date"]),
    profileImage: pickString(raw, ["profileImage", "profileimage", "profile_image"])
  };
}

export function normalizeEmployees(items: unknown): Employee[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .filter((item): item is RawRecord => typeof item === "object" && item !== null)
    .map(normalizeEmployee);
}

export function getUniqueRoles(employees: Employee[]): string[] {
  return Array.from(new Set(employees.map((employee) => employee.role))).sort((a, b) => a.localeCompare(b));
}

export function filterEmployees(employees: Employee[], filters: EmployeeFilterState): Employee[] {
  const query = filters.search.trim().toLowerCase();

  return employees.filter((employee) => {
    if (filters.role !== "All" && employee.role !== filters.role) {
      return false;
    }
    if (filters.experience !== "All" && employee.experienceLevel !== filters.experience) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [employee.fullName, employee.email, employee.role, employee.phoneNumber].some((field) =>
      field.toLowerCase().includes(query)
    );
  });
}

export function sortEmployees(employees: Employee[], key: SortKey): Employee[] {
  const copy = [...employees];

  copy.sort((a, b) => {
    if (key === "role") {
      return a.role.localeCompare(b.role) || a.fullName.localeCompare(b.fullName);
    }
    if (key === "joining") {
      return (Date.parse(b.joiningDate) || 0) - (Date.parse(a.joiningDate) || 0);
    }
    return a.fullName.localeCompare(b.fullName);
  });

  return copy;
}

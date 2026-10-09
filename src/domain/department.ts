export type Department = {
  id: string;
  name: string;
  code: string;
  headName: string;
  description: string;
  parentId: string;
  active: boolean;
};

export type DepartmentErrors = Partial<Record<keyof Department, string>>;

export type DepartmentNode = Department & { children: DepartmentNode[]; depth: number };

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  const text = str(value).toLowerCase();
  return ["true", "1", "yes", "active"].includes(text) ? true : ["false", "0", "no", "inactive"].includes(text) ? false : fallback;
};

export function makeDepartmentCode(name: string): string {
  const words = name.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  if (words.length === 0) {
    return "";
  }
  return words.length === 1 ? words[0].slice(0, 4) : words.map((word) => word[0]).join("").slice(0, 4);
}

export function isDepartment(value: unknown): value is Department {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.code === "string" &&
    typeof record.active === "boolean"
  );
}

export function normalizeDepartment(raw: Record<string, unknown>): Department {
  const name = str(firstDefined(raw, ["name", "departmentName", "departmentname", "department_name", "department"]));
  return {
    id: str(firstDefined(raw, ["_id", "id", "departmentid", "department_id"])),
    name,
    code: str(raw.code).toUpperCase() || makeDepartmentCode(name),
    headName: str(firstDefined(raw, ["headName", "headname", "head_name", "head"])),
    description: str(raw.description),
    parentId: str(firstDefined(raw, ["parentId", "parentid", "parent_id"])),
    active: toBool(firstDefined(raw, ["active", "isActive", "isactive", "is_active"]), true)
  };
}

export function validateDepartmentInput(raw: Record<string, unknown>, existing: Department[] = []): DepartmentErrors {
  const department = normalizeDepartment(raw);
  const errors: DepartmentErrors = {};
  const others = existing.filter((item) => item.id !== department.id);

  if (department.name.length < 2) {
    errors.name = "Department name must be at least 2 characters.";
  } else if (others.some((item) => item.name.toLowerCase() === department.name.toLowerCase())) {
    errors.name = "A department with this name already exists.";
  }
  if (!/^[A-Z0-9]{2,6}$/.test(department.code)) {
    errors.code = "Code must be 2 to 6 letters or digits.";
  } else if (others.some((item) => item.code === department.code)) {
    errors.code = "This code is already used.";
  }
  if (department.parentId && department.parentId === department.id) {
    errors.parentId = "A department cannot be its own parent.";
  } else if (department.parentId && existing.length > 0 && !existing.some((item) => item.id === department.parentId)) {
    errors.parentId = "Parent department was not found.";
  }
  return errors;
}

export function buildDepartmentTree(departments: Department[]): DepartmentNode[] {
  const nodes = new Map<string, DepartmentNode>();
  for (const department of departments) {
    nodes.set(department.id, { ...department, children: [], depth: 0 });
  }
  const roots: DepartmentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const assignDepth = (list: DepartmentNode[], depth: number) => {
    for (const node of list) {
      node.depth = depth;
      assignDepth(node.children, depth + 1);
    }
  };
  assignDepth(roots, 0);
  return roots;
}

export function flattenDepartmentTree(roots: DepartmentNode[]): DepartmentNode[] {
  return roots.flatMap((node) => [node, ...flattenDepartmentTree(node.children)]);
}

export function countEmployeesByDepartment(employees: Array<{ department?: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const employee of employees) {
    const key = str(employee.department, "General");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

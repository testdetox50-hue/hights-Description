export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Cancelled";

export type Project = {
  id: string;
  projectName: string;
  status: ProjectStatus;
  role: string;
  developerName: string;
  techStack: string;
};

export type ProjectErrors = Partial<Record<keyof Project, string>>;

export const PROJECT_STATUSES: readonly ProjectStatus[] = ["Active", "On Hold", "Completed", "Cancelled"];

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

export const isProjectStatus = (value: unknown): value is ProjectStatus => (PROJECT_STATUSES as readonly string[]).includes(value as string);

export function isProject(value: unknown): value is Project {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.projectName === "string" &&
    typeof record.developerName === "string" &&
    typeof record.techStack === "string" &&
    isProjectStatus(record.status)
  );
}

export function normalizeProject(raw: Record<string, unknown>): Project {
  const status = str(firstDefined(raw, ["status", "projectStatus"]), "Active");
  return {
    id: str(firstDefined(raw, ["_id", "id", "projectid", "project_id"])),
    projectName: str(firstDefined(raw, ["projectName", "projectname", "project_name", "name"])),
    status: isProjectStatus(status) ? status : "Active",
    role: str(firstDefined(raw, ["role", "projectRole"])),
    developerName: str(firstDefined(raw, ["developerName", "developername", "developer_name", "developer"])),
    techStack: str(firstDefined(raw, ["techStack", "techstack", "tech_stack", "stack"]))
  };
}

export function parseTechStack(stack: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of stack.split(/[,;/|]+/)) {
    const tech = part.trim();
    const key = tech.toLowerCase();
    if (tech && !seen.has(key)) {
      seen.add(key);
      result.push(tech);
    }
  }
  return result;
}

export function validateProjectInput(raw: Record<string, unknown>): ProjectErrors {
  const project = normalizeProject(raw);
  const errors: ProjectErrors = {};

  if (project.projectName.length < 2) {
    errors.projectName = "Project name must be at least 2 characters.";
  } else if (project.projectName.length > 80) {
    errors.projectName = "Project name must be 80 characters or fewer.";
  }
  const rawStatus = str(firstDefined(raw, ["status", "projectStatus"]));
  if (rawStatus && !isProjectStatus(rawStatus)) {
    errors.status = `Status must be one of: ${PROJECT_STATUSES.join(", ")}.`;
  }
  if (!project.developerName) {
    errors.developerName = "Developer name is required.";
  }
  if (parseTechStack(project.techStack).length === 0) {
    errors.techStack = "List at least one technology.";
  }
  return errors;
}

export function isProjectOpen(project: Pick<Project, "status">): boolean {
  return project.status === "Active" || project.status === "On Hold";
}

export function countByStatus(projects: Project[]): Record<ProjectStatus, number> {
  const counts: Record<ProjectStatus, number> = { Active: 0, "On Hold": 0, Completed: 0, Cancelled: 0 };
  for (const project of projects) {
    counts[project.status] += 1;
  }
  return counts;
}

export function searchProjects(projects: Project[], query: string): Project[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return projects;
  }
  return projects.filter((project) =>
    [project.projectName, project.developerName, project.role, project.techStack].some((field) =>
      field.toLowerCase().includes(needle)
    )
  );
}

export function projectsByDeveloper(projects: Project[]): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const key = project.developerName || "Unassigned";
    groups.set(key, [...(groups.get(key) ?? []), project]);
  }
  return groups;
}

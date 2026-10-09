import { api } from "../api/client";
import { TtlCache, str, type RawRow } from "./employeesService";

export type ProjectStatus = "Active" | "On Hold" | "Completed" | string;

export type Project = {
  id: string;
  projectName: string;
  status: ProjectStatus;
  role: string;
  developerName: string;
  techStack: string;
  techList: string[];
};

export type NewProjectInput = {
  projectName: string;
  status?: ProjectStatus;
  role?: string;
  developerName?: string;
  techStack?: string;
};

export function normalizeProject(row: RawRow): Project {
  const techStack = str(row, "techStack", "techstack", "tech_stack", "stack");
  return {
    id: str(row, "_id", "id", "projectid", "project_id"),
    projectName: str(row, "projectName", "projectname", "project_name", "name"),
    status: str(row, "status", "projectStatus") || "Active",
    role: str(row, "role", "projectRole"),
    developerName: str(row, "developerName", "developername", "developer_name", "developer"),
    techStack,
    techList: techStack
      .split(/[,/|]/)
      .map((t) => t.trim())
      .filter(Boolean)
  };
}

const cache = new TtlCache<Project[]>(30_000);

export function invalidateProjects() {
  cache.clear();
}

export async function listProjects(force = false): Promise<Project[]> {
  return cache.get(async () => {
    const res = await api<{ data?: RawRow[] }>("/projects");
    return (res.data ?? []).map(normalizeProject);
  }, force);
}

export async function listProjectsByStatus(status: ProjectStatus): Promise<Project[]> {
  const wanted = status.toLowerCase();
  return (await listProjects()).filter((p) => p.status.toLowerCase() === wanted);
}

export async function listProjectsForDeveloper(name: string): Promise<Project[]> {
  const wanted = name.trim().toLowerCase();
  return (await listProjects()).filter((p) => p.developerName.toLowerCase() === wanted);
}

export async function addProject(input: NewProjectInput): Promise<string> {
  if (!input.projectName.trim()) {
    throw new Error("Project name is required");
  }
  const res = await api<{ message: string }>("/projects/add", {
    method: "POST",
    body: JSON.stringify({ status: "Active", ...input })
  });
  invalidateProjects();
  return res.message;
}

/** Deletes by id when available, otherwise falls back to name-based deletion. */
export async function removeProject(project: Pick<Project, "id" | "projectName">): Promise<string> {
  const res = project.id
    ? await api<{ message: string }>(`/projects/${encodeURIComponent(project.id)}`, { method: "DELETE" })
    : await api<{ message: string }>("/projects/delete", {
        method: "POST",
        body: JSON.stringify({ projectName: project.projectName })
      });
  invalidateProjects();
  return res.message;
}

export async function projectStatusCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const project of await listProjects()) {
    counts[project.status] = (counts[project.status] ?? 0) + 1;
  }
  return counts;
}

export async function techStackUsage(): Promise<Array<{ tech: string; projects: number }>> {
  const usage = new Map<string, { label: string; projects: number }>();
  for (const project of await listProjects()) {
    for (const tech of new Set(project.techList.map((t) => t.toLowerCase()))) {
      const label = project.techList.find((t) => t.toLowerCase() === tech) ?? tech;
      const entry = usage.get(tech) ?? { label, projects: 0 };
      entry.projects += 1;
      usage.set(tech, entry);
    }
  }
  return [...usage.values()]
    .map(({ label, projects }) => ({ tech: label, projects }))
    .sort((a, b) => b.projects - a.projects || a.tech.localeCompare(b.tech));
}

"use client";

import { useMemo, useState } from "react";

import ProjectCard, { type WorkspaceProject } from "./ProjectCard";
import ProjectStatusBadge, { PROJECT_STATUSES, type ProjectStatus } from "./ProjectStatusBadge";
import { parseTechStack } from "./TechStackChips";

type ProjectBoardProps = {
  projects: WorkspaceProject[];
  onDelete?: (project: WorkspaceProject) => void | Promise<void>;
  onStatusChange?: (project: WorkspaceProject, status: ProjectStatus) => void;
  emptyMessage?: string;
};

function matchesQuery(project: WorkspaceProject, query: string): boolean {
  if (!query) {
    return true;
  }
  const haystack = [
    project.projectName,
    project.developerName,
    project.role,
    ...parseTechStack(project.techStack)
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function ProjectBoard({
  projects,
  onDelete,
  onStatusChange,
  emptyMessage = "No projects here yet."
}: ProjectBoardProps) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const columns = useMemo(() => {
    const grouped: Record<ProjectStatus, WorkspaceProject[]> = { Active: [], Completed: [] };
    for (const project of projects) {
      if (matchesQuery(project, normalized)) {
        (grouped[project.status] ?? grouped.Active).push(project);
      }
    }
    for (const status of PROJECT_STATUSES) {
      grouped[status].sort((left, right) => left.projectName.localeCompare(right.projectName));
    }
    return grouped;
  }, [projects, normalized]);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search project, developer, role or tech..."
          aria-label="Search projects"
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
        />
        <span className="text-sm text-slate-400">{projects.length} total</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {PROJECT_STATUSES.map((status) => {
          const items = columns[status];
          return (
            <div key={status} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-4 flex items-center justify-between">
                <ProjectStatusBadge status={status} verbose count={items.length} />
              </div>
              <div className="space-y-4">
                {items.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-500">
                    {normalized ? "No matches." : emptyMessage}
                  </p>
                ) : (
                  items.map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onTechSelect={setQuery}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

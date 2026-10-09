"use client";

import { useState } from "react";

import ProjectStatusBadge, { type ProjectStatus } from "./ProjectStatusBadge";
import TechStackChips from "./TechStackChips";

export type WorkspaceProject = {
  _id: string;
  projectName: string;
  status: ProjectStatus;
  role: string;
  developerName: string;
  techStack: string;
};

type ProjectCardProps = {
  project: WorkspaceProject;
  onDelete?: (project: WorkspaceProject) => void | Promise<void>;
  onStatusChange?: (project: WorkspaceProject, status: ProjectStatus) => void;
  onTechSelect?: (tech: string) => void;
  compact?: boolean;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ProjectCard({
  project,
  onDelete,
  onStatusChange,
  onTechSelect,
  compact = false
}: ProjectCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const nextStatus: ProjectStatus = project.status === "Active" ? "Completed" : "Active";

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }
    setBusy(true);
    try {
      await onDelete(project);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-violet-400/30">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white" title={project.projectName}>
            {project.projectName}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{project.role || "Unassigned role"}</p>
        </div>
        <ProjectStatusBadge status={project.status} size="sm" />
      </header>

      {compact ? null : (
        <div className="mt-4">
          <TechStackChips stack={project.techStack} onSelect={onTechSelect} />
        </div>
      )}

      <footer className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-xs font-bold text-white">
            {getInitials(project.developerName)}
          </span>
          <span className="truncate text-sm text-slate-300">{project.developerName || "Unassigned"}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onStatusChange ? (
            <button
              type="button"
              onClick={() => onStatusChange(project, nextStatus)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Mark {nextStatus.toLowerCase()}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => (confirming ? void handleDelete() : setConfirming(true))}
              onBlur={() => setConfirming(false)}
              className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {busy ? "Deleting..." : confirming ? "Confirm?" : "Delete"}
            </button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProjectDTO } from "@/db/schemas/domain";
import {
  canCreateProject,
  formatProjectUsage,
  type ProjectLimit,
} from "@/modules/billing/limits";

export function ProjectSwitcher({
  projects,
  currentProject,
  billingLimit,
}: {
  projects: ProjectDTO[];
  currentProject: ProjectDTO;
  billingLimit: ProjectLimit;
}) {
  const [open, setOpen] = useState(false);
  const limit = billingLimit;
  const canCreate = canCreateProject(projects.length, limit);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 12,
          fontWeight: 800,
          color: "#1C1C1E",
          padding: "8px 10px",
          background: "#FFFFFF",
          borderRadius: 8,
          border: "1px solid #EEEEED",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "#E07000",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentProject.name}
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: "#FFFFFF",
            border: "1px solid #EEEEED",
            borderRadius: 8,
            boxShadow: "0 16px 42px rgba(0,0,0,0.12)",
            padding: 6,
          }}
        >
          <div
            style={{
              padding: "7px 8px 9px",
              borderBottom: "1px solid #F0F0EE",
              marginBottom: 4,
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 800, color: "#1C1C1E" }}>
              {limit.label}
            </p>
            <p style={{ fontSize: 11, color: "#8E8E93", marginTop: 2 }}>
              {formatProjectUsage(projects.length, limit)}
            </p>
          </div>

          {projects.map((project) => {
            const active = project.id === currentProject.id;

            return (
              <Link
                key={project.id}
                href={`/dashboard?projectId=${project.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="project-menu-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 9px",
                  borderRadius: 7,
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  color: active ? "#1C1C1E" : "#6B6B6E",
                  background: active ? "#FFF3E8" : "transparent",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: active ? "#E07000" : "#D1D1CF",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    minWidth: 0,
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {project.name}
                </span>
              </Link>
            );
          })}

          {canCreate ? (
            <Link
              href={`/projects/new?projectId=${currentProject.id}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="project-menu-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 9px",
                borderRadius: 7,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 800,
                color: "#E07000",
                marginTop: 4,
                borderTop: "1px solid #F0F0EE",
              }}
            >
              <PlusIcon />
              Nuevo proyecto
            </Link>
          ) : (
            <div
              style={{
                padding: "8px 9px",
                marginTop: 4,
                borderTop: "1px solid #F0F0EE",
                color: "#8E8E93",
                fontSize: 11,
                lineHeight: 1.4,
              }}
            >
              Llegaste al límite de proyectos de {limit.label}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }}
    >
      <path d="M3.5 5.25 7 8.75l3.5-3.5" stroke="#8E8E93" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { ProjectDTO } from "@/db/schemas/domain";
import { switchProjectAction } from "@/modules/projects/actions";

export function ProjectSwitcher({
  currentProject,
  projects,
}: {
  currentProject: ProjectDTO;
  projects: ProjectDTO[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          background: open ? "#EDEEF0" : "#F6F7F8",
          borderRadius: 8,
          border: "1px solid #DAE0E6",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #FF4500, #FFB000)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
            border: "2px solid #FFFFFF",
            boxShadow: "0 0 0 1px #DAE0E6",
          }}
        >
          {currentProject.name?.[0]?.toUpperCase() ?? "?"}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#1A1A1B" }}>
            {currentProject.name}
          </div>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ flexShrink: 0, opacity: 0.4, transition: "transform 150ms", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M2 4.5L6 7.5L10 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: 10,
            boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {projects.length > 0 && (
            <div style={{ padding: "4px 0" }}>
              {projects.map((project) => {
                const isCurrent = project.id === currentProject.id;
                return (
                  <form key={project.id} action={switchProjectAction} onSubmit={() => setOpen(false)}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <button
                      type="submit"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        background: isCurrent ? "#FFF3EC" : "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #FF4500, #FFB000)",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 9,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {project.name?.[0]?.toUpperCase() ?? "?"}
                      </span>
                      <span style={{ flex: 1, fontSize: 12, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? "#FF4500" : "#1A1A1B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {project.name}
                      </span>
                      {isCurrent && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                          <path d="M2 6l3 3 5-5" stroke="#FF4500" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </form>
                );
              })}
            </div>
          )}

          <div style={{ borderTop: "1px solid #F0F0F0" }} />

          <div style={{ padding: "4px 0" }}>
            <Link
              href="/projects/new"
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 10px",
                fontSize: 12,
                fontWeight: 600,
                color: "#4B5563",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "#F3F4F6",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 1v8M1 5h8" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              New project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

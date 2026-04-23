import type { ProjectDTO } from "@/db/schemas/domain";

export function ProjectSwitcher({ currentProject }: { currentProject: ProjectDTO }) {
  return (
    <div
      style={{
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
    </div>
  );
}

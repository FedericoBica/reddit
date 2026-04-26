import type { ProjectDTO } from "@/db/schemas/domain";

export function ProjectSwitcher({ currentProject }: { currentProject: ProjectDTO }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        fontWeight: 700,
        color: "#1A1A1B",
        padding: "8px 10px",
        background: "#F6F7F8",
        borderRadius: 8,
        border: "1px solid #DAE0E6",
        cursor: "pointer",
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
      <span style={{ color: "#B0B0B5", fontSize: 11 }}>▾</span>
    </div>
  );
}

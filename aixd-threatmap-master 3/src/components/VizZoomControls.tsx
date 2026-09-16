"use client";

// Zoom +/-/reset control overlaid on viz panels (client mock's ZoomControls).
// Lives outside the viz panel files so the style gate's svg box-shadow rule
// stays scoped; it is plain HTML chrome, not part of the chart.

type VizZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

const btnStyle = {
  width: 26,
  height: 26,
  borderRadius: 7,
  border: "1px solid #D6D6CA",
  background: "#fff",
  color: "#1a1a17",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex" as const,
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(26, 26, 23, 0.08)",
};

export const VizZoomControls = ({ onZoomIn, onZoomOut, onReset }: VizZoomControlsProps) => {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        top: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        zIndex: 5,
        alignItems: "flex-end",
      }}
    >
      <button type="button" aria-label="Zoom in" onClick={onZoomIn} style={btnStyle}>
        +
      </button>
      <button type="button" aria-label="Zoom out" onClick={onZoomOut} style={btnStyle}>
        −
      </button>
      <button
        type="button"
        aria-label="Reset zoom"
        onClick={onReset}
        style={{
          ...btnStyle,
          width: 44,
          padding: "0 6px",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        RESET
      </button>
    </div>
  );
};
"use client";

import { HighlightedTitle } from "@/components/VizHighlightedTitle";
import type { ReactNode } from "react";

type VizPanelCardProps = {
  id: string;
  title: string;
  highlights?: string[];
  note: string;
  // Client request (2026-09-14): the Pathway panel's footnote renders in
  // italics (grey); the other panels keep upright text.
  noteItalic?: boolean;
  // Optional per-panel control rendered inline with the footnote, right-aligned
  // – e.g. BipartiteMorphMap's "Back to overview". Lives here (top of the card,
  // outside the SVG's own coordinate space) rather than floating over the
  // diagram, so it reads as navigation chrome and can never overlap a node.
  actions?: ReactNode;
  children: ReactNode;
};

// Shared chrome for every map panel: white rounded card (matches the client
// mock), highlighted title, and the mandated asterisk footnote directly under
// the title. Panels differ only in the body.
export const VizPanelCard = ({ id, title, highlights, note, noteItalic, actions, children }: VizPanelCardProps) => (
  <div
    id={id}
    style={{
      background: "#fff",
      borderRadius: 20,
      border: "1px solid #D6D6CA",
      overflow: "hidden",
    }}
  >
    <div style={{ padding: "20px 24px 24px" }}>
      <div style={{ minHeight: 76 }}>
        <h3
          style={{
            fontSize: 25,
            fontWeight: 800,
            marginBottom: 4,
            color: "#1a1a17",
            lineHeight: 1.25,
          }}
        >
          <HighlightedTitle text={title} highlights={highlights ?? []} />
          *
        </h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <p style={{ fontSize: 11.5, color: "#9a9a92", margin: 0, maxWidth: 640, lineHeight: 1.4, fontStyle: noteItalic ? "italic" : undefined }}>{note}</p>
          {actions}
        </div>
      </div>
      {children}
    </div>
  </div>
);
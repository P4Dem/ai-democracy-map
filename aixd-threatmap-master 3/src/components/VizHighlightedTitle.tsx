"use client";

const ACCENT = "#FF8E32"; // P4D brand orange (--color-p4d-orange)

// Render a title with client-specified substrings emphasised in brand orange
// (the mock renders these exactly this way – e.g. "democracy aspects",
// "harm mechanisms"). Each occurrence is matched case-sensitively as authored.
export const HighlightedTitle = ({ text, highlights = [] }: { text: string; highlights: string[] }) => {
  if (!highlights.length) return <>{text}</>;
  const escaped = highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(re);
  return (
    <>
      {parts.map((part, i) =>
        highlights.includes(part) ? (
          <span key={i} style={{ color: ACCENT }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};
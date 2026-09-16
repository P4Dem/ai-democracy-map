"use client";

import type { ItemType } from "@/lib/types";

type TypeBadgeProps = {
  type: ItemType;
};

const TYPE_META: Record<string, { label: string; color: string }> = {
  "threat-solution": { label: "Threat + mitigation", color: "#963735" },
  threat: { label: "Threat", color: "#963735" },
  "independent-opportunity": { label: "Opportunity", color: "#00B140" },
};

export const TypeBadge = ({ type }: TypeBadgeProps) => {
  const meta = TYPE_META[type] ?? { label: type, color: "#5C5C52" };
  return (
    <span
      className="flex min-w-0 items-start gap-1.5 text-[11.5px] font-semibold leading-tight"
      style={{ color: meta.color }}
    >
      <span
        className="mt-[3px] size-[7px] shrink-0 rounded-full"
        style={{ background: meta.color }}
      />
      <span className="min-w-0">{meta.label}</span>
    </span>
  );
};
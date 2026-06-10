"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { openAspectDialog } from "@/components/AspectDialog";
import type { AspectMap } from "@/lib/types";
import { getPillarColor } from "@/lib/pillars";

type AspectChipsProps = {
  codes: string[];
  aspects: AspectMap;
  maxVisible?: number;
  // Compact mode: chips truncate long names with "..." — used in table cells
  compact?: boolean;
  // When set (px), any visible chip whose right edge falls within the gradient fade
  // zone is demoted to +N instead of being clipped. The parent element's right edge
  // is used as the reference (where the CSS mask/gradient is applied).
  fadeWidth?: number;
};

const MAX_VISIBLE_DEFAULT = 3;

const Chip = ({
  code,
  aspects,
  compact = false,
}: {
  code: string;
  aspects: AspectMap;
  compact?: boolean;
}) => {
  const aspect = aspects[code];
  const color = getPillarColor(code);
  const chipStyle = { backgroundColor: color.chipBg, color: color.chipText };

  if (!aspect) {
    return (
      <Badge variant="outline" className="whitespace-nowrap font-mono text-xs">
        {code}
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openAspectDialog(aspect);
            }}
          />
        }
      >
        <Badge
          className={`cursor-pointer text-xs transition-opacity hover:opacity-80 ${
            compact ? "min-w-0 max-w-[9rem] truncate" : "whitespace-nowrap"
          }`}
          style={chipStyle}
        >
          {aspect.name}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs whitespace-normal">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-muted px-1 font-mono text-xs font-semibold">
              {aspect.code}
            </span>
            <span className="text-xs text-muted-foreground">{aspect.pillar}</span>
          </div>
          {aspect.description && (
            <p className="text-xs leading-relaxed">{aspect.description}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export const AspectChips = ({
  codes,
  aspects,
  maxVisible = MAX_VISIBLE_DEFAULT,
  compact = false,
  fadeWidth,
}: AspectChipsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // How many extra chips (beyond the base overflow) to demote into +N due to gradient clipping
  const [extraHide, setExtraHide] = useState(0);

  // After render, measure each visible chip's right edge against the gradient start.
  // Chips bleeding into the fade zone are hidden — their count rolls into +N.
  // Uses parentElement as reference so measurement is stable even as chips are removed.
  // Deps exclude extraHide intentionally: effect runs once per codes/maxVisible change,
  // measures the current DOM, and converges in a single correction before browser paint.
  useLayoutEffect(() => {
    if (!fadeWidth || !containerRef.current) return;
    const container = containerRef.current;
    const refEl = container.parentElement ?? container;
    const { right: refRight, width } = refEl.getBoundingClientRect();
    if (width === 0) return;

    const safeRight = refRight - fadeWidth;
    const chipEls = container.querySelectorAll<HTMLElement>("[data-chip]");

    let hide = 0;
    for (let i = chipEls.length - 1; i >= 0; i--) {
      if (chipEls[i].getBoundingClientRect().right > safeRight) {
        hide++;
      } else {
        break;
      }
    }

    setExtraHide((prev) => (prev === hide ? prev : hide));
  }, [codes, maxVisible, fadeWidth]);

  if (codes.length === 0) {
    return (
      <Badge variant="outline" className="whitespace-nowrap text-xs text-muted-foreground">
        Uncoded
      </Badge>
    );
  }

  const effectiveVisible = fadeWidth ? Math.max(1, maxVisible - extraHide) : maxVisible;
  const shown = Math.min(codes.length, effectiveVisible);
  const visibleCodes = codes.slice(0, shown);
  const overflowCount = codes.length - shown;

  return (
    <div ref={containerRef} className="flex flex-wrap gap-1">
      {visibleCodes.map((code) => (
        <span key={code} data-chip>
          <Chip code={code} aspects={aspects} compact={compact} />
        </span>
      ))}
      {overflowCount > 0 && (
        // No stopPropagation — click bubbles to row toggle, opening ExpandedRow
        // where all chips are visible (maxVisible={99}, no height constraint)
        <button type="button">
          <Badge
            variant="outline"
            className="cursor-pointer whitespace-nowrap text-xs hover:bg-muted"
          >
            +{overflowCount}
          </Badge>
        </button>
      )}
    </div>
  );
};

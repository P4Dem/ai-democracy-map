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
  // Compact mode: chips are bounded to their cell width and wrap long names
  // (used in narrow table cells so they never bleed into a neighbour column)
  compact?: boolean;
  // Code-only mode: chips show the aspect code ("3.2") instead of the name.
  // Used on narrow table widths where full names cannot fit legibly.
  codeOnly?: boolean;
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
  codeOnly = false,
}: {
  code: string;
  aspects: AspectMap;
  compact?: boolean;
  codeOnly?: boolean;
}) => {
  const aspect = aspects[code];
  const color = getPillarColor(code);
  const chipStyle = { backgroundColor: color.chipBg, color: color.chipText };

  if (!aspect) {
    return (
      <Badge variant="outline" className="whitespace-nowrap font-mono text-[10.5px]">
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
            className={compact ? "min-w-0 max-w-full" : undefined}
            onClick={(e) => {
              e.stopPropagation();
              openAspectDialog(aspect);
            }}
          />
        }
      >
        <Badge
          className={`cursor-pointer text-[10.5px] transition-opacity hover:opacity-80 ${
            codeOnly
              ? "whitespace-nowrap font-mono"
              : compact
                ? // Base Badge is a fixed h-5 (20px) – fine for one line, but
                  // compact mode wraps long aspect names onto 2 lines, and a
                  // 20px box squeezes those lines into and over each other.
                  // Releasing the height + adding real vertical padding and
                  // line-height lets the pill grow to fit its text instead.
                  // Base Badge also centers its content (items-center
                  // justify-center) – fine for one line, but once the name
                  // wraps each line ends up independently centered ("Nationhood"
                  // / "and Citizenship" each centered on its own). Left-align
                  // instead so a wrapped name reads as one block of text.
                  "h-auto min-w-0 max-w-full items-start justify-start whitespace-normal break-words py-1 text-left leading-snug"
                : "whitespace-nowrap"
          }`}
          style={chipStyle}
        >
          {codeOnly ? code : aspect.name}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs whitespace-normal">
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="rounded bg-background/20 px-1 font-mono text-xs font-semibold text-background">
              {aspect.code}
            </span>
            <span className="text-xs font-semibold">{aspect.name}</span>
          </div>
          <p className="text-xs text-background/70">{aspect.pillar}</p>
          {(aspect.definition || aspect.description) && (
            <p className="text-xs leading-relaxed">
              {aspect.definition || aspect.description}
            </p>
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
  codeOnly = false,
  fadeWidth,
}: AspectChipsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // How many extra chips (beyond the base overflow) to demote into +N due to gradient clipping
  const [extraHide, setExtraHide] = useState(0);

  // After render, measure each visible chip's right edge against the gradient start.
  // Chips bleeding into the fade zone are hidden – their count rolls into +N.
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
      <Badge variant="outline" className="whitespace-nowrap text-[11.5px] text-muted-foreground">
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
          <Chip code={code} aspects={aspects} compact={compact} codeOnly={codeOnly} />
        </span>
      ))}
      {overflowCount > 0 && (
        // No stopPropagation – click bubbles to row toggle, opening ExpandedRow
        // where all chips are visible (maxVisible={99}, no height constraint)
        <button type="button">
          <Badge
            variant="outline"
            className="cursor-pointer whitespace-nowrap text-[10.5px] hover:bg-muted"
          >
            +{overflowCount}
          </Badge>
        </button>
      )}
    </div>
  );
};

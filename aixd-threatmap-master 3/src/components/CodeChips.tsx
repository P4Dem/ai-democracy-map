"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { mixInk, withAlpha } from "@/lib/codes";

type CodeChipsProps = {
  codes: string[];
  colorOf: (code: string) => string | undefined;
  labelOf: (code: string) => string;
  // Head category of the code (harm tier / pro-dem cluster). When provided
  // alongside descriptionOf, chips gain a hover box: name → category → description.
  categoryOf?: (code: string) => string | null | undefined;
  descriptionOf?: (code: string) => string | null | undefined;
  max?: number;
  // Bound each chip to the cell it lives in ("100%" = the column's content
  // width) so a chip never paints over a neighbouring column. A number keeps
  // the old fixed-pixel behaviour for full-width usages.
  maxWidth?: number | string;
  emptyLabel?: string;
};

export const CodeChips = ({
  codes,
  colorOf,
  labelOf,
  categoryOf,
  descriptionOf,
  max = 3,
  maxWidth = "100%",
  emptyLabel = "–",
}: CodeChipsProps) => {
  if (!codes || codes.length === 0) {
    return (
      <span className="text-[11.5px] italic text-muted-foreground">
        {emptyLabel}
      </span>
    );
  }
  const shown = codes.slice(0, max);
  const extra = codes.length - shown.length;
  const hasHover = !!(categoryOf || descriptionOf);
  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {shown.map((code) => {
        const c = colorOf(code) ?? "#5C5C52";
        const name = labelOf(code);
        const category = categoryOf?.(code);
        const description = descriptionOf?.(code);
        const chip = (
          <span
            key={code}
            title={hasHover ? undefined : name && name !== code ? `${code} – ${name}` : code}
            // Wraps onto a second line instead of truncating with an
            // ellipsis – maxWidth now bounds the wrap, not a hard cut.
            className="inline-block whitespace-normal break-words rounded-[10px] px-[7px] py-[3px] text-[10.5px] font-semibold leading-snug"
            style={{
              maxWidth,
              background: withAlpha(c, 0.14),
              color: mixInk(c, 0.25),
              border: `1px solid ${withAlpha(c, 0.35)}`,
            }}
          >
            {name || code}
          </span>
        );
        if (!hasHover) return chip;
        return (
          <Tooltip key={code}>
            <TooltipTrigger render={<span className="inline-flex max-w-full" />}>{chip}</TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs whitespace-normal">
              <div className="space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="rounded bg-background/20 px-1 font-mono text-xs font-semibold text-background">
                    {code}
                  </span>
                  <span className="text-xs font-semibold">{name}</span>
                </div>
                {category && <p className="text-xs text-background/70">{category}</p>}
                {description && <p className="text-xs leading-relaxed">{description}</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {extra > 0 && (
        <span className="self-center text-[10.5px] text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
};

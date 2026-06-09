"use client";

import { AspectChips } from "@/components/AspectChips";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AspectMap, Item } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

type ExpandedRowProps = {
  item: Item;
  aspects: AspectMap;
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded-md border border-p4d-blue/40 bg-p4d-blue/10 px-2.5 py-1 text-xs font-semibold text-p4d-blue transition-colors hover:bg-p4d-blue/20"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
};

// Replaces raw URLs in citations with nothing
const formatSourceForTooltip = (source: string) =>
  // Matches "Available at: " (optional) followed by the URL
  source.split(/(?:Available at:\s*)?https?:\/\/\S+/gi).map((part, i) =>
    // If the part is an empty string or just whitespace, we can skip it
    // or return the styled link if you still want a placeholder
    part === "" ? "" : part
  );

const QUOTE_COLORS: Record<string, string> = {
  "threat-solution": "border-l-p4d-brick",
  threat: "border-l-p4d-brick",
  "independent-opportunity": "border-l-p4d-grassroot",
  solution: "border-l-p4d-grassroot",
};

export const ExpandedRow = ({ item, aspects }: ExpandedRowProps) => {
  const hasVerbatimQuotes = item.descriptionVerbatim || item.solutionVerbatim;

  return (
    <div
      className="space-y-5 px-6 py-5 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {hasVerbatimQuotes && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {item.descriptionVerbatim && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.type === "independent-opportunity"
                    ? "Opportunity"
                    : "Threat"}{" "}
                  (verbatim)
                </span>
                <CopyButton
                  text={`${item.descriptionVerbatim}\n\n— ${item.source}`}
                />
              </div>
              <blockquote
                className={`rounded-r-md border-l-3 bg-card px-4 py-3 italic leading-relaxed text-foreground/80 ${
                  QUOTE_COLORS[item.type]
                }`}
              >
                {item.descriptionVerbatim}
              </blockquote>
            </div>
          )}

          {item.solutionVerbatim && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Solution (verbatim)
                </span>
                <CopyButton
                  text={`${item.solutionVerbatim}\n\n— ${item.source}`}
                />
              </div>
              <blockquote className="rounded-r-md border-l-3 border-l-p4d-grassroot bg-card px-4 py-3 italic leading-relaxed text-foreground/80">
                {item.solutionVerbatim}
              </blockquote>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-x-8 gap-y-4 border-t border-border/50 pt-4">
        {/* Tooltip wraps the whole source block — appears above the "Source" label, not mid-block */}
        <Tooltip>
          <TooltipTrigger
            render={<div className="min-w-0 shrink cursor-default" />}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Source
            </span>
            <div className="mt-1 max-w-xs">
              {item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-words text-sm underline underline-offset-2 hover:text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.sourceShort}
                </a>
              ) : (
                <span className="break-words text-sm text-foreground/80">
                  {item.sourceShort}
                </span>
              )}
              {item.source !== item.sourceShort && (
                <p className="mt-0.5 line-clamp-3 text-xs text-muted-foreground">
                  {item.source}
                </p>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm whitespace-normal break-words text-xs leading-relaxed">
            {formatSourceForTooltip(item.source)}
          </TooltipContent>
        </Tooltip>

        {/* Category: disabled per design decision 2026-04-17 */}

        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dem. Aspects
          </span>
          <div className="mt-1">
            <AspectChips
              codes={item.aspects}
              aspects={aspects}
              maxVisible={99}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

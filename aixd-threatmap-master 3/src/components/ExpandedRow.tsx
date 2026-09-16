"use client";

import { AspectChips } from "@/components/AspectChips";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { AspectMap, BenefitTaxonomy, HarmTaxonomy, Item } from "@/lib/types";
import { useState } from "react";
import { toast } from "sonner";

type ExpandedRowProps = {
  item: Item;
  aspects: AspectMap;
  harmTaxonomy: HarmTaxonomy;
  benefitTaxonomy: BenefitTaxonomy;
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
  source.split(/(?:Available at:\s*)?https?:\/\/\S+/gi).map((part) =>
    part === "" ? "" : part
  );

const QUOTE_COLORS: Record<string, string> = {
  "threat-solution": "border-l-p4d-brick",
  threat: "border-l-p4d-brick",
  "independent-opportunity": "border-l-p4d-grassroot",
  solution: "border-l-p4d-grassroot",
};

// Some entries' verbatim quote is word-for-word the paraphrase – showing
// both then is just the same sentence twice, not two different texts. Only
// worth a separate blockquote when it actually adds something.
const isSameText = (a?: string | null, b?: string | null) =>
  !!a && !!b && a.trim().replace(/^["']|["']$/g, "") === b.trim().replace(/^["']|["']$/g, "");

export const ExpandedRow = ({ item, aspects, harmTaxonomy, benefitTaxonomy }: ExpandedRowProps) => {
  const CodeList = ({
    title,
    codes,
    labelOf,
    categoryOf,
    descriptionOf,
  }: {
    title: string;
    codes: string[];
    labelOf: (c: string) => string;
    categoryOf?: (c: string) => string | null | undefined;
    descriptionOf?: (c: string) => string | null | undefined;
  }) =>
    codes.length > 0 ? (
      <div className="min-w-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="mt-1 flex flex-col gap-1.5">
          {codes.map((c) => {
            const row = (
              <span className="text-sm leading-snug text-foreground/80 break-words">
                <b className="font-semibold text-foreground">{c}</b> {labelOf(c)}
              </span>
            );
            if (!categoryOf && !descriptionOf) return row;
            const category = categoryOf?.(c);
            const description = descriptionOf?.(c);
            return (
              <Tooltip key={c}>
                <TooltipTrigger render={<span className="inline-flex" />}>{row}</TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs whitespace-normal">
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="rounded bg-background/20 px-1 font-mono text-xs font-semibold text-background">
                        {c}
                      </span>
                      <span className="text-xs font-semibold">{labelOf(c)}</span>
                    </div>
                    {category && <p className="text-xs text-background/70">{category}</p>}
                    {description && <p className="text-xs leading-relaxed">{description}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    ) : null;

  return (
    <div
      className="space-y-5 px-6 py-5 text-sm"
      onClick={(e) => e.stopPropagation()}
    >
      {/* This panel is the single place that shows full text – the row itself
          stays clamped whether expanded or not. The full paraphrase (the
          column's own text, plain) always shows; the verbatim quote (italic,
          in a blockquote) only shows alongside it when it actually says
          something different – for entries where the paraphrase already is
          the verbatim word-for-word, repeating it in quotes right below adds
          nothing but noise. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {item.type === "independent-opportunity" ? "Opportunity" : "Threat"} description
            </span>
            <CopyButton
              text={`${item.descriptionVerbatim || item.description}\n\n– ${item.source}`}
            />
          </div>
          <p className="leading-relaxed text-foreground/90">{item.description}</p>
          {item.descriptionVerbatim && !isSameText(item.descriptionVerbatim, item.description) && (
            <blockquote
              className={`mt-3 rounded-r-md border-l-3 bg-card px-4 py-3 italic leading-relaxed text-foreground/80 ${QUOTE_COLORS[item.type]}`}
            >
              {item.descriptionVerbatim}
            </blockquote>
          )}
        </div>

        {(item.solutionVerbatim || item.solution) && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mitigation strategy
              </span>
              <CopyButton
                text={`${item.solutionVerbatim || item.solution}\n\n– ${item.source}`}
              />
            </div>
            {item.solution && (
              <p className="leading-relaxed text-foreground/90">{item.solution}</p>
            )}
            {item.solutionVerbatim && !isSameText(item.solutionVerbatim, item.solution) && (
              <blockquote className="mt-3 rounded-r-md border-l-3 border-l-p4d-grassroot bg-card px-4 py-3 italic leading-relaxed text-foreground/80">
                {item.solutionVerbatim}
              </blockquote>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-5 border-t border-border/50 pt-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <Tooltip>
          <TooltipTrigger
            render={<div className="min-w-0 cursor-default" />}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Source
            </span>
            <div className="mt-1">
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

        <div className="min-w-0">
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

        <CodeList
          title="Harm mechanisms"
          codes={item.harmCodes ?? []}
          labelOf={(c) => harmTaxonomy.codes[c]?.label ?? c}
          categoryOf={(c) => harmTaxonomy.tiers[harmTaxonomy.codes[c]?.tier ?? ""]?.label}
          descriptionOf={(c) => harmTaxonomy.codes[c]?.description}
        />

        <CodeList
          title="Pro-democracy activities"
          codes={item.benefitCodes ?? []}
          labelOf={(c) => benefitTaxonomy.codes[c]?.label ?? benefitTaxonomy.codes[c]?.name ?? c}
          categoryOf={(c) => benefitTaxonomy.codes[c]?.name}
          descriptionOf={(c) => benefitTaxonomy.codes[c]?.description}
        />

        <div className="min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Entry
          </span>
          <div className="mt-1 text-sm tabular-nums text-muted-foreground/50">
            #{item.id}
          </div>
        </div>
      </div>
    </div>
  );
};

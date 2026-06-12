"use client";

import { useMemo, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/MultiSelect";
import type { FilterState, Item, AspectMap, ItemType } from "@/lib/types";
import { COL_WIDTHS } from "@/components/DataTable";

const TYPE_LABELS: Record<ItemType, string> = {
  "threat-solution": "Threat + Mitigation pairing",
  threat: "Threat",
  "independent-opportunity": "Independent opportunity",
};

type FilterBarProps = {
  items: Item[];
  aspects: AspectMap;
  filters: FilterState;
  setFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  activeFilterCount: number;
  onExport: () => void;
  isSticky?: boolean;
};

export const FilterBar = ({
  items,
  aspects,
  filters,
  setFilter,
  resetFilters,
  activeFilterCount,
  onExport,
  isSticky = false,
}: FilterBarProps) => {
  const [searchInput, setSearchInput] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => setFilter("search", searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput, setFilter]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const aspectOptions = useMemo(() => {
    const sortedAspects = Object.values(aspects).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    );
    return sortedAspects.map((a) => ({
      value: a.code,
      label: `${a.code} ${a.name}`,
      group: a.pillar,
    }));
  }, [aspects]);

  const sourceOptions = useMemo(() => {
    const sources = [...new Set(items.map((i) => i.sourceShort))].sort();
    return sources.map((s) => ({ value: s, label: s }));
  }, [items]);

  const pills = useMemo(() => {
    const result: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.search) {
      result.push({
        key: "search",
        label: `"${filters.search}"`,
        onRemove: () => { setSearchInput(""); setFilter("search", ""); },
      });
    }
    for (const t of filters.type) {
      result.push({
        key: `type:${t}`,
        label: `Impact type: ${TYPE_LABELS[t] ?? t}`,
        onRemove: () => setFilter("type", filters.type.filter((v) => v !== t) as FilterState["type"]),
      });
    }
    for (const code of filters.aspect) {
      result.push({
        key: `aspect:${code}`,
        label: `${code} ${aspects[code]?.name ?? code}`,
        onRemove: () => setFilter("aspect", filters.aspect.filter((v) => v !== code)),
      });
    }
    for (const s of filters.source) {
      result.push({
        key: `source:${s}`,
        label: `Source: ${s}`,
        onRemove: () => setFilter("source", filters.source.filter((v) => v !== s)),
      });
    }
    return result;
  }, [filters, aspects, setFilter]);

  return (
    <div
      className={[
        "sticky top-0 z-10 mb-0 bg-card px-4 pb-3 pt-3 [transition:box-shadow_150ms_ease-out,border-radius_200ms_ease-out]",
        isSticky
          ? "border-b border-border/50 shadow-sm"
          : "rounded-t-xl ring-1 ring-foreground/10",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search is the primary control — first, wider than default */}
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threats, mitigations..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        <MultiSelect
          label="Impact type"
          options={[
            { value: "threat-solution", label: "Threat + Mitigation pairing" },
            { value: "threat", label: "Threat" },
            { value: "independent-opportunity", label: "Independent opportunity" },
          ]}
          selected={filters.type}
          onChange={(v) => setFilter("type", v as FilterState["type"])}
        />

        <MultiSelect
          label="Democracy aspects"
          options={aspectOptions}
          selected={filters.aspect}
          onChange={(v) => setFilter("aspect", v)}
        />

        <MultiSelect
          label="Source"
          options={sourceOptions}
          selected={filters.source}
          onChange={(v) => setFilter("source", v)}
        />

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-xs"
            onClick={resetFilters}
          >
            Clear all
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
              {activeFilterCount}
            </Badge>
          </Button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" className="h-9" onClick={onExport}>
            ↓ Export CSV
          </Button>
        </div>
      </div>

      {pills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span
              key={pill.key}
              className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary/8 px-3 text-xs text-foreground"
            >
              {pill.label}
              <button
                type="button"
                onClick={pill.onRemove}
                className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Remove filter"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {isSticky && (
        <div className="-mx-4 mt-2.5 border-t border-border/30 px-4 pt-2">
          <div className="flex items-center text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            <div className="shrink-0 px-2" style={{ width: COL_WIDTHS.type }}>
              Impact type
            </div>
            <div className="min-w-0 flex-1 px-2">
              Description
            </div>
            <div className="min-w-0 flex-1 px-2">
              Mitigation Strategy
            </div>
            <div className="shrink-0 px-2" style={{ width: COL_WIDTHS.aspects }}>
              Democracy Aspects
            </div>
            <div className="shrink-0 px-2" style={{ width: COL_WIDTHS.source }}>
              Source
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef, Fragment } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ExpandedState,
  type ColumnFiltersState,
  type Row,
} from "@tanstack/react-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Client request (2026-09-14): the aspects-of-democracy codebook page link in
// the Aspects header is commented out ("saved as draft") until its content is
// finalised. Re-import ExternalLink when the link is restored.
import { Info } from "lucide-react";
// import { ExternalLink } from "lucide-react";
import { TypeBadge } from "@/components/TypeBadge";
import { AspectChips } from "@/components/AspectChips";
import { CodeChips } from "@/components/CodeChips";
import { ExpandedRow } from "@/components/ExpandedRow";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Item, ItemType, AspectMap, HarmTaxonomy, BenefitTaxonomy } from "@/lib/types";
import { benefitClusterOf, BENEFIT_CLUSTER_COLORS, tierOf } from "@/lib/codes";
import { TIER_COLORS } from "@/lib/tiers";

const COLUMN_INFO: Record<string, { title: string; description: string }> = {
  type: {
    title: "Type of effect on democracy",
    description:
      "Categorises each entry as a threat, a threat paired with a mitigation strategy, or an independent opportunity for AI to improve democracy.",
  },
  aspects: {
    title: "Democracy aspects involved",
    description:
      "Links each entry to one or more dimensions of the P4Democracy assessment framework – from citizenship and rights to civil society and democratic governance.",
  },
  description: {
    title: "Threat description",
    description:
      "Summarises the core finding, paraphrased from the source material.",
  },
  harm: {
    title: "Mechanism enabling harm to democracy",
    description:
      "The mechanism by which AI enables harm to democracy, coded from the P4D harm taxonomy.",
  },
  solution: {
    title: "Mitigation/opportunity description",
    description:
      "Proposed measures to address or reduce the identified threat, or the opportunity description for independent opportunities.",
  },
  benefit: {
    title: "Activities enabling benefit to democracy",
    description:
      "The pro-democracy activity that brings the benefit to democracy, coded from the P4D benefit taxonomy.",
  },
  sourceShort: {
    title: "Source",
    description: "The publication or report from which the entry was drawn.",
  },
};

const ColumnHeader = ({ columnId }: { columnId: string }) => {
  const info = COLUMN_INFO[columnId];
  return (
    <div className="flex items-center gap-1.5">
      <span>{info?.title ?? columnId}</span>
      {info && (
        <Popover>
          <PopoverTrigger className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
            <Info className="size-3" />
          </PopoverTrigger>
          <PopoverContent side="top" align="center" className="w-64">
            <PopoverHeader>
              <PopoverTitle>{info.title}</PopoverTitle>
              <PopoverDescription>{info.description}</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};

const INITIAL_BATCH = 40;
const BATCH_SIZE = 25;

export const COL_WIDTHS = {
  rowNum: "56px",
  type: "160px",
  aspects: "180px",
  description: "220px",
  harm: "210px",
  solution: "220px",
  benefit: "210px",
  source: "120px",
} as const;

const TH_CLASS =
  "h-auto p-[10px_12px_12px] align-bottom text-[10.5px] font-bold uppercase tracking-[0.04em] text-muted-foreground leading-[1.35] whitespace-normal [word-break:break-word]";

// Column-group background tints for the table: threat+harm columns share one tone,
// mitigation+benefit columns share another (mock GROUP_HARM_BG / GROUP_BENEFIT_BG).
const GROUP_HARM_BG = "bg-[#F7F1E0]";
const GROUP_BENEFIT_BG = "bg-[#EAEAE3]";
const ASPECTS_COL_BG = "bg-[#F3F3F0]";

// Inset top + bottom rules mark the expanded section; color is type-aware.
const ELEVATION_SHADOW: Record<ItemType, string> = {
  "threat-solution": "inset 0 1px 0 0 rgba(150,55,53,0.2), inset 0 -1px 0 0 rgba(150,55,53,0.2)",
  threat:            "inset 0 1px 0 0 rgba(150,55,53,0.2), inset 0 -1px 0 0 rgba(150,55,53,0.2)",
  "independent-opportunity": "inset 0 1px 0 0 rgba(0,177,64,0.2), inset 0 -1px 0 0 rgba(0,177,64,0.2)",
};

// Tween easing – clean, no overshoot. Material Design standard curve (0.4 0 0.2 1).
const EXPAND_TRANSITION = {
  height: { type: "tween" as const, duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  opacity: { duration: 0.2 },
};

const AnimatedExpandedRow = ({
  item,
  aspects,
  harmTaxonomy,
  benefitTaxonomy,
  isExpanded,
}: {
  item: Item;
  aspects: AspectMap;
  harmTaxonomy: HarmTaxonomy;
  benefitTaxonomy: BenefitTaxonomy;
  isExpanded: boolean;
}) => (
  <AnimatePresence initial={false}>
    {isExpanded && (
      <motion.div
        key="expanded-content"
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={EXPAND_TRANSITION}
        style={{ overflow: "hidden" }}
      >
        <ExpandedRow
          item={item}
          aspects={aspects}
          harmTaxonomy={harmTaxonomy}
          benefitTaxonomy={benefitTaxonomy}
        />
      </motion.div>
    )}
  </AnimatePresence>
);

type DataTableProps = {
  items: Item[];
  aspects: AspectMap;
  harmTaxonomy: HarmTaxonomy;
  benefitTaxonomy: BenefitTaxonomy;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  onFilteredRowsChange?: (rows: Item[]) => void;
  scrollTargetRef?: React.RefObject<HTMLElement | null>;
};

type GroupInfo = {
  isGrouped: boolean;
  isFirstInGroup: boolean;
  groupSize: number;
};

const buildGroupMap = (rows: Row<Item>[]): Map<string, GroupInfo> => {
  const map = new Map<string, GroupInfo>();
  const descGroups = new Map<string, string[]>();

  for (const row of rows) {
    const desc = row.original.description;
    const existing = descGroups.get(desc);
    if (existing) {
      existing.push(row.id);
    } else {
      descGroups.set(desc, [row.id]);
    }
  }

  for (const [, rowIds] of descGroups) {
    const isGrouped = rowIds.length > 1;
    rowIds.forEach((id, i) => {
      map.set(id, { isGrouped, isFirstInGroup: i === 0, groupSize: rowIds.length });
    });
  }

  return map;
};

export const DataTable = ({
  items,
  aspects,
  harmTaxonomy,
  benefitTaxonomy,
  globalFilter,
  columnFilters,
  onFilteredRowsChange,
  scrollTargetRef,
}: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const presortedItems = useMemo(
    () =>
      [...items].sort((a, b) => {
        if (a.type !== b.type) {
          const order: Record<string, number> = { "threat-solution": 0, threat: 1, "independent-opportunity": 2 };
          return (order[a.type] ?? 3) - (order[b.type] ?? 3);
        }
        return a.description.localeCompare(b.description);
      }),
    [items]
  );
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Aspect codes the table is currently filtered by – surfaced first in each
  // row's "Democracy aspects" cell so the reason a row matched is never hidden
  // in the "+N" overflow.
  const activeAspectCodes = useMemo(() => {
    const raw = columnFilters.find((f) => f.id === "aspects")?.value;
    return new Set(Array.isArray(raw) ? (raw as string[]) : []);
  }, [columnFilters]);

  const orderAspects = useCallback(
    (codes: string[]) => {
      if (activeAspectCodes.size === 0) return codes;
      const matched = codes.filter((c) => activeAspectCodes.has(c));
      if (matched.length === 0) return codes;
      return [...matched, ...codes.filter((c) => !activeAspectCodes.has(c))];
    },
    [activeAspectCodes]
  );

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        id: "rowNum",
        header: () => <span className="text-muted-foreground/70">№</span>,
        cell: () => null,
        enableSorting: false,
      },
      {
        accessorKey: "type",
        header: () => <ColumnHeader columnId="type" />,
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(row.original.type);
        },
      },
      {
        id: "aspects",
        header: () => (
          <div className="flex items-center gap-1.5">
            <ColumnHeader columnId="aspects" />
            {/* Codebook (aspects-of-democracy) link commented out per client
                request (2026-09-14) – draft saved, hidden until finalised.
            <a
              href={`${import.meta.env.BASE_URL}/codebook.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-3.5 items-center justify-center text-muted-foreground/50 hover:text-p4d-grassroot"
              title="Open codebook"
            >
              <ExternalLink className="size-3" />
            </a>
            */}
          </div>
        ),
        // Never actually reached in the table body — the row-rendering loop
        // below overrides the "aspects" column with its own cell (compact
        // wrapping, matching the harm/benefit chips). Kept in sync so this
        // definition isn't misleading if something else ever calls it.
        cell: ({ row }) => (
          <AspectChips codes={orderAspects(row.original.aspects)} aspects={aspects} maxVisible={3} compact />
        ),
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return row.original.aspects.some((code) => filterValue.includes(code));
        },
      },
      {
        accessorKey: "description",
        header: () => <ColumnHeader columnId="description" />,
        cell: ({ row }) => {
          if (row.original.type === "independent-opportunity") {
            return (
              <span className="text-[12px] italic tracking-wider text-p4d-grassroot/70">
                – opportunity –
              </span>
            );
          }
          // Stays clamped even when the row is expanded – the expanded panel
          // below is the single place for full text (verbatim quote, or the
          // paraphrase itself if no verbatim exists). The row is always just
          // the compact summary, so expanding never reflows it.
          return (
            <span className="line-clamp-3 text-[13px] leading-[1.45] [overflow-wrap:anywhere]">
              {row.original.description}
            </span>
          );
        },
      },
      {
        id: "harm",
        header: () => <ColumnHeader columnId="harm" />,
        cell: ({ row }) => (
          <CodeChips
            codes={row.original.harmCodes}
            colorOf={(c) => TIER_COLORS[tierOf(c) ?? ""] ?? "#5C5C52"}
            labelOf={(c) => harmTaxonomy.codes[c]?.label ?? c}
            categoryOf={(c) => harmTaxonomy.tiers[harmTaxonomy.codes[c]?.tier ?? ""]?.label}
            descriptionOf={(c) => harmTaxonomy.codes[c]?.description}
          />
        ),
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return (row.original.harmCodes ?? []).some((code) => filterValue.includes(code));
        },
      },
      {
        accessorKey: "solution",
        header: () => <ColumnHeader columnId="solution" />,
        cell: ({ row }) => {
          if (row.original.type === "independent-opportunity") {
            return (
              <span className="line-clamp-3 text-[13px] leading-[1.45] [overflow-wrap:anywhere]">
                {row.original.description}
              </span>
            );
          }
          const hasSolution = !!row.original.solution;
          return hasSolution ? (
            <span className="line-clamp-3 text-[13px] leading-[1.45] [overflow-wrap:anywhere]">
              {row.original.solution}
            </span>
          ) : (
            <span className="text-[12px] italic text-muted-foreground">
              No mitigation mapped
            </span>
          );
        },
      },
      {
        id: "benefit",
        header: () => <ColumnHeader columnId="benefit" />,
        cell: ({ row }) => (
          <CodeChips
            codes={row.original.benefitCodes}
            colorOf={(c) => BENEFIT_CLUSTER_COLORS[benefitClusterOf(c, benefitTaxonomy)] ?? "#5C5C52"}
            labelOf={(c) => benefitTaxonomy.codes[c]?.label ?? benefitTaxonomy.codes[c]?.name ?? c}
            categoryOf={(c) => benefitTaxonomy.codes[c]?.name}
            descriptionOf={(c) => benefitTaxonomy.codes[c]?.description}
          />
        ),
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return (row.original.benefitCodes ?? []).some((code) => filterValue.includes(code));
        },
      },
      {
        accessorKey: "sourceShort",
        header: () => <ColumnHeader columnId="sourceShort" />,
        cell: ({ row }) => {
          const { sourceShort, sourceUrl } = row.original;
          if (sourceUrl) {
            return (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="break-words line-clamp-2 text-[11.5px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                {sourceShort}
              </a>
            );
          }
          return (
            <span className="line-clamp-2 text-[11.5px] text-muted-foreground">
              {sourceShort}
            </span>
          );
        },
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(row.original.sourceShort);
        },
      },
    ],
    [aspects, harmTaxonomy, benefitTaxonomy, orderAspects]
  );

  const table = useReactTable({
    data: presortedItems,
    columns,
    state: { sorting, expanded, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue: string) => {
      if (!filterValue) return true;
      const search = filterValue.toLowerCase();
      const item = row.original;
      return (
        item.description.toLowerCase().includes(search) ||
        (item.solution?.toLowerCase().includes(search) ?? false) ||
        (item.descriptionVerbatim?.toLowerCase().includes(search) ?? false) ||
        (item.solutionVerbatim?.toLowerCase().includes(search) ?? false)
      );
    },
    getRowCanExpand: () => true,
  });

  const filteredRows = table.getRowModel().rows;
  const totalRows = filteredRows.length;
  const groupMap = useMemo(() => buildGroupMap(filteredRows), [filteredRows]);
  const visibleRows = filteredRows.slice(0, visibleCount);

  table.options.meta = { groupMap };

  useEffect(() => {
    onFilteredRowsChange?.(filteredRows.map((r) => r.original));
  }, [filteredRows, onFilteredRowsChange]);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [totalRows]);

  const filterScrollInit = useRef(false);
  useEffect(() => {
    if (!filterScrollInit.current) {
      filterScrollInit.current = true;
      return;
    }
    if (!scrollTargetRef?.current) return;
    const top =
      scrollTargetRef.current.getBoundingClientRect().top +
      window.scrollY -
      10;
    window.scrollTo({ top, behavior: "smooth" });
  }, [globalFilter, columnFilters, scrollTargetRef]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= totalRows) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, totalRows));
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, totalRows]);

  const cellBg: Record<string, string> = {
    aspects: ASPECTS_COL_BG,
    description: GROUP_HARM_BG,
    harm: GROUP_HARM_BG,
    solution: GROUP_BENEFIT_BG,
    benefit: GROUP_BENEFIT_BG,
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        {/* All 8 columns always render. `table-fixed` + % widths keep the
            proportions at any table width, so as the viewport narrows the
            columns just get skinnier and their text reflows / clamps in place.
            The min-width steps down so the table only starts scrolling once
            columns would become genuinely unreadable. */}
        <table className="w-full min-w-[560px] table-fixed caption-bottom text-sm sm:min-w-[680px] lg:min-w-[900px] xl:min-w-[1100px]">
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "15%" }} />
            <col style={{ width: "9%" }} />
          </colgroup>

          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={[TH_CLASS, cellBg[header.column.id] ?? ""].join(" ")}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3 py-8">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 48 48"
                      fill="none"
                      className="text-muted-foreground/30"
                    >
                      <circle
                        cx="22"
                        cy="22"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M32 32l8 8"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M18 22h8M22 18v8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div>
                      <p className="text-base font-medium text-muted-foreground">
                        No results found
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground/60">
                        Try adjusting your filters or search terms
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {visibleRows.map((row, rowIndex) => {
                  const group = groupMap.get(row.id);
                  const showGroupBorder =
                    group?.isGrouped && !group.isFirstInGroup;

                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className={`cursor-pointer animate-fade-in-up transition-colors ${
                          row.getIsExpanded()
                            ? "bg-p4d-ecru hover:bg-p4d-ecru border-b-0"
                            : ""
                        }`}
                        style={{
                          animationDelay: `${Math.min(rowIndex, 24) * 20}ms`,
                          ...(showGroupBorder || row.getIsExpanded()
                            ? {
                                borderLeft: `2px solid ${row.original.type === "independent-opportunity" ? "var(--color-p4d-grassroot)" : "var(--color-p4d-brick)"}`,
                              }
                            : {}),
                        }}
                        onClick={() => row.toggleExpanded()}
                        data-state={
                          row.getIsExpanded() ? "expanded" : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell) => {
                          const bg = cellBg[cell.column.id];
                          return (
                            <TableCell
                              key={cell.id}
                              className={bg ?? ""}
                            >
                              {cell.column.id === "rowNum" ? (
                                <div className="flex min-h-19 items-center">
                                  <span className="text-[11px] tabular-nums text-muted-foreground/50">
                                    {rowIndex + 1}
                                  </span>
                                </div>
                              ) : cell.column.id === "aspects" ? (
                                // Matches how the harm/benefit chips already behave: wrap the
                                // full name onto 2-3 lines inside whatever the column's fixed
                                // width actually is, at any screen size — no breakpoint jump.
                                // The old version showed full names (fading past ~2.5rem) only
                                // once the column reached xl, and fell back to bare code numbers
                                // ("2.1") below that — so most viewers, most of the time, saw
                                // numbers instead of names. compact wrapping keeps a readable
                                // name visible at every width; full name/pillar/description are
                                // still one hover away in the tooltip.
                                <div className="flex min-h-19 min-w-0 items-center py-2 [&_*]:min-w-0 [&>*]:min-w-0">
                                  <AspectChips
                                    codes={orderAspects(row.original.aspects)}
                                    aspects={aspects}
                                    maxVisible={3}
                                    compact
                                  />
                                </div>
                              ) : cell.column.id === "description" ||
                                cell.column.id === "solution" ? (
                                <div className="flex min-h-19 min-w-0 items-center py-3">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              ) : (
                                <div className="flex min-h-19 min-w-0 items-center py-2">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </div>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                      <TableRow
                        className={`hover:bg-transparent ${
                          row.getIsExpanded() ? "border-b" : "border-b-0"
                        }`}
                      >
                        <TableCell
                          colSpan={columns.length}
                          className="bg-p4d-ecru/60 p-0"
                          style={
                            row.getIsExpanded()
                              ? { boxShadow: ELEVATION_SHADOW[row.original.type] }
                              : undefined
                          }
                        >
                          <AnimatedExpandedRow
                            item={row.original}
                            aspects={aspects}
                            harmTaxonomy={harmTaxonomy}
                            benefitTaxonomy={benefitTaxonomy}
                            isExpanded={row.getIsExpanded()}
                          />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </>
            )}
          </TableBody>
        </table>
      </div>

      <div ref={sentinelRef} aria-hidden className="h-px" />

      {totalRows > 0 && (
        <p className="py-2 text-center text-[12px] text-muted-foreground">
          {visibleCount < totalRows
            ? `Showing ${visibleCount} of ${totalRows} entries`
            : `${totalRows} entries`}
        </p>
      )}
    </div>
  );
};
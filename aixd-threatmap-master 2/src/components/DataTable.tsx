"use client";

import React, { useState, useMemo, useEffect, useRef, Fragment } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";
import { TypeBadge } from "@/components/TypeBadge";
import { AspectChips } from "@/components/AspectChips";
import { ExpandedRow } from "@/components/ExpandedRow";
import type { Item, ItemType, AspectMap } from "@/lib/types";

const INITIAL_BATCH = 40;
const BATCH_SIZE = 20;

// Fixed-width columns for chip-heavy cells; Description and Solution take the rest equally.
// Adjust here to tune layout without touching JSX.
const COL_WIDTHS = {
  type:    "160px",
  aspects: "300px",
  source:  "140px",
} as const;

// Inset top + bottom rules mark the expanded section; color is type-aware.
const ELEVATION_SHADOW: Record<ItemType, string> = {
  "threat-solution": "inset 0 1px 0 0 rgba(150,55,53,0.2), inset 0 -1px 0 0 rgba(150,55,53,0.2)",
  threat:            "inset 0 1px 0 0 rgba(150,55,53,0.2), inset 0 -1px 0 0 rgba(150,55,53,0.2)",
  "independent-opportunity": "inset 0 1px 0 0 rgba(0,177,64,0.2), inset 0 -1px 0 0 rgba(0,177,64,0.2)",
};

// Tween easing — clean, no overshoot. Material Design standard curve (0.4 0 0.2 1).
const EXPAND_TRANSITION = {
  height: { type: "tween" as const, duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  opacity: { duration: 0.2 },
};


const AnimatedExpandedRow = ({
  item,
  aspects,
  isExpanded,
}: {
  item: Item;
  aspects: AspectMap;
  isExpanded: boolean;
}) => (
  // initial={false} — skip animation on first render (all rows start collapsed)
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
        <ExpandedRow item={item} aspects={aspects} />
      </motion.div>
    )}
  </AnimatePresence>
);

type DataTableProps = {
  items: Item[];
  aspects: AspectMap;
  globalFilter: string;
  columnFilters: ColumnFiltersState;
  onFilteredRowsChange?: (rows: Item[]) => void;
  scrollTargetRef?: React.RefObject<HTMLElement>;
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
  globalFilter,
  columnFilters,
  onFilteredRowsChange,
  scrollTargetRef,
}: DataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // Pre-sort before the table sees the data: threats first, then alphabetical.
  // This gives a sensible default order without triggering TanStack's sort indicators.
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

  const columns = useMemo<ColumnDef<Item>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return filterValue.includes(row.original.type);
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row, table }) => {
          const meta = table.options.meta as
            | { groupMap?: Map<string, GroupInfo> }
            | undefined;
          const group = meta?.groupMap?.get(row.id);

          // independent-opportunity: description lives in the solution column
          if (row.original.type === "independent-opportunity") {
            return (
              <span className="text-xs italic tracking-wider text-p4d-grassroot/50">
                — opportunity —
              </span>
            );
          }

          if (group?.isGrouped && !group.isFirstInGroup) {
            return (
              <span className="italic text-muted-foreground">
                ↳ same threat — different mitigation
              </span>
            );
          }
          return (
            <span className={row.getIsExpanded() ? "" : "line-clamp-2"}>
              {row.original.description}
            </span>
          );
        },
      },
      {
        accessorKey: "solution",
        header: "Mitigation Strategy",
        cell: ({ row }) => {
          // independent-opportunity: the opportunity description renders here
          if (row.original.type === "independent-opportunity") {
            return (
              <span className={row.getIsExpanded() ? "" : "line-clamp-2"}>
                {row.original.description}
              </span>
            );
          }
          const hasSolution = !!row.original.solution;
          return (
            <div className="flex items-start gap-2">
              <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                  hasSolution ? "bg-p4d-grassroot" : "bg-border"
                }`}
              />
              {hasSolution ? (
                <span className={row.getIsExpanded() ? "" : "line-clamp-2"}>
                  {row.original.solution}
                </span>
              ) : (
                <span className="italic text-muted-foreground">No mitigation mapped</span>
              )}
            </div>
          );
        },
      },
      {
        id: "aspects",
        header: "Democracy Aspects",
        cell: ({ row }) => (
          <AspectChips codes={row.original.aspects} aspects={aspects} maxVisible={3} fadeWidth={48} />
        ),
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true;
          return row.original.aspects.some((code) => filterValue.includes(code));
        },
      },
      {
        accessorKey: "sourceShort",
        header: "Source",
        cell: ({ row }) => {
          const { sourceShort, sourceUrl } = row.original;
          if (sourceUrl) {
            return (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="break-words line-clamp-2 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {sourceShort}
              </a>
            );
          }
          return (
            <span className="line-clamp-2 text-xs text-muted-foreground">
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
    [aspects]
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

  // getRowModel() = full pipeline (filtered → sorted → expanded) — required for sorting to work
  const filteredRows = table.getRowModel().rows;
  const totalRows = filteredRows.length;
  // Build group map from ALL filtered rows so "↳ same threat" labels are consistent across batches
  const groupMap = useMemo(() => buildGroupMap(filteredRows), [filteredRows]);
  const visibleRows = filteredRows.slice(0, visibleCount);

  table.options.meta = { groupMap };

  useEffect(() => {
    onFilteredRowsChange?.(filteredRows.map((r) => r.original));
  }, [filteredRows, onFilteredRowsChange]);

  // Reset visible count whenever the filtered set size changes (data load or filter change)
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [totalRows]);

  // Scroll to card top (−10px padding) only on user-triggered filter/search changes.
  // Guard ref skips the initial mount so page load never triggers a scroll.
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

  // IntersectionObserver: rootMargin 300px preloads next batch before user reaches bottom —
  // no artificial delay, no scroll freeze. Observer rebuilds on each visibleCount change,
  // naturally preventing double-fire.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= totalRows) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, totalRows));
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, totalRows]);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <Table className="table-fixed min-w-[900px]">
          <colgroup>
            <col style={{ width: COL_WIDTHS.type }} />
            <col />
            <col />
            <col style={{ width: COL_WIDTHS.aspects }} />
            <col style={{ width: COL_WIDTHS.source }} />
          </colgroup>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer select-none whitespace-nowrap text-[11px] uppercase tracking-wider font-semibold text-muted-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{ asc: " ↑", desc: " ↓" }[
                        header.column.getIsSorted() as string
                      ] ?? null}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-64 text-center"
                >
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
                        className={`cursor-pointer animate-fade-in-up transition-colors hover:bg-muted/50 ${
                          rowIndex % 2 === 1 ? "bg-muted/20" : ""
                        } ${
                          showGroupBorder
                            ? "border-l-2 border-l-primary/30"
                            : ""
                        } ${row.getIsExpanded() ? "border-b-0" : ""}`}
                        style={{
                          animationDelay: `${Math.min(rowIndex, 24) * 20}ms`,
                        }}
                        onClick={() => row.toggleExpanded()}
                        data-state={
                          row.getIsExpanded() ? "expanded" : undefined
                        }
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell key={cell.id}>
                            {cellIndex === 0 ? (
                              // Type + chevron: fixed height, chevron rotates on expand
                              <div className="flex h-19 items-center gap-1.5 overflow-hidden">
                                <ChevronRight
                                  className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                    row.getIsExpanded() ? "rotate-90" : ""
                                  }`}
                                />
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            ) : cell.column.id === "aspects" ? (
                              // Gradient mask fades chips at right edge — background-color agnostic
                              <div
                                className="flex h-19 items-center overflow-hidden"
                                style={{
                                  maskImage:
                                    "linear-gradient(to right, black calc(100% - 3rem), transparent 100%)",
                                }}
                              >
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            ) : cell.column.id === "description" ||
                              cell.column.id === "solution" ? (
                              // Static wrapper — height animated by the expanded row below, not here
                              <div className="flex min-h-19 items-center py-3">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            ) : (
                              <div className="flex h-19 items-center overflow-hidden">
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow
                        className={`hover:bg-transparent ${
                          row.getIsExpanded() ? "border-b" : "border-b-0"
                        }`}
                      >
                        {/* box-shadow on <tr> has no browser support — must be on <td> */}
                        <TableCell
                          colSpan={columns.length}
                          className="bg-p4d-ecru/60 p-0"
                          style={
                            row.getIsExpanded()
                              ? {
                                  boxShadow:
                                    ELEVATION_SHADOW[row.original.type],
                                }
                              : undefined
                          }
                        >
                          <AnimatedExpandedRow
                            item={row.original}
                            aspects={aspects}
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
        </Table>
      </div>

      {/* Invisible sentinel — IntersectionObserver fires 300px before this enters the viewport */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {totalRows > 0 && (
        <p className="py-2 text-center text-sm text-muted-foreground">
          {visibleCount < totalRows
            ? `Showing ${visibleCount} of ${totalRows} items`
            : `${totalRows} item${totalRows !== 1 ? "s" : ""}`}
        </p>
      )}
    </div>
  );
};

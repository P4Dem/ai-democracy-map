"use client";

import { AspectDialog } from "@/components/AspectDialog";
import { DataTable } from "@/components/DataTable";
import { FilterBar } from "@/components/FilterBar";
import { IntroSection } from "@/components/IntroSection";
import { SkeletonIntroSection } from "@/components/SkeletonIntroSection";
import { SkeletonTable } from "@/components/SkeletonTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useDataLoader } from "@/hooks/useDataLoader";
import { useFilters } from "@/hooks/useFilters";
import type { Item } from "@/lib/types";
import { exportToCsv } from "@/lib/utils";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const ThreatMap = () => {
  const { items, aspects, isLoading, error } = useDataLoader();
  const { filters, setFilter, resetFilters, activeFilterCount } = useFilters();
  const cardRef = useRef<HTMLDivElement>(null);

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const cf: ColumnFiltersState = [];
    if (filters.type.length > 0) cf.push({ id: "type", value: filters.type });
    if (filters.aspect.length > 0)
      cf.push({ id: "aspects", value: filters.aspect });
    if (filters.source.length > 0)
      cf.push({ id: "sourceShort", value: filters.source });
    return cf;
  }, [filters.type, filters.aspect, filters.source]);

  const tableRef = useMemo(() => ({ current: null as Item[] | null }), []);

  const handleExport = useCallback(() => {
    if (tableRef.current) {
      exportToCsv(tableRef.current, aspects);
      toast.success(`Exported ${tableRef.current.length} items to CSV`);
    }
  }, [tableRef, aspects]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);

  // The sentinel div only exists in the main render path (after loading).
  // With [] deps, this effect ran on mount during the loading state when
  // sentinelRef.current was null — observer was never created.
  const sentinelReady = !isLoading && !error;

  useEffect(() => {
    if (!sentinelReady) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only go sticky when sentinel has scrolled ABOVE the viewport (top < 0).
        // Without this check, sentinel BELOW the fold on initial load also
        // triggers isSticky=true because isIntersecting is false for both cases.
        const above = entry.boundingClientRect.top < 0;
        setIsSticky(!entry.isIntersecting && above);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelReady]);

  // Padding animation via style API — Tailwind v4 `px-8` generates
  // `padding-inline`, NOT `padding-left`/`padding-right`. We must animate
  // the same property so the browser can interpolate between the CSS class
  // value and the inline override. Setting paddingInline to "" restores the
  // Tailwind class; the browser transitions between the two computed values.
  useEffect(() => {
    const isEmbedded = useMemo(() => {
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    return url.searchParams.get("embed") === "true";
  }, []);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || isEmbedded) return;
    // Entering sticky: fast snap (120ms). Returning: slower settle (250ms).
    el.style.transition = isSticky
      ? "padding-inline 120ms cubic-bezier(0.16, 1, 0.3, 1)"
      : "padding-inline 250ms cubic-bezier(0.33, 1, 0.68, 1)";
    // Force synchronous layout so the browser commits the transition property
    // before we change the value. Without this, both changes batch into one
    // frame and the transition never fires.
    void el.offsetHeight;
    el.style.paddingInline = isSticky ? "1rem" : "";
  }, [isSticky, isEmbedded]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        ref={wrapperRef}
        className={
          isEmbedded
            ? ""
            : "mx-auto max-w-screen-2xl px-4 sm:px-8"
        }
      >
        {!isEmbedded && <SkeletonIntroSection />}
        <Card className={isEmbedded ? "mt-0 border-0 shadow-none" : "mt-8"}>
          <CardContent className="p-0">
            <SkeletonTable />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <AspectDialog />
      <div
        ref={wrapperRef}
        className={
          isEmbedded
            ? ""
            : "mx-auto max-w-screen-2xl px-4 sm:px-8"
        }
      >
        {!isEmbedded && (
          <>
            <IntroSection />
            <div ref={sentinelRef} className="-mt-20" />
          </>
        )}

        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 20,
            }}
          >
            <Card
              ref={cardRef}
              className={isEmbedded ? "border-0 shadow-none" : "mt-8"}
            >
              <CardContent className="p-0">
                <FilterBar
                  aspects={aspects}
                  filters={filters}
                  setFilter={setFilter}
                  resetFilters={resetFilters}
                  activeFilterCount={activeFilterCount}
                  onExport={handleExport}
                  isSticky={isSticky}
                  isEmbedded={isEmbedded}
                />
                <DataTable
                  items={items}
                  aspects={aspects}
                  columnFilters={columnFilters}
                  tableRef={tableRef}
                />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
      <Toaster />
    </TooltipProvider>
  );
};
  }, [isSticky]);

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      {/* IntroSection — constant padding, skeleton → real via AnimatePresence */}
      <div className="px-8 lg:px-16">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="skeleton-intro"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              <SkeletonIntroSection />
            </motion.div>
          ) : (
            <motion.div
              key="real-intro"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <IntroSection items={items} aspects={aspects} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sentinel sits between intro and table — fires isSticky when scrolled past */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {/* Table section — only this container's padding animates when sticky */}
      <div ref={wrapperRef} className="px-8 lg:px-16">
        {isLoading ? (
          <Card>
            <CardContent>
              <SkeletonTable />
            </CardContent>
          </Card>
        ) : (
          <>
            <FilterBar
              items={items}
              aspects={aspects}
              filters={filters}
              setFilter={setFilter}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
              onExport={handleExport}
              isSticky={isSticky}
            />
            <Card
              className={`animate-fade-in-up pt-0${isSticky ? "" : " rounded-t-none"}`}
              ref={cardRef}
            >
              <CardContent className="px-0">
                <DataTable
                  items={items}
                  aspects={aspects}
                  globalFilter={filters.search}
                  columnFilters={columnFilters}
                  onFilteredRowsChange={(rows) => {
                    tableRef.current = rows;
                  }}
                  scrollTargetRef={cardRef}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AspectDialog />
      <Toaster position="bottom-right" />
    </TooltipProvider>
  );
};

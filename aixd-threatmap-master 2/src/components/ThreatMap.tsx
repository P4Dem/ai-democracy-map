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

  const isEmbedded = useMemo(() => {
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    return url.searchParams.get("embed") === "true" || window.self !== window.top;
  }, []);

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

  const sentinelReady = !isLoading && !error && !isEmbedded;

  useEffect(() => {
    if (!sentinelReady) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const above = entry.boundingClientRect.top < 0;
        setIsSticky(!entry.isIntersecting && above);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelReady]);

  // Sticky for embedded mode: use scroll position since there's no sentinel
  useEffect(() => {
    if (!isEmbedded) return;
    const onScroll = () => setIsSticky(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isEmbedded]);

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
      {!isEmbedded && (
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
      )}

      {!isEmbedded && <div ref={sentinelRef} aria-hidden className="h-px" />}

      <div
        ref={wrapperRef}
        className={isEmbedded ? "" : "px-8 lg:px-16"}
      >
        {isLoading ? (
          <Card className={isEmbedded ? "border-0 shadow-none" : ""}>
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
              className={`animate-fade-in-up pt-0${isSticky ? "" : " rounded-t-none"}${isEmbedded ? " border-0 shadow-none" : ""}`}
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

      <AnimatePresence>
        {isSticky && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-md transition-colors hover:bg-foreground/80"
            aria-label="Back to top"
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
};

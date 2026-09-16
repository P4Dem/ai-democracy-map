"use client";

import { AspectBubbleMap } from "@/components/AspectBubbleMap";
import { BipartiteMorphMap } from "@/components/BipartiteMorphMap";
import { HarmMechanismMap } from "@/components/HarmMechanismMap";
import { MapCarousel } from "@/components/MapCarousel";
import { FloatingFeedback } from "@/components/FloatingFeedback";
import { PathwayBandsMap } from "@/components/PathwayBandsMap";
import { AspectDialog } from "@/components/AspectDialog";
import { DataTable } from "@/components/DataTable";
import { FilterBar } from "@/components/FilterBar";
import { IntroSection } from "@/components/IntroSection";
import { SkeletonIntroSection } from "@/components/SkeletonIntroSection";
import { SkeletonTable } from "@/components/SkeletonTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useDataLoader } from "@/hooks/useDataLoader";
import { useFilters } from "@/hooks/useFilters";
import type { Item, VizFilter } from "@/lib/types";
import { exportToCsv } from "@/lib/utils";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const ThreatMap = () => {
  const { items, aspects, harmTaxonomy, benefitTaxonomy, isLoading, error } = useDataLoader();
  const { filters, setFilter, resetFilters, activeFilterCount } = useFilters();
  const cardRef = useRef<HTMLDivElement>(null);

  const isEmbedded = useMemo(() => {
    if (typeof window === "undefined") return false;
    const url = new URL(window.location.href);
    return url.searchParams.get("embed") === "true";
  }, []);

  const isInIframe = useMemo(() => {
    if (typeof window === "undefined") return false;
    try { return window.self !== window.top; } catch { return true; }
  }, []);

  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const cf: ColumnFiltersState = [];
    if (filters.type.length > 0) cf.push({ id: "type", value: filters.type });
    if (filters.aspect.length > 0)
      cf.push({ id: "aspects", value: filters.aspect });
    if (filters.source.length > 0)
      cf.push({ id: "sourceShort", value: filters.source });
    if (filters.harm.length > 0) cf.push({ id: "harm", value: filters.harm });
    if (filters.benefit.length > 0)
      cf.push({ id: "benefit", value: filters.benefit });
    return cf;
  }, [filters.type, filters.aspect, filters.source, filters.harm, filters.benefit]);

  const tableRef = useMemo(() => ({ current: null as Item[] | null }), []);

  const expandCodes = useCallback(
    (key: VizFilter["key"], codes: string[]) => {
      if (key === "aspect") return codes;
      const pool = Object.keys(
        key === "harm" ? harmTaxonomy.codes : benefitTaxonomy.codes
      );
      return [
        ...new Set(
          codes.flatMap((prefix) =>
            pool.filter((c) => {
              if (c === prefix) return true;
              if (!c.startsWith(prefix)) return false;
              const next = c[prefix.length];
              return next !== undefined && !/[0-9]/.test(next);
            })
          )
        ),
      ];
    },
    [harmTaxonomy, benefitTaxonomy]
  );

  // A map click only *suggests* a filter (the panel shows an "Apply filter …"
  // button). This applies it: the newest carousel suggestion *replaces* any
  // earlier carousel-applied filter for that category (previous suggestions no
  // longer union in), while other categories (search, type, aspect, source)
  // are left untouched. Then it jumps to the table.
  const applyVizFilter = useCallback(
    (target: VizFilter) => {
      setFilter(target.key, expandCodes(target.key, target.codes));
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setFilter, expandCodes]
  );

  const handleExport = useCallback(() => {
    if (tableRef.current) {
      exportToCsv(tableRef.current, aspects);
      toast.success(`Exported ${tableRef.current.length} items to CSV`);
    }
  }, [tableRef, aspects]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [showBackLabel, setShowBackLabel] = useState(false);
  const backLabelShown = useRef(false);

  // Sentinel observer runs on standalone + iframe (but not ?embed=true, which has no IntroSection)
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

  // Sticky for ?embed=true: no IntroSection – always sticky (filterbar is at top of embed viewport)
  useEffect(() => {
    if (!isEmbedded) return;
    setIsSticky(true);
  }, [isEmbedded]);

  // Sticky for iframe: filterbar is at the top of the iframe viewport, so it's
  // always sticky. Also listens for parentScroll messages for backward compat.
  useEffect(() => {
    if (!isInIframe || isEmbedded || isLoading) return;
    setIsSticky(true);
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "parentScroll") return;
      const el = wrapperRef.current;
      if (!el) return;
      setIsSticky(e.data.iframeTop + el.offsetTop <= 0);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isInIframe, isEmbedded, isLoading]);

  // Post content height to parent so it can resize the iframe to fit all content (Option B resize).
  // Fires on mount and whenever the body resizes (data load, filter changes, row expansions).
  useEffect(() => {
    if (!isInIframe) return;
    const send = () =>
      window.parent.postMessage(
        { type: "iframeResize", height: document.documentElement.scrollHeight },
        "*"
      );
    send();
    const ro = new ResizeObserver(send);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [isInIframe]);

  // Show "Back to top" label the first time the button appears, then collapse to icon only
  useEffect(() => {
    if (!isSticky) {
      backLabelShown.current = false;
      return;
    }
    if (backLabelShown.current) return;
    backLabelShown.current = true;
    setShowBackLabel(true);
    const t = setTimeout(() => setShowBackLabel(false), 2500);
    return () => clearTimeout(t);
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

      {!isEmbedded && !isLoading && (
        <div className="px-8 pt-10 lg:px-16">
          <p className="p4d-underline-hover mb-4 text-[15.5px] font-bold text-foreground">
            Explore findings from our initial literature analysis{" "}
            <span className="font-medium text-foreground/70">
              (click on the icons to explore)
            </span>
            {/* "for more information on our codes systems and processes, click
                here" – pulled per client request (2026-09-14) until the link
                target is ready; follow-up expected from Mrinalini. */}
          </p>
          <p className="mb-4 max-w-[1180px] text-[13px] leading-relaxed text-foreground/60">
            Each entry collected from the literature is coded with three categories (codebooks)
            that help analyse the entry: the aspects of democracy it affects, categorisation that
            uses a slightly modified version of an International IDEA framework of democracy; the
            mechanisms that enable the harm to democracy (used to categorise threats); and the
            activities that bring the benefit to democracy (used to categorise mitigation
            strategies and opportunities). The latter two code systems have been developed
            inductively by Power for Democracies, based on the data in this dataset.
          </p>
          <MapCarousel>
            <AspectBubbleMap items={items} aspects={aspects} onFilterTable={applyVizFilter} />
            <HarmMechanismMap items={items} harmTaxonomy={harmTaxonomy} onFilterTable={applyVizFilter} />
            <BipartiteMorphMap harmTaxonomy={harmTaxonomy} benefitTaxonomy={benefitTaxonomy} onFilterTable={applyVizFilter} />
            <PathwayBandsMap harmTaxonomy={harmTaxonomy} onFilterTable={applyVizFilter} />
          </MapCarousel>
          <p className="mt-7 max-w-[1180px] text-[14.5px] leading-[1.65] text-foreground/70">
            Explore our map by filtering based on impact type (threat, threat paired with a
            mitigation strategy, opportunity), aspect of democracy, harms mechanism,
            pro-democracy activity, and source (from which the entry was extracted).
            <br />
            You can copy
            individual verbatims or download the entire map for better analysis.
          </p>
        </div>
      )}

      {!isEmbedded && <div ref={sentinelRef} aria-hidden className="h-px" />}

      {/* No max-width cap here (unlike the hero/carousel sections above) –
          the table needs 1320px (7 columns) to breathe, and production
          (master 2) never caps this wrapper either, just padding. Capping
          it to 1180px was forcing every column narrower than its own
          declared min-width, which is why chips/text were truncating more
          aggressively here than on the live site. */}
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
            <div className="mb-4 flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">Explore the map</span>
              <Popover>
                <PopoverTrigger className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground/50 hover:text-muted-foreground cursor-pointer">
                  <Info className="size-3" />
                </PopoverTrigger>
                <PopoverContent side="bottom" align="start" className="w-72">
                  <PopoverHeader>
                    <PopoverTitle>How to explore the map</PopoverTitle>
                  </PopoverHeader>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Filter or search by:
                  </p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
                    <li>Impact type (threat; threat paired with a mitigation strategy; opportunity)</li>
                    <li>Aspects of democracy</li>
                    <li>Harm mechanism</li>
                    <li>Pro-democracy activities</li>
                    <li>Source – the publication each entry was extracted from</li>
                  </ul>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click a row to see the full verbatim quotes and complete mechanism / aspect
                    coding, or download the entire map for further analysis.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <FilterBar
              items={items}
              aspects={aspects}
              harmTaxonomy={harmTaxonomy}
              benefitTaxonomy={benefitTaxonomy}
              filters={filters}
              setFilter={setFilter}
              resetFilters={resetFilters}
              activeFilterCount={activeFilterCount}
              onExport={handleExport}
              isSticky={isSticky}
            />
            <Card
              className={`animate-fade-in-up overflow-x-auto pt-0${isEmbedded ? " border-0 shadow-none" : ""}`}
              style={{
                borderTopLeftRadius: isSticky ? undefined : 0,
                borderTopRightRadius: isSticky ? undefined : 0,
                transition: "border-top-left-radius 200ms ease-out, border-top-right-radius 200ms ease-out",
              }}
              ref={cardRef}
            >
              <CardContent className="px-0">
                <DataTable
                  items={items}
                  aspects={aspects}
                  harmTaxonomy={harmTaxonomy}
                  benefitTaxonomy={benefitTaxonomy}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-20 right-6 z-50 flex items-center gap-2"
          >
            <AnimatePresence>
              {showBackLabel && (
                <motion.span
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-md"
                >
                  Back to top
                </motion.span>
              )}
            </AnimatePresence>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                if (isInIframe) {
                  window.parent.postMessage({ type: "scrollToTop" }, "*");
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-md hover:bg-foreground/80"
              aria-label="Back to top"
            >
              ↑
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingFeedback />
    </TooltipProvider>
  );
};

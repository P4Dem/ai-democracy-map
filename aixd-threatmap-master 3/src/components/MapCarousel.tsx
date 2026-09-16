"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, Children } from "react";

export const MapCarousel = ({
  children,
  footer,
}: {
  children: ReactNode | ReactNode[];
  // Optional slot rendered below the dots, inside the carousel card –
  // separated by a rule + generous top padding so it doesn't read as
  // part of the pagination.
  footer?: ReactNode;
}) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  // `index` is the click/dot-intended target – it jumps instantly so the
  // dots and arrow disabled-states give immediate feedback. `visibleIndex`
  // only ever moves in response to a real scroll event (see onScroll below),
  // so it tracks whatever panel is ACTUALLY on screen right now.
  const [index, setIndex] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(0);
  // Panels vary a lot in natural height (e.g. the aspect bubble map vs. the
  // dense mechanism graphs). A plain flex row stretches every slide to match
  // the tallest one, which strands the pagination dots and footer far below
  // a shorter panel's real content. Instead we measure the panel that's
  // ACTUALLY visible (visibleIndex, not the click-intent index) and size the
  // scroller to just that. Sizing off click-intent instead left a window –
  // during the ~300-500ms smooth-scroll, or on a second click fired before
  // the first scroll finished – where the container had already resized to
  // the target panel's height while the screen still showed the shorter
  // panel mid-transition: a block of dead white space under the visible
  // content until the scroll caught up.
  const [height, setHeight] = useState<number | undefined>(undefined);
  // Arrows are anchored OUTSIDE the height-changing slide track (which is
  // sized to the active panel) at the vertical center of the TALLEST panel,
  // measured once. Anchoring them to the track would make them ride up/down
  // as slide heights differ – a fixed chrome anchor keeps them still while
  // clicking through rapidly, even though the viz below resizes.
  const [arrowCenter, setArrowCenter] = useState<number | undefined>(undefined);
  const panels = Children.toArray(children);
  const count = panels.length;

  useLayoutEffect(() => {
    const el = panelRefs.current[visibleIndex];
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    // Re-measure after paint (late web-font / async data layout) and on
    // viewport resize, so the scroller can never stay taller than the
    // active panel and strand the dots below a block of white space.
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [visibleIndex]);

  useLayoutEffect(() => {
    const els = panelRefs.current.filter((el): el is HTMLDivElement => Boolean(el));
    if (!els.length) return;
    const measure = () => {
      let max = 0;
      for (const el of els) max = Math.max(max, el.offsetHeight);
      if (max > 0) setArrowCenter((prev) => (prev === max / 2 ? prev : max / 2));
    };
    const ro = new ResizeObserver(measure);
    els.forEach((el) => ro.observe(el));
    measure();
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [panels]);

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(count - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    // index still tracks scroll too (so a swipe/drag – not just a click –
    // keeps the dots and arrow states in sync), but visibleIndex is the only
    // thing that drives height, and only this handler ever sets it.
    setIndex(i);
    setVisibleIndex(i);
  };

  return (
    <div className="relative">
      <div className="mx-10 rounded-[20px] border border-border bg-card">
        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="p4d-hide-scrollbar flex overflow-x-auto"
            style={{
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              height: height ? `${height}px` : undefined,
            }}
          >
            {panels.map((panel, i) => (
              <div
                key={i}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                className="flex min-w-full flex-col self-start p-5 pb-3 sm:p-6 sm:pb-3"
                style={{ scrollSnapAlign: "start" }}
              >
                {panel}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4 pt-2">
          {panels.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to map ${i + 1}`}
              onClick={() => scrollToIndex(i)}
              className="cursor-pointer rounded-full border-none p-0"
              style={{
                width: i === index ? 18 : 6,
                height: 6,
                background: i === index ? "var(--color-p4d-brick)" : "var(--color-p4d-border, #D6D6CA)",
                transition: "width 150ms ease",
              }}
            />
          ))}
        </div>

        {footer && (
          <div className="flex justify-center border-t border-border px-5 pb-5 pt-5 sm:px-6">
            {footer}
          </div>
        )}
      </div>

      {arrowCenter !== undefined && (
        <>
          <button
            aria-label="Previous map"
            onClick={() => scrollToIndex(index - 1)}
            disabled={index === 0}
            className="absolute z-10 flex size-9 items-center justify-center rounded-full text-base text-background disabled:cursor-default"
            style={{
              top: arrowCenter,
              left: 0,
              transform: "translateY(-50%)",
              background: index === 0 ? "#1a1a1740" : "#1a1a17",
              color: "#fff",
            }}
          >
            ‹
          </button>
          <button
            aria-label="Next map"
            onClick={() => scrollToIndex(index + 1)}
            disabled={index === count - 1}
            className="absolute z-10 flex size-9 items-center justify-center rounded-full text-base text-background disabled:cursor-default"
            style={{
              top: arrowCenter,
              right: 0,
              transform: "translateY(-50%)",
              background: index === count - 1 ? "#1a1a1740" : "#1a1a17",
              color: "#fff",
            }}
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

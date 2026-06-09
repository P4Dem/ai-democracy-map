// Shimmer skeleton for IntroSection — mirrors the exact layout/spacing of the real component.
// Uses .animate-shimmer from globals.css instead of animate-pulse.

// ─── Stat quadrant skeleton ──────────────────────────────────────────────────

const SkeletonStatCell = ({
  isLeft,
  isTop,
}: {
  isLeft: boolean;
  isTop: boolean;
}) => (
  <div
    className={[
      "flex flex-col",
      isLeft ? "pr-8 border-r border-border/25" : "pl-8",
      isTop  ? "pb-6 border-b border-border/25" : "pt-6",
    ].join(" ")}
  >
    {/* number placeholder — matches text-5xl font-bold leading-none */}
    <div className="h-12 w-16 animate-shimmer rounded" />
    {/* label placeholder — matches text-xs uppercase tracking-wide */}
    <div className="mt-2 h-3 w-20 animate-shimmer rounded" />
  </div>
);

const SkeletonStatQuadrant = () => (
  <div className="grid grid-cols-2">
    {[0, 1, 2, 3].map((i) => (
      <SkeletonStatCell key={i} isLeft={i % 2 === 0} isTop={i < 2} />
    ))}
  </div>
);

// ─── Pillar column skeleton ───────────────────────────────────────────────────

const SkeletonPillarColumn = () => (
  <div className="flex flex-col gap-3">
    {/* pillar dot + label */}
    <div className="flex items-start gap-2">
      <div className="mt-1 size-2 shrink-0 rounded-full animate-shimmer" />
      <div className="h-3 w-full animate-shimmer rounded" />
    </div>
    {/* count — matches text-4xl font-bold */}
    <div className="h-10 w-8 animate-shimmer rounded" />
    {/* aspect chip badges */}
    <div className="flex flex-wrap gap-1.5">
      <div className="h-5 w-16 animate-shimmer rounded-full" />
      <div className="h-5 w-20 animate-shimmer rounded-full" />
      <div className="h-5 w-12 animate-shimmer rounded-full" />
      <div className="h-5 w-24 animate-shimmer rounded-full" />
    </div>
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const SkeletonIntroSection = () => (
  <div className="mb-8">
    {/* ── Top: text columns (left) + stat quadrant (right) ── */}
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_auto] lg:gap-16">
      {/* Left — two shimmer text columns */}
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {[0, 1].map((col) => (
          <div key={col} className="space-y-2">
            <div className="h-4 w-full animate-shimmer rounded" />
            <div className="h-4 w-full animate-shimmer rounded" />
            <div className="h-4 w-3/4  animate-shimmer rounded" />
            <div className="h-4 w-full animate-shimmer rounded" />
            <div className="h-4 w-5/6  animate-shimmer rounded" />
            <div className="h-4 w-full animate-shimmer rounded" />
            <div className="h-4 w-2/3  animate-shimmer rounded" />
          </div>
        ))}
      </div>

      {/* Right — stat quadrant */}
      <SkeletonStatQuadrant />
    </div>

    {/* ── Below: Democracy Framework pillar grid ── */}
    <div className="mt-10 border-t border-border/30 pt-6">
      {/* section label */}
      <div className="mb-5 h-3 w-36 animate-shimmer rounded" />
      <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:grid-cols-4 lg:gap-x-10">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonPillarColumn key={i} />
        ))}
      </div>
    </div>
  </div>
);

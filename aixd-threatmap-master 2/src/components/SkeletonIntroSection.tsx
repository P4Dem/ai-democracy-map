// Shimmer skeleton for IntroSection — mirrors the exact layout/spacing of the real component.
// Uses .animate-shimmer from globals.css instead of animate-pulse.

// ─── Data overview box skeleton ───────────────────────────────────────────────

const SkeletonStatTile = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex flex-col justify-center gap-2 rounded-md bg-foreground/5 p-4 ${className}`}
  >
    {/* number placeholder */}
    <div className="h-9 w-14 animate-shimmer rounded" />
    {/* label placeholder */}
    <div className="h-2.5 w-16 animate-shimmer rounded" />
  </div>
);

const SkeletonDataOverview = () => (
  <div className="grid shrink-0 grid-cols-[1fr_1fr_0.85fr] grid-rows-2 gap-1.5 sm:w-85">
    <SkeletonStatTile className="col-start-1 row-span-2 row-start-1" />
    <SkeletonStatTile className="col-start-2 row-span-2 row-start-1" />
    <SkeletonStatTile className="col-start-3 row-start-1" />
    <SkeletonStatTile className="col-start-3 row-start-2" />
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
    {/* ── Title placeholder ── */}
    <div className="mb-6 pt-8 space-y-2 lg:pt-12">
      <div className="h-7 w-3/4 animate-shimmer rounded lg:h-8" />
      <div className="h-7 w-1/2 animate-shimmer rounded lg:h-8" />
    </div>

    {/* ── Data overview box: stat tiles (left) + intro copy (right) ── */}
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
      <SkeletonDataOverview />
      <div className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          <div className="h-4 w-full animate-shimmer rounded" />
          <div className="h-4 w-full animate-shimmer rounded" />
          <div className="h-4 w-3/4 animate-shimmer rounded" />
          <div className="h-4 w-5/6 animate-shimmer rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full animate-shimmer rounded" />
          <div className="h-4 w-full animate-shimmer rounded" />
          <div className="h-4 w-2/3 animate-shimmer rounded" />
        </div>
      </div>
    </div>

    {/* ── TEXT 2 ── */}
    <div className="mt-8 h-4 w-2/3 animate-shimmer rounded" />

    {/* ── Democracy Framework box ── */}
    <div className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-8">
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

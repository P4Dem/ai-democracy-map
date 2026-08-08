"use client";

import { AspectChips } from "@/components/AspectChips";
import type { AspectMap, Item } from "@/lib/types";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

// ─── Count-up ─────────────────────────────────────────────────────────────────

const useCountUp = (target: number, duration = 650, delay = 0): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target == null) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) {
      setCount(target);
      return;
    }

    let rafId: number;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        // Linear, not eased — an ease-out curve front-loads almost the
        // whole count into the first fifth of the duration (e.g. Sources
        // would hit 10 by ~145ms then sit idle), which reads as a flicker
        // rather than a visible 0, 1, 2 … climb. Linear spends the full
        // duration ticking through every value.
        setCount(Math.round(progress * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
        else setCount(target);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay]);

  return count;
};

// ─── Data overview box ────────────────────────────────────────────────────────

type StatVariant = "primary" | "secondary" | "tertiary";

type StatDef = {
  label: string;
  variant: StatVariant;
  getValue: (items: Item[]) => number;
};

// Reading order = grid order: Sources, then Entries (equal-size lead tiles),
// then Threats / Mitigations mapped stacked in the rightmost column.
const STAT_DEFS: StatDef[] = [
  {
    label: "Sources",
    variant: "primary",
    getValue: (items) => new Set(items.map((i) => i.sourceShort)).size,
  },
  {
    label: "Entries",
    variant: "secondary",
    getValue: (items) => items.length,
  },
  {
    label: "Threats",
    variant: "tertiary",
    getValue: (items) =>
      items.filter((i) => i.type === "threat" || i.type === "threat-solution")
        .length,
  },
  {
    label: "Mitigations mapped",
    variant: "tertiary",
    getValue: (items) =>
      items.filter((i) => i.type === "threat-solution").length,
  },
];

const VARIANT_STYLES: Record<
  StatVariant,
  { box: string; number: string; label: string }
> = {
  primary: {
    box: "justify-center bg-foreground/85 text-background",
    number: "text-5xl sm:text-6xl",
    label: "text-background/60",
  },
  // Same footprint/type scale as primary — Sources and Entries read as an
  // equal pair — just a lighter fill so Sources still leads.
  secondary: {
    box: "justify-center bg-foreground/10 text-foreground",
    number: "text-5xl sm:text-6xl",
    label: "text-foreground/45",
  },
  tertiary: {
    box: "bg-foreground/5 text-foreground",
    number: "text-2xl sm:text-3xl",
    label: "text-foreground/45",
  },
};

// Each tile needs its own component so useCountUp is called at the top level
// of a React function (Rules of Hooks).
const StatTile = ({
  label,
  value,
  index,
  variant,
  className = "",
}: {
  label: string;
  value: number;
  index: number;
  variant: StatVariant;
  className?: string;
}) => {
  const count = useCountUp(value, 2800, index * 150);
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={`animate-fade-in-up flex flex-col justify-center gap-1 rounded-md p-4 ${styles.box} ${className}`}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className={`font-bold leading-none tabular-nums ${styles.number}`}>
        {count}
      </div>
      <div
        className={`text-[10px] font-medium uppercase tracking-wider ${styles.label}`}
      >
        {label}
      </div>
    </div>
  );
};

// 3-col / 2-row grid: Sources and Entries are equal-size tiles spanning both
// rows (cols 1–2); Threats/Mitigations stack in the rightmost column (col 3).
const DataOverview = ({
  stats,
}: {
  stats: { label: string; value: number; index: number; variant: StatVariant }[];
}) => (
  <div className="grid shrink-0 grid-cols-[1fr_1fr_0.85fr] grid-rows-2 gap-1.5 sm:w-85">
    <StatTile {...stats[0]} className="col-start-1 row-span-2 row-start-1" />
    <StatTile {...stats[1]} className="col-start-2 row-span-2 row-start-1" />
    <StatTile {...stats[2]} className="col-start-3 row-start-1" />
    <StatTile {...stats[3]} className="col-start-3 row-start-2" />
  </div>
);

// ─── Pillar columns ───────────────────────────────────────────────────────────

type PillarDef = {
  code: string;
  label: string;
  dotClass: string;
  // Darkened variants for pillars 3/4 whose brand colors are too light on ecru.
  // Matches text colors already used in AspectChips for consistency.
  countColor: string;
};

const PILLAR_DEFS: PillarDef[] = [
  {
    code: "1",
    label: "Citizenship, Law and Rights",
    dotClass: "bg-p4d-brick",
    countColor: "#963737",
  },
  {
    code: "2",
    label: "Representative and Accountable Government",
    dotClass: "bg-p4d-grassroot",
    countColor: "#00B140",
  },
  {
    code: "3",
    label: "Civil Society and Popular Participation",
    dotClass: "bg-p4d-blue",
    countColor: "#1a5c9a",
  },
  {
    code: "4",
    label: "Transnational Dynamics",
    dotClass: "bg-p4d-lime",
    countColor: "#5a5a00",
  },
];

const PillarColumn = ({
  pillar,
  count,
  aspectCodes,
  aspects,
  index,
}: {
  pillar: PillarDef;
  count: number;
  aspectCodes: string[];
  aspects: AspectMap;
  index: number;
}) => {
  // Count-up is reserved for the Hero stat tiles above — pillar counts just
  // fade/slide in with the rest of the column (via motion.div below).

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.4, 0, 0.2, 1],
        delay: 0.6 + index * 0.06,
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-start gap-2">
        <span
          className={`mt-1 size-2 shrink-0 rounded-full ${pillar.dotClass}`}
        />
        <span className="text-xs leading-snug text-foreground/60">
          {pillar.label}
        </span>
      </div>

      <div
        className="text-4xl font-bold leading-none tabular-nums"
        style={{ color: pillar.countColor }}
      >
        {count}
      </div>

      <div
        className="overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(to right, black calc(100% - 2rem), transparent 100%)",
        }}
      >
        <AspectChips codes={aspectCodes} aspects={aspects} maxVisible={99} />
      </div>
    </motion.div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

type IntroSectionProps = {
  items: Item[];
  aspects: AspectMap;
};

export const IntroSection = ({ items, aspects }: IntroSectionProps) => {
  const stats = STAT_DEFS.map((def, i) => ({
    label: def.label,
    variant: def.variant,
    value: def.getValue(items),
    index: i,
  }));

  const pillars = PILLAR_DEFS.map((p, i) => ({
    ...p,
    index: i,
    count: items.filter((item) =>
      item.aspects.some((a) => a.startsWith(`${p.code}.`))
    ).length,
    aspectCodes: Object.values(aspects)
      .filter((a) => a.pillarCode === p.code)
      .map((a) => a.code),
  }));

  return (
    <div className="mb-8">
      <h1 className="mb-6 pt-8 text-2xl font-bold leading-tight text-foreground lg:pt-12 lg:text-3xl">
        The AI–Democracy Landscape: A Map of Threats, Mitigations, and Opportunities
      </h1>

      {/* ── Data overview: stat tiles (left) + intro copy (right), one box ── */}
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
        <DataOverview stats={stats} />
        <div className="flex flex-col gap-4">
          <p className="text-base leading-relaxed text-foreground/70">
            The AI–Democracy Map synthesises threats, proposed mitigation
            strategies and opportunities for AI to improve democracy. This map is intended for
            researchers, policymakers, private organisations, civil society and anyone interested in
            an overview of which areas of democracy are affected by AI related threats
          </p>
          <p className="text-base leading-relaxed text-foreground/70">
            Our team reviewed a diverse set of literature and selected ten leading frameworks mapping
            AI threats. This initial selection reflects different disciplinary lenses, levels of
            abstraction and democratic contexts.
          </p>
        </div>
      </div>

      {/* ── TEXT 2 ── */}
      <p className="mt-8 text-base leading-relaxed text-foreground/70">
        Each entry is mapped onto the aspects of democracy it affects, using a slightly modified
        version of an International IDEA framework of democracy.
      </p>

      {/* ── Democracy Framework (pillar grid) in a box ── */}
      <div className="mt-6 rounded-lg border border-border bg-card p-6 sm:p-8">
        <div className="mb-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Democracy Framework
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 lg:gap-x-10">
          {pillars.map((p) => (
            <PillarColumn
              key={p.code}
              pillar={p}
              count={p.count}
              aspectCodes={p.aspectCodes}
              aspects={aspects}
              index={p.index}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

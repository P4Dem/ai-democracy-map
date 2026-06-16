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
        const eased = 1 - Math.pow(2, -10 * progress);
        setCount(Math.round(eased * target));
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

// ─── Stat quadrant ────────────────────────────────────────────────────────────

// Ordered: top-left, top-right, bottom-left, bottom-right
type StatDef = {
  label: string;
  getValue: (items: Item[]) => number;
  color: string;
};

const STAT_DEFS: StatDef[] = [
  {
    label: "Entries",
    getValue: (items) => items.length,
    color: "text-foreground",
  },
  {
    label: "Threats",
    getValue: (items) =>
      items.filter((i) => i.type === "threat" || i.type === "threat-solution")
        .length,
    color: "text-p4d-brick",
  },
  {
    label: "Mitigations mapped",
    getValue: (items) =>
      items.filter((i) => i.type === "threat-solution").length,
    color: "text-p4d-grassroot",
  },
  {
    label: "Sources",
    getValue: (items) => new Set(items.map((i) => i.sourceShort)).size,
    color: "text-foreground",
  },
];

// Each cell in the quadrant needs its own component so useCountUp
// is called at the top level of a React function (Rules of Hooks).
const StatCell = ({
  label,
  value,
  color,
  index,
}: {
  label: string;
  value: number;
  color: string;
  index: number;
}) => {
  const count = useCountUp(value, 650, index * 80);
  return (
    <div className="flex flex-col py-4">
      <div
        className={`text-5xl font-bold leading-none tabular-nums ${color} animate-fade-in-up`}
        style={{ animationDelay: `${index * 70}ms` }}
      >
        {count}
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
        {label}
      </div>
    </div>
  );
};

// 2×2 quadrant with hairline dividers — reads like a data matrix, not a dashboard.
// Right column shrinks to its natural content width via grid-cols-[1fr_auto].
const StatQuadrant = ({
  stats,
}: {
  stats: { label: string; value: number; color: string; index: number }[];
}) => (
  <div className="mt-6 grid grid-cols-2 lg:grid-cols-4">
    {stats.map((s) => (
      <StatCell
        key={s.label}
        label={s.label}
        value={s.value}
        color={s.color}
        index={s.index}
      />
    ))}
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

const PILLAR_START_DELAY = 800;
const PILLAR_STAGGER = 80;

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
  const animatedCount = useCountUp(
    count,
    550,
    PILLAR_START_DELAY + index * PILLAR_STAGGER
  );

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
        {animatedCount}
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
    ...def,
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
        AI–Democracy Map
      </h1>

      {/* ── TEXT 1: intro paragraphs stacked, stats below ── */}
      <div className="space-y-4">
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

      <StatQuadrant stats={stats} />

      {/* ── TEXT 2 ── */}
      <p className="mt-10 text-base leading-relaxed text-foreground/70">
        Each entry is mapped onto the aspects of democracy it affects, using a slightly modified
        version of an International IDEA framework of democracy.
      </p>

      {/* ── Democracy Framework (pillar grid) ── */}
      <div className="mt-10 border-t border-border/30 pt-6">
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

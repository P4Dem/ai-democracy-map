"use client";

import type { AspectMap, Item } from "@/lib/types";
import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

// The ten frameworks referenced in the intro copy – client-supplied list,
// shown in an info popover next to "ten frameworks" rather than spelled out
// in the paragraph itself.
const FRAMEWORKS: { citation: string; url: string }[] = [
  {
    citation:
      "Bengio, Y. (Chair) et al. (2026). International AI Safety Report 2026. Department for Science, Innovation and Technology (DSIT), UK Government.",
    url: "https://internationalaisafetyreport.org/sites/default/files/2026-02/international-ai-safety-report-2026_1.pdf",
  },
  {
    citation: "European Parliament (2020). Artificial Intelligence: Threats and Opportunities.",
    url: "https://www.europarl.europa.eu/topics/en/article/20200918STO87404/artificial-intelligence-threats-and-opportunities",
  },
  {
    citation:
      "George, R. and Klaus, I. (2026). AI and Democracy: Mapping the Intersections. Carnegie Endowment for International Peace.",
    url: "https://carnegieendowment.org/research/2026/01/ai-and-democracy-mapping-the-intersections?lang=en",
  },
  {
    citation:
      "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). AI Poses Risks to Democratic and Social Systems.",
    url: "https://zhijing-jin.com/d/2026-ai-risk.pdf",
  },
  {
    citation:
      "Jungherr, A. (2023). Artificial Intelligence and Democracy: A Conceptual Framework. University of Bamberg.",
    url: "https://fis.uni-bamberg.de/server/api/core/bitstreams/1c38477b-52ed-46f9-a2f7-6392b76036f6/content",
  },
  {
    citation: "KELA Cyber Intelligence (2025). 2025 AI Threat Report. March 2025.",
    url: "https://info.ke-la.com/hubfs/Reports/KELA%20Report%20-%202025%20AI%20Threat%20Report.pdf",
  },
  {
    citation:
      "National Institute of Standards and Technology (2023). AI Risk Management Framework (AI RMF 1.0). NIST.",
    url: "https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=936225",
  },
  {
    citation:
      "Ovadya, A., Redman, K., Thorburn, L., Chen, Q.Z., Smith, O., Devine, F., Konya, A., Milli, S., Revel, M., Feng, K.J.K., Zhang, A.X., Chandra, B., Bakker, M.A. and Kasirzadeh, A. (2024/2025). Democratic AI is Possible. The Democracy Levels Framework Shows How It Might Work. Position paper presented at ICML 2025. arXiv:2411.09222.",
    url: "https://arxiv.org/abs/2411.09222",
  },
  {
    citation:
      "Panditharatne, M., Norden, L., Zdanys, J., Weiner, D.I. and Abusaif, Y. (2025). An Agenda to Strengthen U.S. Democracy in the Age of AI. Brennan Center for Justice, February 13, 2025.",
    url: "https://www.brennancenter.org/our-work/policy-solutions/agenda-strengthen-us-democracy-age-ai",
  },
  {
    citation:
      "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI for Pro-Democracy Platforms. MIT Exploration of Generative AI.",
    url: "https://mit-genai.pubpub.org/pub/mn45hexw/release/1",
  },
];

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
        // Linear, not eased – an ease-out curve front-loads almost the
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
  value: number;
};

// Reading order = grid order: Sources, then Entries (equal-size lead tiles),
// then Threats / Mitigations mapped stacked in the rightmost column.
// Client-specified counts (Sep 2026) – hardcoded as requested.
const STAT_DEFS: StatDef[] = [
  { label: "Sources", variant: "primary", value: 10 },
  { label: "Entries", variant: "secondary", value: 204 },
  { label: "Threats", variant: "tertiary", value: 160 },
  {
    label: "Mitigations and opportunities mapped",
    variant: "tertiary",
    value: 161,
  },
];

const VARIANT_STYLES: Record<
  StatVariant,
  { box: string; number: string; label: string; tone: string }
> = {
  // Four distinct, very light flat neutrals (beige + grey) – one per tile.
  // No gradients: each tile is a single flat tone (mock STAT_TONES).
  primary: {
    box: "justify-center rounded-[14px] text-foreground",
    number: "text-5xl sm:text-6xl",
    label: "text-muted-foreground/80",
    tone: "#EAEAE3",
  },
  secondary: {
    box: "justify-center rounded-[14px] text-foreground",
    number: "text-5xl sm:text-6xl",
    label: "text-muted-foreground/80",
    tone: "#E1E1D9",
  },
  tertiary: {
    box: "justify-center rounded-[14px] text-foreground",
    number: "text-2xl sm:text-3xl",
    label: "text-muted-foreground/80",
    tone: "#F2ECDD",
  },
};

// Mitigations tile uses a slightly deeper beige than the Threats tile (mock).
const TERTIARY_TONES: Record<number, string> = {
  2: "#F2ECDD",
  3: "#ECE0C9",
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
      className={`animate-fade-in-up flex flex-col justify-center gap-1 p-4 sm:p-5 ${styles.box} ${className}`}
      style={{
        animationDelay: `${index * 70}ms`,
        background: variant === "tertiary" ? (TERTIARY_TONES[index] ?? styles.tone) : styles.tone,
      }}
    >
      <div className={`relative font-bold leading-none tabular-nums ${styles.number}`}>
        {/* Invisible spacer of the final value pins the tile to its end-size
            from mount, so the climbing count (overlaid, absolutely positioned)
            never changes the number's width and cannot reflow the row – the
            intro paragraph to the right holds still during the count-up. */}
        <span className="invisible">{value}</span>
        <span className="absolute inset-0" aria-hidden="true">
          {count}
        </span>
      </div>
      <div
        className={`mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${styles.label}`}
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
  <div className="grid shrink-0 basis-[340px] grid-cols-[1fr_1fr_0.85fr] grid-rows-2 gap-2.5 self-stretch">
    <StatTile {...stats[0]} className="col-start-1 row-span-2 row-start-1" />
    <StatTile {...stats[1]} className="col-start-2 row-span-2 row-start-1" />
    <StatTile {...stats[2]} className="col-start-3 row-start-1" />
    <StatTile {...stats[3]} className="col-start-3 row-start-2" />
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

type IntroSectionProps = {
  items: Item[];
  aspects: AspectMap;
};

export const IntroSection = ({ items, aspects }: IntroSectionProps) => {
  const stats = STAT_DEFS.map((def, i) => ({
    label: def.label,
    variant: def.variant,
    value: def.value,
    index: i,
  }));

  return (
    <div className="mb-8">
      <h1 className="mb-6 pt-8 text-2xl font-bold leading-tight text-foreground lg:pt-12 lg:text-3xl">
        Threats, solutions, and opportunities for democracy in the face of AI V2.0
      </h1>

      {/* ── Data overview: stat tiles (left) + intro copy (right) – bare on ecru ── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <DataOverview stats={stats} />
        <div className="flex flex-1 flex-col gap-4 sm:min-w-[320px]">
          <p className="text-base leading-relaxed text-foreground/70">
            The AI–Democracy Map synthesises threats, proposed mitigation strategies, and
            opportunities for AI to improve democracy. The map is intended for anyone seeking an
            overview of which areas of democracy are affected by AI-related threats, and which
            mitigations and opportunities arise from them
            {" "}– in particular civil society actors, researchers, and policymakers.
            <br />
            Our team
            reviewed a diverse set of literature and selected ten frameworks that systematically
            map AI threats
            <Popover>
              <PopoverTrigger className="mx-1 inline-flex size-4 shrink-0 items-center justify-center align-middle rounded-full text-muted-foreground/60 hover:text-muted-foreground cursor-pointer">
                <Info className="size-4" />
              </PopoverTrigger>
              <PopoverContent side="top" align="start" className="w-96 max-h-80 overflow-y-auto">
                <PopoverHeader>
                  <PopoverTitle>The ten frameworks</PopoverTitle>
                </PopoverHeader>
                <ol className="mt-1.5 list-decimal space-y-2.5 pl-4 text-sm text-muted-foreground">
                  {FRAMEWORKS.map((f, i) => (
                    <li key={i}>
                      {f.citation}{" "}
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        Available at ↗
                      </a>
                    </li>
                  ))}
                </ol>
              </PopoverContent>
            </Popover>
            . This initial selection
            reflects different disciplinary lenses, levels of abstraction, and democratic contexts.
          </p>
        </div>
      </div>
    </div>
  );
};

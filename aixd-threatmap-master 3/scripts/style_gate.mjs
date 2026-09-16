#!/usr/bin/env bun
/**
 * AIxD Threat Map — Visualization Style Gate ("De-Claude" guardrails)
 *
 * Machine-checkable subset of the Visualization Style Guide from PLAN.html.
 * Run via:  bun run stylecheck
 * Exit code is non-zero if any violation is found — treat as a hard gate at
 * the end of every visualization/carousel step.
 *
 * Scoping:
 *  - Per-panel rules (panel titles, footnote, SVG shadows/type) run ONLY on
 *    viz panel files: AspectBubbleMap, HarmMechanismMap, PathwayBandsMap.
 *  - Page-level box-shadows (e.g. sticky filterbar) are allowed; the shared
 *    tooltip's warm 8% shadow is allowed by the guardrail.
 *  - The feedback email subject line "Feedback from Website - AI Landscape Map"
 *    is whitelisted from the "landscape" ban-list check.
 *
 * Not every guardrail is automatable (tooltip field order, hover feel). Those
 * live in docs/viz-style-guardrails.md and must be ticked manually per panel.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIRS = ["src/components", "src/pages", "src/styles"];

const BAN_WORDS = [
  "delve",
  "harness",
  "unleash",
  "empower",
  "leverage",
  "robust",
  "cutting-edge",
  "seamless",
  "unlock",
];
const BAN_PHRASES = ["discover the", "in today's world", "landscape"];

// Client-mandated wording — the feedback email subject line contains
// "landscape" as the product name, not a buzzword.
const ALLOWED_TITLE =
  "Feedback from Website - AI Landscape Map";

const VIZ_FILE = /(AspectBubbleMap|HarmMechanismMap|PathwayBandsMap|BipartiteMorphMap)/i;
const isVizFile = (f) => VIZ_FILE.test(f);
const containsSvg = (src) => /<svg|createElementNS.*svg/i.test(src);

const RULES = [
  {
    key: "ban-word",
    label: "Copy — ban-list words/phrases (file-wide, title whitelisted)",
    scope: "all",
    fn: (src) => {
      const hits = [];
      const low = src.replace(ALLOWED_TITLE, "").toLowerCase();
      for (const w of BAN_WORDS) {
        if (new RegExp(`\\b${w}\\b`, "i").test(low)) hits.push(w);
      }
      for (const p of BAN_PHRASES) {
        if (low.includes(p)) hits.push(`"${p}"`);
      }
      return hits.length ? [`suspicious: ${[...new Set(hits)].join(", ")} (human-review: is it authored UI copy?)`] : [];
    },
  },
  {
    key: "d3-palette",
    label: "Palette — no default D3 color schemes",
    scope: "all",
    fn: (src) => {
      const re = /\bscheme[A-Z][A-Za-z0-9]*\b/g;
      const hits = [...new Set([...src.matchAll(re)].map((m) => m[0]))];
      return hits.length ? [`found default D3 scheme(s): ${hits.join(", ")}`] : [];
    },
  },
  {
    key: "no-gradient",
    label: "Palette — no SVG gradient fills (need approval)",
    scope: "all",
    fn: (src) => {
      const re = /linearGradient|radialGradient/g;
      const hits = src.match(re) || [];
      return hits.length ? [`${hits.length} gradient fill(s) present (need approval)`] : [];
    },
  },
  {
    key: "no-drop-shadow",
    label: "Strokes — no drop-shadow filters anywhere",
    scope: "all",
    fn: (src) => {
      const re = /drop-?shadow/gi;
      const hits = src.match(re) || [];
      return hits.length ? [`${hits.length} drop-shadow found`] : [];
    },
  },
  {
    key: "svg-box-shadow",
    label: "Strokes — no box-shadow on SVG elements (viz panels only)",
    scope: "viz+svg",
    fn: (src) => {
      const re = /box-?shadow/gi;
      const hits = src.match(re) || [];
      return hits.length ? [`${hits.length} box-shadow on SVG (tooltip chrome may be exempt — move to shared Tooltip)`] : [];
    },
  },
  {
    key: "no-scale-hover",
    label: "Hover — no scale/bounce transform on interactive elements",
    scope: "all",
    fn: (src) => {
      const re = /(hover|transition)[^\n]{0,120}scale\(|scale\([^\n]{0,120}(hover|transition)/gi;
      const hits = src.match(re) || [];
      return hits.length ? [`scale-on-hover pattern in ${hits.length} place(s) (human-review)`] : [];
    },
  },
  {
    key: "text-min-size",
    label: "Typography — no SVG <text> smaller than 10px",
    scope: "svg",
    fn: (src) => {
      const bad = new Set();
      const css = /font-[Ss]ize\s*:\s*(\d+(?:\.\d+)?)px/g;
      let m;
      while ((m = css.exec(src))) if (Number(m[1]) < 10) bad.add(`${m[1]}px`);
      const react = /fontSize\s*:\s*(\d+(?:\.\d+)?)\b/g;
      let m2;
      while ((m2 = react.exec(src))) if (Number(m2[1]) < 10) bad.add(`${m2[1]}px`);
      const tw = /text-\[(\d+(?:\.\d+)?px)\]/g;
      let m3;
      while ((m3 = tw.exec(src))) if (Number.parseFloat(m3[1]) < 10) bad.add(m3[1]);
      return bad.size ? [`font sizes < 10px: ${[...bad].join(", ")}`] : [];
    },
  },
  {
    key: "no-autoplay",
    label: "Layout — no auto-rotating carousel",
    scope: "all",
    fn: (src) => {
      const re = /autoPlay|autoplay|setInterval/g;
      const hits = [...new Set([...src.matchAll(re)].map((m) => m[0]))];
      return hits.length ? [`auto-play mechanism(s): ${hits.join(", ")}`] : [];
    },
  },
  {
    key: "which-titles",
    label: "Copy — panel titles must start with 'Which …'",
    scope: "viz",
    fn: (src) => (src.includes("Which ") ? [] : ["no 'Which …' panel title in this panel file"]),
  },
  {
    key: "footnote",
    label: "Copy — mandated footnote present",
    scope: "viz",
    fn: (src) =>
      src.includes("does not include information on which threats and mitigations are more impactful")
        ? []
        : ["missing mandated footnote text"],
  },
  {
    key: "ink-not-black",
    label: "Palette — pure #000 discouraged (use warm ink #1a1a17 + opacity)",
    scope: "svg",
    fn: (src) => {
      const re = /#[0]{3}\b|rgb\(0\s*,\s*0\s*,\s*0\s*\)/gi;
      const hits = src.match(re) || [];
      return hits.length ? [`pure black (${hits.length}) — use warm ink #1a1a17 + opacity`] : [];
    },
  },
];

function listFiles(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else if (/\.(tsx|ts|astro|css|jsx|js)$/.test(entry)) out.push(p);
  }
  return out;
}

const files = DIRS.flatMap((d) => listFiles(join(ROOT, d)));
const vizFiles = files.filter((f) => isVizFile(f));
const svgFiles = new Set(files.filter((f) => containsSvg(readFileSync(f, "utf8"))));

const findings = [];

for (const rule of RULES) {
  for (const file of files) {
    const shouldRun = (() => {
      switch (rule.scope) {
        case "viz": return vizFiles.includes(file);
        case "svg": return svgFiles.has(file);
        case "viz+svg": return vizFiles.includes(file) && svgFiles.has(file);
        default: return true;
      }
    })();
    if (!shouldRun) continue;
    const src = readFileSync(file, "utf8");
    const res = rule.fn(src);
    for (const detail of res) {
      findings.push({ file: file.replace(ROOT, ""), rule: rule.key, detail });
    }
  }
}

if (!vizFiles.length) {
  console.log("\n[style-gate] NOTE: no viz panel files found yet — per-panel rules deferred until AspectBubbleMap/HarmMechanismMap/PathwayBandsMap exist.\n");
}

if (findings.length) {
  console.log(`\n[style-gate] ${findings.length} finding(s) — review before considering a panel done:\n`);
  for (const f of findings) console.log(`  ✗ ${f.rule.padEnd(18)} ${f.file}: ${f.detail}`);
  console.log("\nSome hits are contextual (e.g. ban-words in comments/data).\n");
  process.exit(1);
}

console.log("\n[style-gate] PASS — no machine-checkable style-guardrail violations.\n");
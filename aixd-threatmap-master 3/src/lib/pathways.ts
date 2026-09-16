// Client-authored RQ3 pathway data + labels, ported verbatim from
// docs/2_Claude Code of Mock Website_UPDATED.jsx (const HM2_*) on 2026-08-28.
// All thresholds/numbers kept exactly as authored by the client.

export type HmCluster = { name: string; tiers: string[] };

export const HM2_CLUSTERS: HmCluster[] = [
 {
  "name": "Context",
  "tiers": [
   "T0"
  ]
 },
 {
  "name": "Properties and capabilities",
  "tiers": [
   "T1",
   "T2"
  ]
 },
 {
  "name": "AI model use",
  "tiers": [
   "T3",
   "T4",
   "T5"
  ]
 },
 {
  "name": "Downstream social dynamics",
  "tiers": [
   "T6",
   "T7"
  ]
 }
];

// Pillars 1/2 are the P4D brick/grassroot tokens. Pillars 3/4 use darkened
// blue/olive of the P4D blue/lime hues – these render as small text/dots here,
// where the light brand values (#92C2FF / #D9E021) would fail contrast.
export const HM2_DA_PILLAR: Record<string, string> = {
 "1": "#963735",
 "2": "#00B140",
 "3": "#1A5C9A",
 "4": "#5A5A00"
};

export const HM2_DA_PILLAR_NAME: Record<string, string> = {
 "1": "Citizenship, Law and Rights",
 "2": "Representative and Accountable Government",
 "3": "Civil Society and Popular Participation",
 "4": "Transnational Dynamics"
};

export const HM2_DA_NAME: Record<string, string> = {
 "1.1": "Nationhood and Citizenship",
 "1.2": "Rule of Law and Access to Justice",
 "1.3": "Civil and Political Rights",
 "1.4": "Economic and Social Rights",
 "2.1": "Free and Fair Elections",
 "2.2": "Democratic Role of Political Parties",
 "2.3": "Effective and Accountable Government",
 "2.4": "Democratic Effectiveness of the Legislature",
 "2.5": "Democratic Role of the Judiciary",
 "2.7": "Civilian Control of Military and Police",
 "2.8": "Illegitimate Influence over Policy-Making",
 "3.1": "Independent and Fact-Based Journalistic Media",
 "3.2": "Opinion Formation and Political Participation",
 "4.1": "External Influences on Democracy",
 "4.2": "Democratic Impact Abroad"
};

export const HM2_TIER_SHORT: Record<string, string> = {
 "T0": "Context",
 "T1": "AI capabilities",
 "T2": "Model-inherent",
 "T3": "Use decisions",
 "T4": "Capability uses",
 "T5": "Targeted use",
 "T6": "Individual downstream",
 "T7": "Societal downstream"
};

// Short client-authored labels for the two-map build (compact header chips/boxes).
export const HM2_L: Record<string, string> = {
 "T5b.2": "Repression & censorship",
 "T5a.2": "Disinfo about political processes",
 "T5a.1": "Disinfo & deepfakes",
 "T5c.1": "Augmenting legitimate processes",
 "T5c.2": "Automating legitimate processes",
 "T5a.3": "Identity fraud",
 "T5a.4": "Social engineering at scale",
 "T5a.5": "Opinion manipulation",
 "T5d.1": "Infrastructure attacks",
 "T5d.2": "Jailbreaking",
 "T5b.1": "Deepfake harassment",
 "T1b.3": "Optimisation objectives",
 "T1a.3": "Personalisation",
 "T1b.5": "Black-box systems",
 "T1b.4": "Cheap to run at scale",
 "T1a.2": "Passing as human",
 "T1b.1": "Training data",
 "T1a.5": "Autonomy",
 "T1a.1": "Pattern recognition",
 "T1a.4": "Tool use",
 "T1a.6": "Long-term memory",
 "T1b.6": "Capability overhang",
 "T1b.7": "Privacy of interaction",
 "T2.1": "Content homogenisation",
 "T2.7": "AI sycophancy",
 "T2.5": "Persuasive AI",
 "T2.6": "Illusion of neutrality",
 "T2.3": "Hallucinations & errors",
 "T2.2": "Bias amplification",
 "T4.1": "Generating artefacts",
 "T4.2": "Target profiling",
 "T4.3": "Acting on systems",
 "T4.4": "Directing at targets",
 "T7a.2": "Flooding the zone",
 "T7a.1": "Outpacing verification",
 "T7a.3": "Chilling effects",
 "T7b.2": "Loss of citizen leverage",
 "T7b.1": "Power concentration",
 "T7b.3": "Hollowing out institutions",
 "T7a.4": "Epistemic monoculture",
 "T7a.5": "Shifting baselines",
 "T7c.1": "Criminal AI markets",
 "T7c.2": "Civic inequality",
 "T3.1": "Vendor lock-in",
 "T3.4": "Outsourcing value judgements",
 "T3.3": "No human in the loop",
 "T3.2": "Overreliance & underuse",
 "T0b.1": "Rules for building AI",
 "T0b.2": "Rules for releasing AI",
 "T0b.3": "Rules for using AI",
 "T0a.1": "Release timing",
 "T0a.3": "Secrecy around models",
 "T0a.4": "AI arms race",
 "T6.1": "Echo chambers",
 "T6.2": "Cognitive deskilling",
 "T6.3": "Parasocial attachment",
 "T6.4": "Trust erosion",
 "B6A": "Operational requirements",
 "B6B": "Prohibitions & restrictions",
 "B6C": "Liability & enforcement",
 "B6D": "Market-shaping rules",
 "B10A": "Value-aligned training",
 "B10B": "Safety engineering",
 "B11A": "Model evaluations",
 "B11B": "Deployment monitoring",
 "B11C": "Research synthesis",
 "B7A": "Government AI capacity",
 "B7B": "Guardrails on government AI",
 "B7C": "Resilience without AI",
 "B7D": "Resilience through AI",
 "B3A": "Detection & authentication",
 "B3B": "Verified information",
 "B4A": "Discourse moderation",
 "B4B": "Synthesising public input",
 "B4C": "Participatory formats",
 "B1": "AI literacy",
 "B2": "Levelling the playing field",
 "B5": "Cyber defence",
 "B9": "Democratic oversight"
};

// One band per recurring pathway; nodes carry tier (t) and lane (l); das are
// [democracy-aspect code, mention count] pairs.
export type HmPathNode = { c: string; t: number; l: number };
export type HmPathSeg = { a: string; b: string; n: number };
export type HmPath = { name: string; desc: string; units: number; nodes: HmPathNode[]; segs: HmPathSeg[]; das: [string, number][] };
export const HM2_PATHS: HmPath[] = [
 {
  "name": "Synthetic content & impersonation",
  "desc": "Human-imitation capability feeds cheap content generation, branching into political disinformation, identity fraud and social engineering.",
  "units": 15,
  "nodes": [
   {
    "c": "T1a.2",
    "t": 1,
    "l": 1.5
   },
   {
    "c": "T4.1",
    "t": 4,
    "l": 1.5
   },
   {
    "c": "T5a.1",
    "t": 5,
    "l": 0
   },
   {
    "c": "T5a.2",
    "t": 5,
    "l": 1
   },
   {
    "c": "T5a.3",
    "t": 5,
    "l": 2
   },
   {
    "c": "T5a.4",
    "t": 5,
    "l": 3
   },
   {
    "c": "T7a.2",
    "t": 7,
    "l": 1
   }
  ],
  "segs": [
   {
    "a": "T1a.2",
    "b": "T4.1",
    "n": 8
   },
   {
    "a": "T4.1",
    "b": "T5a.1",
    "n": 6
   },
   {
    "a": "T4.1",
    "b": "T5a.2",
    "n": 5
   },
   {
    "a": "T4.1",
    "b": "T5a.3",
    "n": 6
   },
   {
    "a": "T4.1",
    "b": "T5a.4",
    "n": 3
   },
   {
    "a": "T5a.3",
    "b": "T7a.2",
    "n": 2
   },
   {
    "a": "T5a.1",
    "b": "T7a.2",
    "n": 2
   }
  ],
  "das": [
   [
    "3.2",
    10
   ],
   [
    "3.1",
    8
   ],
   [
    "2.1",
    6
   ],
   [
    "1.2",
    4
   ]
  ]
 },
 {
  "name": "Surveillance & repression",
  "desc": "Pattern recognition enables profiling and targeting, operationalised as repression that chills participation.",
  "units": 11,
  "nodes": [
   {
    "c": "T1a.1",
    "t": 1,
    "l": 0.5
   },
   {
    "c": "T4.2",
    "t": 4,
    "l": 0
   },
   {
    "c": "T4.4",
    "t": 4,
    "l": 1
   },
   {
    "c": "T5b.2",
    "t": 5,
    "l": 0.5
   },
   {
    "c": "T7a.3",
    "t": 7,
    "l": 0.5
   }
  ],
  "segs": [
   {
    "a": "T1a.1",
    "b": "T4.2",
    "n": 4
   },
   {
    "a": "T1a.1",
    "b": "T4.4",
    "n": 5
   },
   {
    "a": "T4.2",
    "b": "T5b.2",
    "n": 3
   },
   {
    "a": "T4.4",
    "b": "T5b.2",
    "n": 5
   },
   {
    "a": "T5b.2",
    "b": "T7a.3",
    "n": 2
   }
  ],
  "das": [
   [
    "1.3",
    7
   ],
   [
    "2.7",
    4
   ],
   [
    "3.2",
    4
   ],
   [
    "2.1",
    4
   ]
  ]
 },
 {
  "name": "Lock-in & power concentration",
  "desc": "Release rules and procurement create structural dependency on providers, concentrating power and eroding citizen leverage.",
  "units": 7,
  "nodes": [
   {
    "c": "T0b.1",
    "t": 0,
    "l": 0
   },
   {
    "c": "T0b.2",
    "t": 0,
    "l": 1
   },
   {
    "c": "T3.1",
    "t": 3,
    "l": 0.5
   },
   {
    "c": "T7b.1",
    "t": 7,
    "l": 0
   },
   {
    "c": "T7b.2",
    "t": 7,
    "l": 1
   }
  ],
  "segs": [
   {
    "a": "T0b.1",
    "b": "T3.1",
    "n": 2
   },
   {
    "a": "T0b.2",
    "b": "T3.1",
    "n": 2
   },
   {
    "a": "T3.1",
    "b": "T7b.1",
    "n": 6
   },
   {
    "a": "T3.1",
    "b": "T7b.2",
    "n": 3
   }
  ],
  "das": [
   [
    "2.3",
    7
   ],
   [
    "2.8",
    7
   ],
   [
    "4.1",
    3
   ],
   [
    "3.2",
    3
   ]
  ]
 }
];

/** Client-authored bipartite benefit view data, extracted verbatim from
   docs/2_Claude Code of Mock Website_UPDATED.jsx (const HM2_HB).
   Left column: harm tiers T0-T7; right column: pro-democracy activity clusters
   B1-B11. pair/tier/ben maps are keyed by tier+ben pair, tier, or ben code. */

export const HM2_BEN_COLOR: Record<string, string> = {
 "B1": "#D9EC44",
 "B2": "#FFB9DC",
 "B3": "#99C2FF",
 "B4": "#00B140",
 "B5": "#4E5A63",
 "B6": "#963735",
 "B7": "#FF7F32",
 "B9": "#1E93A8",
 "B10": "#4A5FA6",
 "B11": "#7B4B8A"
};

export const HM2_BEN_NAME: Record<string, string> = {
 "B1": "Civic & AI literacy building",
 "B2": "Levelling the playing field",
 "B3": "Citizen-led content integrity",
 "B4": "Infrastructure for citizen participation",
 "B5": "Defensive cybersecurity resilience",
 "B6": "Legal & accountability frameworks",
 "B7": "Adjusting government behaviour",
 "B9": "Democratic oversight of AI",
 "B10": "Responsible AI development practices",
 "B11": "Knowledge & evidence infrastructure"
};

export const HM2_LIGHT_BEN: Record<string, number> = {
 "B1": 1,
 "B2": 1,
 "B3": 1,
 "B4": 1
};

export const HM2_TIERS = ["T0","T1","T2","T3","T4","T5","T6","T7"];

export const HM2_BENS = ["B1","B2","B3","B4","B5","B6","B7","B9","B10","B11"];

export const HM2_HB: HbData = {"edges":[{"t":"T5","b":"B6","n":23},{"t":"T1","b":"B10","n":20},{"t":"T2","b":"B10","n":17},{"t":"T4","b":"B6","n":16},{"t":"T7","b":"B6","n":15},{"t":"T1","b":"B6","n":15},{"t":"T7","b":"B11","n":15},{"t":"T7","b":"B7","n":14},{"t":"T7","b":"B9","n":13},{"t":"T5","b":"B11","n":12},{"t":"T1","b":"B11","n":11},{"t":"T4","b":"B5","n":10},{"t":"T2","b":"B11","n":10},{"t":"T1","b":"B7","n":10},{"t":"T5","b":"B7","n":9},{"t":"T4","b":"B3","n":8},{"t":"T5","b":"B10","n":8},{"t":"T5","b":"B5","n":8},{"t":"T3","b":"B7","n":8},{"t":"T4","b":"B10","n":8},{"t":"T3","b":"B10","n":8},{"t":"T5","b":"B3","n":7},{"t":"T3","b":"B11","n":7},{"t":"T0","b":"B11","n":7},{"t":"T7","b":"B10","n":7},{"t":"T1","b":"B3","n":6},{"t":"T1","b":"B5","n":6},{"t":"T4","b":"B7","n":6},{"t":"T0","b":"B7","n":6},{"t":"T2","b":"B6","n":6},{"t":"T0","b":"B9","n":5},{"t":"T0","b":"B6","n":5},{"t":"T3","b":"B9","n":5},{"t":"T3","b":"B6","n":5},{"t":"T6","b":"B6","n":4},{"t":"T6","b":"B10","n":4},{"t":"T5","b":"B2","n":3},{"t":"T5","b":"B1","n":3},{"t":"T0","b":"B5","n":3},{"t":"T7","b":"B4","n":3},{"t":"T1","b":"B4","n":3},{"t":"T4","b":"B4","n":3},{"t":"T4","b":"B11","n":3},{"t":"T2","b":"B7","n":3},{"t":"T7","b":"B3","n":2},{"t":"T7","b":"B5","n":2},{"t":"T6","b":"B7","n":2},{"t":"T1","b":"B2","n":2},{"t":"T5","b":"B9","n":2},{"t":"T4","b":"B9","n":2},{"t":"T0","b":"B10","n":2},{"t":"T2","b":"B5","n":2},{"t":"T1","b":"B9","n":2},{"t":"T7","b":"B2","n":1},{"t":"T2","b":"B3","n":1},{"t":"T0","b":"B1","n":1},{"t":"T4","b":"B1","n":1},{"t":"T2","b":"B2","n":1},{"t":"T4","b":"B2","n":1},{"t":"T6","b":"B11","n":1},{"t":"T1","b":"B1","n":1}],"pair":{"T0|B9":[["T0b.3","B9",3],["T0b.2","B9",3],["T0a.1","B9",2],["T0b.1","B9",2],["T0a.3","B9",1]],"T7|B9":[["T7b.1","B9",7],["T7b.2","B9",5],["T7a.2","B9",2],["T7b.3","B9",2],["T7a.5","B9",1],["T7a.3","B9",1],["T7c.2","B9",1],["T7a.4","B9",1]],"T1|B3":[["T1a.2","B3A",4],["T1a.1","B3B",1],["T1b.4","B3B",1]],"T4|B3":[["T4.1","B3A",6],["T4.4","B3A",1],["T4.3","B3A",1],["T4.1","B3B",1]],"T1|B10":[["T1b.3","B10A",11],["T1a.3","B10A",3],["T1b.7","B10A",2],["T1b.5","B10B",2],["T1b.4","B10B",2],["T1b.1","B10A",1],["T1a.2","B10A",1],["T1a.4","B10B",1],["T1a.5","B10B",1],["T1a.6","B10A",1],["T1a.1","B10B",1],["T1a.2","B10B",1],["T1b.6","B10B",1],["T1a.5","B10A",1]],"T2|B10":[["T2.1","B10A",5],["T2.7","B10A",4],["T2.5","B10A",3],["T2.3","B10B",3],["T2.2","B10A",2],["T2.3","B10A",2],["T2.6","B10A",1]],"T5|B10":[["T5a.5","B10A",2],["T5c.1","B10A",1],["T5a.3","B10A",1],["T5a.2","B10B",1],["T5a.1","B10B",1],["T5c.1","B10B",1],["T5b.1","B10A",1],["T5c.2","B10A",1]],"T7|B2":[["T7b.2","B2",1],["T7c.2","B2",1]],"T5|B2":[["T5c.1","B2",2],["T5c.2","B2",1],["T5a.5","B2",1]],"T4|B6":[["T4.1","B6A",9],["T4.1","B6B",4],["T4.4","B6B",3],["T4.2","B6B",2],["T4.4","B6C",1],["T4.2","B6C",1],["T4.3","B6C",1],["T4.3","B6A",1],["T4.1","B6C",1]],"T5|B6":[["T5a.2","B6A",6],["T5a.1","B6A",6],["T5b.2","B6B",6],["T5c.1","B6A",4],["T5a.3","B6B",3],["T5a.2","B6B",3],["T5c.2","B6A",2],["T5a.1","B6B",2],["T5a.5","B6A",2],["T5a.5","B6B",2],["T5a.3","B6A",2],["T5b.2","B6A",1],["T5c.1","B6C",1],["T5b.2","B6C",1],["T5d.1","B6C",1],["T5d.1","B6A",1]],"T7|B6":[["T7a.2","B6A",6],["T7a.1","B6A",4],["T7b.2","B6A",3],["T7b.3","B6A",2],["T7b.1","B6C",2],["T7b.1","B6B",2],["T7b.1","B6A",2],["T7c.2","B6A",1],["T7a.2","B6B",1],["T7a.3","B6C",1],["T7a.3","B6B",1],["T7a.4","B6D",1],["T7a.5","B6D",1],["T7b.1","B6D",1],["T7b.2","B6D",1],["T7b.3","B6C",1],["T7b.3","B6B",1],["T7a.1","B6C",1],["T7a.1","B6B",1],["T7a.5","B6C",1],["T7a.5","B6B",1],["T7a.5","B6A",1],["T7b.2","B6C",1],["T7b.2","B6B",1],["T7a.4","B6A",1]],"T6|B6":[["T6.4","B6A",3],["T6.1","B6D",1]],"T5|B3":[["T5a.2","B3A",4],["T5a.1","B3A",4],["T5a.3","B3A",2],["T5c.1","B3B",1],["T5d.1","B3A",1],["T5a.4","B3A",1]],"T7|B3":[["T7a.5","B3B",2],["T7a.1","B3B",1]],"T1|B5":[["T1b.4","B5",3],["T1a.4","B5",1],["T1a.1","B5",1],["T1a.2","B5",1],["T1a.5","B5",1]],"T7|B5":[["T7c.1","B5",2]],"T5|B5":[["T5a.4","B5",3],["T5d.1","B5",3],["T5c.1","B5",1],["T5a.3","B5",1],["T5d.2","B5",1]],"T4|B5":[["T4.3","B5",6],["T4.1","B5",5],["T4.4","B5",2],["T4.2","B5",1]],"T2|B3":[["T2.5","B3A",1]],"T2|B11":[["T2.2","B11B",8],["T2.3","B11B",2],["T2.5","B11B",1]],"T4|B7":[["T4.1","B7C",2],["T4.1","B7B",1],["T4.4","B7D",1],["T4.4","B7C",1],["T4.3","B7D",1],["T4.3","B7C",1],["T4.1","B7A",1],["T4.4","B7A",1],["T4.3","B7A",1]],"T7|B7":[["T7a.2","B7B",6],["T7b.2","B7B",5],["T7a.4","B7B",4],["T7a.1","B7B",3],["T7a.2","B7C",2],["T7b.1","B7B",2],["T7c.2","B7B",1],["T7a.1","B7A",1],["T7a.5","B7A",1],["T7b.2","B7C",1],["T7b.1","B7C",1],["T7a.5","B7B",1],["T7b.3","B7B",1]],"T1|B7":[["T1b.4","B7B",3],["T1b.5","B7B",2],["T1a.2","B7C",2],["T1b.3","B7B",2],["T1b.7","B7B",2],["T1b.4","B7A",1],["T1a.1","B7B",1],["T1a.6","B7B",1],["T1a.3","B7B",1],["T1a.5","B7B",1]],"T1|B6":[["T1a.2","B6B",4],["T1b.4","B6A",3],["T1b.5","B6A",3],["T1a.1","B6A",2],["T1b.3","B6D",2],["T1b.7","B6D",2],["T1a.2","B6A",2],["T1b.6","B6A",1],["T1a.1","B6C",1],["T1b.4","B6C",1],["T1b.4","B6B",1],["T1a.3","B6B",1],["T1a.1","B6B",1],["T1a.5","B6A",1],["T1a.6","B6D",1],["T1a.3","B6D",1]],"T5|B7":[["T5a.3","B7C",2],["T5c.2","B7B",2],["T5d.1","B7D",1],["T5d.1","B7C",1],["T5c.2","B7C",1],["T5c.1","B7C",1],["T5d.1","B7A",1],["T5c.1","B7B",1]],"T0|B11":[["T0b.3","B11B",4],["T0b.2","B11B",4],["T0b.1","B11B",4],["T0b.3","B11A",3],["T0b.2","B11A",3],["T0b.1","B11A",3],["T0a.1","B11B",1],["T0a.3","B11A",1],["T0a.3","B11B",1]],"T0|B7":[["T0b.3","B7B",3],["T0b.2","B7B",3],["T0b.1","B7B",3],["T0a.3","B7B",2],["T0a.1","B7A",1]],"T3|B11":[["T3.4","B11A",3],["T3.1","B11A",3],["T3.2","B11B",2],["T3.3","B11A",1],["T3.4","B11B",1],["T3.1","B11B",1],["T3.3","B11B",1]],"T3|B7":[["T3.4","B7B",4],["T3.1","B7B",4],["T3.3","B7B",2],["T3.2","B7A",1],["T3.2","B7B",1]],"T7|B11":[["T7a.2","B11A",4],["T7a.4","B11A",3],["T7b.2","B11B",3],["T7a.5","B11B",2],["T7a.1","B11B",2],["T7a.1","B11A",2],["T7a.2","B11B",2],["T7c.2","B11B",2],["T7b.3","B11B",2],["T7b.1","B11B",1],["T7b.2","B11A",1],["T7a.4","B11B",1],["T7a.3","B11B",1],["T7a.5","B11A",1]],"T2|B6":[["T2.2","B6A",4],["T2.3","B6A",3],["T2.2","B6C",1],["T2.3","B6C",1],["T2.1","B6D",1]],"T5|B11":[["T5c.2","B11B",4],["T5c.1","B11B",4],["T5b.2","B11B",2],["T5a.5","B11B",1],["T5a.2","B11B",1],["T5a.1","B11B",1]],"T4|B10":[["T4.1","B10B",6],["T4.3","B10B",1],["T4.2","B10B",1],["T4.1","B10A",1]],"T1|B11":[["T1b.1","B11B",3],["T1a.5","B11B",3],["T1b.4","B11A",2],["T1a.1","B11B",2],["T1b.6","B11B",1],["T1b.5","B11B",1],["T1b.5","B11A",1],["T1a.6","B11B",1],["T1b.6","B11A",1],["T1b.4","B11B",1]],"T0|B6":[["T0b.3","B6A",4],["T0b.2","B6A",4],["T0b.1","B6A",4],["T0a.3","B6A",2],["T0a.1","B6A",1]],"T3|B10":[["T3.4","B10A",3],["T3.3","B10B",2],["T3.1","B10A",2],["T3.2","B10B",1],["T3.2","B10A",1]],"T4|B1":[["T4.3","B1",1],["T4.1","B1",1],["T4.4","B1",1],["T4.2","B1",1]],"T0|B1":[["T0a.4","B1",1]],"T0|B5":[["T0a.4","B5",2],["T0b.3","B5",1]],"T5|B1":[["T5a.4","B1",2],["T5d.1","B1",1],["T5a.2","B1",1],["T5a.5","B1",1],["T5a.1","B1",1]],"T6|B7":[["T6.2","B7C",1],["T6.1","B7B",1]],"T3|B9":[["T3.1","B9",4],["T3.4","B9",3],["T3.3","B9",1]],"T7|B10":[["T7b.1","B10A",2],["T7a.4","B10A",2],["T7b.2","B10A",1],["T7a.5","B10A",1],["T7b.2","B10B",1],["T7a.1","B10B",1],["T7a.2","B10B",1],["T7a.3","B10A",1],["T7b.3","B10A",1]],"T2|B2":[["T2.2","B2",1],["T2.3","B2",1]],"T1|B2":[["T1a.1","B2",2]],"T6|B10":[["T6.1","B10A",3],["T6.2","B10A",1],["T6.3","B10A",1]],"T4|B2":[["T4.4","B2",1]],"T4|B4":[["T4.1","B4C",3],["T4.1","B4B",2]],"T7|B4":[["T7c.2","B4C",3],["T7b.2","B4C",3],["T7a.2","B4C",3],["T7c.2","B4B",2],["T7b.2","B4B",2],["T7a.2","B4B",2]],"T1|B4":[["T1b.4","B4C",3],["T1b.4","B4B",2]],"T4|B9":[["T4.4","B9",1],["T4.2","B9",1],["T4.1","B9",1]],"T4|B11":[["T4.1","B11B",2],["T4.4","B11B",1],["T4.2","B11B",1],["T4.1","B11A",1]],"T5|B9":[["T5b.2","B9",1],["T5c.2","B9",1]],"T0|B10":[["T0b.3","B10B",1],["T0a.3","B10B",1]],"T2|B5":[["T2.3","B5",2]],"T1|B9":[["T1b.4","B9",1],["T1a.5","B9",1]],"T2|B7":[["T2.2","B7B",2],["T2.1","B7B",1],["T2.3","B7B",1]],"T6|B11":[["T6.4","B11B",1]],"T3|B6":[["T3.1","B6A",2],["T3.3","B6A",2],["T3.4","B6D",1],["T3.1","B6D",1],["T3.1","B6C",1],["T3.1","B6B",1],["T3.4","B6A",1]],"T1|B1":[["T1b.4","B1",1],["T1a.5","B1",1]]},"tier":{"T0":[["T0b.3","B11",6],["T0b.2","B11",6],["T0b.1","B11",6],["T0b.3","B6",4],["T0b.2","B6",4],["T0b.1","B6",4],["T0b.3","B7",3],["T0b.2","B7",3],["T0b.1","B7",3],["T0b.3","B9",3],["T0b.2","B9",3],["T0a.1","B9",2],["T0a.3","B7",2],["T0a.3","B11",2],["T0a.4","B5",2],["T0b.1","B9",2],["T0a.3","B6",2],["T0a.3","B9",1],["T0a.1","B6",1],["T0a.1","B11",1],["T0a.4","B1",1],["T0a.1","B7",1],["T0b.3","B5",1],["T0b.3","B10",1],["T0a.3","B10",1]],"T7":[["T7a.2","B7",8],["T7a.2","B6",7],["T7b.1","B9",7],["T7b.2","B7",6],["T7a.2","B11",5],["T7b.2","B9",5],["T7b.2","B6",4],["T7a.1","B6",4],["T7a.1","B7",4],["T7a.4","B7",4],["T7b.2","B11",4],["T7a.4","B11",3],["T7a.1","B11",3],["T7b.1","B7",3],["T7c.2","B4",3],["T7b.2","B4",3],["T7a.2","B4",3],["T7b.1","B6",3],["T7a.5","B3",2],["T7c.1","B5",2],["T7a.5","B7",2],["T7a.5","B11",2],["T7b.1","B10",2],["T7b.2","B10",2],["T7a.4","B10",2],["T7a.2","B9",2],["T7a.4","B6",2],["T7a.5","B6",2],["T7b.3","B9",2],["T7c.2","B11",2],["T7b.3","B6",2],["T7b.3","B11",2],["T7a.5","B9",1],["T7b.2","B2",1],["T7c.2","B2",1],["T7c.2","B6",1],["T7c.2","B7",1],["T7a.1","B3",1],["T7b.1","B11",1],["T7a.5","B10",1],["T7a.3","B6",1],["T7a.3","B9",1],["T7a.3","B11",1],["T7c.2","B9",1],["T7a.1","B10",1],["T7a.2","B10",1],["T7a.4","B9",1],["T7a.3","B10",1],["T7b.3","B7",1],["T7b.3","B10",1]],"T1":[["T1b.3","B10",11],["T1a.2","B6",5],["T1a.2","B3",4],["T1b.4","B7",4],["T1b.4","B5",3],["T1b.4","B6",3],["T1b.5","B6",3],["T1b.1","B11",3],["T1a.3","B10",3],["T1a.1","B6",3],["T1b.4","B4",3],["T1a.5","B11",3],["T1a.2","B10",2],["T1b.6","B11",2],["T1b.5","B11",2],["T1b.4","B11",2],["T1b.5","B7",2],["T1a.5","B10",2],["T1a.1","B11",2],["T1b.7","B10",2],["T1a.1","B2",2],["T1b.5","B10",2],["T1a.2","B7",2],["T1b.3","B6",2],["T1b.3","B7",2],["T1b.7","B6",2],["T1b.7","B7",2],["T1b.4","B10",2],["T1a.3","B6",2],["T1b.1","B10",1],["T1a.1","B3",1],["T1b.4","B3",1],["T1a.4","B5",1],["T1a.4","B10",1],["T1b.6","B6",1],["T1a.6","B11",1],["T1a.6","B10",1],["T1b.4","B9",1],["T1a.1","B10",1],["T1a.5","B9",1],["T1a.1","B5",1],["T1a.1","B7",1],["T1a.2","B5",1],["T1b.6","B10",1],["T1b.4","B1",1],["T1a.5","B1",1],["T1a.5","B5",1],["T1a.5","B6",1],["T1a.6","B6",1],["T1a.6","B7",1],["T1a.3","B7",1],["T1a.5","B7",1]],"T4":[["T4.1","B6",11],["T4.1","B3",7],["T4.1","B10",7],["T4.3","B5",6],["T4.1","B5",5],["T4.1","B7",4],["T4.4","B6",3],["T4.1","B4",3],["T4.4","B7",2],["T4.3","B7",2],["T4.4","B5",2],["T4.2","B6",2],["T4.1","B11",2],["T4.4","B3",1],["T4.3","B3",1],["T4.3","B10",1],["T4.3","B1",1],["T4.1","B1",1],["T4.4","B1",1],["T4.2","B1",1],["T4.2","B5",1],["T4.4","B2",1],["T4.4","B9",1],["T4.4","B11",1],["T4.2","B9",1],["T4.2","B11",1],["T4.1","B9",1],["T4.2","B10",1],["T4.3","B6",1]],"T2":[["T2.2","B11",8],["T2.3","B10",5],["T2.1","B10",5],["T2.7","B10",4],["T2.2","B6",4],["T2.5","B10",3],["T2.3","B6",3],["T2.2","B10",2],["T2.3","B11",2],["T2.3","B5",2],["T2.2","B7",2],["T2.6","B10",1],["T2.5","B3",1],["T2.5","B11",1],["T2.2","B2",1],["T2.3","B2",1],["T2.1","B6",1],["T2.1","B7",1],["T2.3","B7",1]],"T5":[["T5a.2","B6",8],["T5a.1","B6",7],["T5b.2","B6",7],["T5c.1","B6",4],["T5c.2","B11",4],["T5a.3","B6",4],["T5c.1","B11",4],["T5a.5","B6",4],["T5a.2","B3",4],["T5a.1","B3",4],["T5a.4","B5",3],["T5c.2","B7",3],["T5d.1","B5",3],["T5c.1","B10",2],["T5d.1","B7",2],["T5c.2","B6",2],["T5b.2","B11",2],["T5c.1","B7",2],["T5c.1","B2",2],["T5a.3","B7",2],["T5a.5","B10",2],["T5a.4","B1",2],["T5a.3","B3",2],["T5c.2","B2",1],["T5a.3","B10",1],["T5c.1","B3",1],["T5d.1","B3",1],["T5a.2","B10",1],["T5a.1","B10",1],["T5d.1","B1",1],["T5a.5","B11",1],["T5a.5","B2",1],["T5b.2","B9",1],["T5c.1","B5",1],["T5a.2","B11",1],["T5a.1","B11",1],["T5d.1","B6",1],["T5c.2","B9",1],["T5a.2","B1",1],["T5a.5","B1",1],["T5a.1","B1",1],["T5a.4","B3",1],["T5a.3","B5",1],["T5b.1","B10",1],["T5d.2","B5",1],["T5c.2","B10",1]],"T6":[["T6.4","B6",3],["T6.1","B10",3],["T6.2","B7",1],["T6.4","B11",1],["T6.2","B10",1],["T6.3","B10",1],["T6.1","B6",1],["T6.1","B7",1]],"T3":[["T3.4","B7",4],["T3.1","B7",4],["T3.1","B9",4],["T3.4","B11",3],["T3.1","B11",3],["T3.4","B9",3],["T3.4","B10",3],["T3.1","B6",3],["T3.3","B7",2],["T3.3","B11",2],["T3.3","B10",2],["T3.1","B10",2],["T3.2","B7",2],["T3.4","B6",2],["T3.2","B10",2],["T3.2","B11",2],["T3.3","B6",2],["T3.3","B9",1]]},"ben":{"B9":[["T7","B9",13],["T0","B9",5],["T3","B9",5],["T5","B9",2],["T4","B9",2],["T1","B9",2]],"B3":[["T4","B3A",7],["T5","B3A",6],["T1","B3A",4],["T7","B3B",2],["T1","B3B",2],["T5","B3B",1],["T2","B3A",1],["T4","B3B",1]],"B10":[["T2","B10A",14],["T1","B10A",13],["T1","B10B",7],["T4","B10B",7],["T5","B10A",6],["T7","B10A",6],["T3","B10A",5],["T6","B10A",4],["T3","B10B",3],["T2","B10B",3],["T5","B10B",2],["T0","B10B",2],["T7","B10B",1],["T4","B10A",1]],"B2":[["T5","B2",3],["T1","B2",2],["T7","B2",1],["T2","B2",1],["T4","B2",1]],"B6":[["T5","B6A",14],["T7","B6A",11],["T4","B6A",10],["T1","B6A",10],["T5","B6B",10],["T4","B6B",8],["T2","B6A",5],["T1","B6B",5],["T0","B6A",5],["T7","B6B",5],["T7","B6C",4],["T3","B6A",4],["T6","B6A",3],["T5","B6C",3],["T4","B6C",3],["T1","B6C",2],["T7","B6D",2],["T1","B6D",2],["T2","B6C",1],["T2","B6D",1],["T3","B6D",1],["T3","B6C",1],["T3","B6B",1],["T6","B6D",1]],"B5":[["T4","B5",10],["T5","B5",8],["T1","B5",6],["T0","B5",3],["T7","B5",2],["T2","B5",2]],"B11":[["T5","B11B",12],["T7","B11B",12],["T2","B11B",10],["T1","B11B",9],["T7","B11A",5],["T3","B11A",4],["T0","B11A",4],["T0","B11B",4],["T3","B11B",4],["T1","B11A",3],["T4","B11B",3],["T6","B11B",1],["T4","B11A",1]],"B7":[["T7","B7B",10],["T1","B7B",7],["T3","B7B",7],["T5","B7C",5],["T0","B7B",5],["T4","B7C",3],["T7","B7C",3],["T2","B7B",3],["T5","B7B",3],["T4","B7A",2],["T1","B7C",2],["T4","B7B",1],["T5","B7D",1],["T4","B7D",1],["T7","B7A",1],["T1","B7A",1],["T6","B7C",1],["T3","B7A",1],["T0","B7A",1],["T5","B7A",1],["T6","B7B",1]],"B1":[["T5","B1",3],["T0","B1",1],["T4","B1",1],["T1","B1",1]],"B4":[["T7","B4C",3],["T1","B4C",3],["T4","B4C",3],["T7","B4B",2],["T1","B4B",2],["T4","B4B",2]]},"tierQ":{"T0":18,"T1":56,"T2":30,"T3":20,"T4":42,"T5":57,"T6":9,"T7":49},"benQ":{"B1":3,"B2":3,"B3":11,"B4":3,"B5":13,"B6":36,"B7":20,"B9":13,"B10":31,"B11":25},"joined":115};

import { HM2_L, HM2_TIER_SHORT } from "./pathways";
import { TIER_COLORS } from "./tiers";
import { accessibleLabelOf, tierOf } from "./codes";
import type { BenefitTaxonomy, HarmTaxonomy } from "./types";
export { tierOf };

export type HbEdge = { t: string; b: string; n: number };
export type HbRow = [string, string, number];
export type HbData = {
  edges: HbEdge[];
  pair: Record<string, HbRow[]>;
  tier: Record<string, HbRow[]>;
  ben: Record<string, HbRow[]>;
  tierQ: Record<string, number>;
  benQ: Record<string, number>;
  joined: number;
};
export type BenefitView = {
  headL: string;
  headR: string;
  left: BipNode[];
  right: BipNode[];
  links: BipLink[];
  note: string;
};
export type BipNode = {
  c: string;
  label: string;
  code: string;
  n: number;
  color: string;
  ink: string;
  act: "tier" | "ben" | "edge" | null;
  t?: string;
  b?: string;
};
export type BipLink = { l: string; r: string; n: number; color: string; act?: string; t?: string; b?: string };
export type BipState =
  | { type: "overview" }
  | { type: "tier"; t: string }
  | { type: "ben"; b: string }
  | { type: "edge"; t: string; b: string };

export const hm2BenOf = (c: string) => {
  const m = /B(\d+)/.exec(c);
  return m ? "B" + m[1] : c;
};
const hm2BenKey = (c: string) => {
  const m = c.match(/^B(\d+)([A-D]?)/);
  return [(m ? +m[1] : 0), m?.[2] || ""] as (number | string)[];
};
const hm2HarmKey = (c: string) => {
  const m = c.match(/^T(\d)([abc]?)\.?(\d*)/);
  return [m ? +m[1] : 0, m?.[2] || "", m && m[3] ? +m[3] : 0] as (number | string)[];
};
const hm2Cmp = (a: (number | string)[], b: (number | string)[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
};
export const hm2Lbl = (c: string) => HM2_L[c] || HM2_TIER_SHORT[c] || HM2_BEN_NAME[c] || c;

export const HM2A_NOTE_BASE =
  "A link means an entry mentions both together; thicker links are mentioned more often. Click any box or link to unfold the detail behind it.";

const lt = (c: string) => HM2_HB.tier[c] || [];

export function buildBenefitView(
  st: BipState,
  harmTaxonomy?: HarmTaxonomy,
  benefitTaxonomy?: BenefitTaxonomy
): BenefitView {
  const lbl = (c: string) =>
    accessibleLabelOf(c, harmTaxonomy, benefitTaxonomy) ?? hm2Lbl(c);
  if (st.type === "overview") {
    return {
      headL: "Harm mechanisms",
      headR: "Pro-democracy activities",
      left: HM2_TIERS.map((t) => ({
        c: t,
        label: HM2_TIER_SHORT[t],
        code: t,
        n: HM2_HB.tierQ[t],
        color: TIER_COLORS[t],
        ink: "#fff",
        act: "tier",
        t,
      })),
      right: HM2_BENS.map((b) => ({
        c: b,
        label: lbl(b),
        code: b,
        n: HM2_HB.benQ[b],
        color: HM2_BEN_COLOR[b],
        ink: HM2_LIGHT_BEN[b] ? "#22201a" : "#fff",
        act: "ben",
        b,
      })),
      links: HM2_HB.edges.filter((e) => e.n >= 4).map((e) => ({ l: e.t, r: e.b, n: e.n, color: TIER_COLORS[e.t], act: "edge", t: e.t, b: e.b })),
      note: HM2A_NOTE_BASE,
    };
  }
  let rows: HbRow[];
  let headL: string;
  let headR: string;
  let note: string;
  if (st.type === "tier") {
    rows = lt(st.t).map((r) => [r[0], r[1], r[2]]);
    headL = `${HM2_TIER_SHORT[st.t]} (${st.t})`;
    headR = "Pro-democracy activities";
    note = "";
  } else if (st.type === "ben") {
    rows = (HM2_HB.ben[st.b] || []).map((r) => [r[0], r[1], r[2]]);
    headL = "Harm mechanisms";
    headR = `${lbl(st.b)} (${st.b})`;
    note = "";
  } else {
    rows = (HM2_HB.pair[st.t + "|" + st.b] || []).map((r) => [r[0], r[1], r[2]]);
    headL = `${HM2_TIER_SHORT[st.t]} (${st.t})`;
    headR = `${lbl(st.b)} (${st.b})`;
    note = "";
  }
  let min = 2;
  let use = rows.filter((r) => r[2] >= min);
  if (use.length > 20) {
    min = 3;
    use = rows.filter((r) => r[2] >= min);
  }
  if (!use.length) {
    min = 1;
    use = rows;
  }
  const hidden = rows.length - use.length;
  const lTot: Record<string, number> = {};
  const rTot: Record<string, number> = {};
  use.forEach(([a, b, n]) => {
    lTot[a] = (lTot[a] || 0) + n;
    rTot[b] = (rTot[b] || 0) + n;
  });
  const stT = st.type === "tier" || st.type === "edge" ? st.t : undefined;
  const stB = st.type === "ben" || st.type === "edge" ? st.b : undefined;
  const leftAct = st.type === "ben" ? ("edge" as const) : null;
  const rightAct = st.type === "tier" ? ("edge" as const) : null;
  const left = Object.keys(lTot)
    .sort((a, b) => hm2Cmp(hm2HarmKey(a), hm2HarmKey(b)))
    .map((c) => ({
      c,
      label: lbl(c),
      code: c,
      n: lTot[c],
      color: TIER_COLORS[tierOf(c) ?? ""] || TIER_COLORS[c],
      ink: "#fff",
      act: leftAct,
      t: c,
      b: stB,
    }));
  const right = Object.keys(rTot)
    .sort((a, b) => hm2Cmp(hm2BenKey(a), hm2BenKey(b)))
    .map((c) => ({
      c,
      label: lbl(c),
      code: c,
      n: rTot[c],
      color: HM2_BEN_COLOR[hm2BenOf(c)],
      ink: HM2_LIGHT_BEN[hm2BenOf(c)] ? "#22201a" : "#fff",
      act: rightAct,
      t: stT,
      b: c,
    }));
  const links = use.map(([a, b, n]) => ({ l: a, r: b, n, color: TIER_COLORS[tierOf(a) ?? ""] || TIER_COLORS[a] }));
  if (hidden > 0) note += ` ${hidden} weaker link${hidden > 1 ? "s" : ""} below ${min} mentions not shown.`;
  return { headL, headR, left, right, links, note };
}

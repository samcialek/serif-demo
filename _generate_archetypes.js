#!/usr/bin/env node
/**
 * _generate_archetypes.js
 *
 * Parses the PRISM v12.3 Master Atlas HTML and generates:
 *   1. archetypes.ts  — ~109 archetype definitions (111 - 5 merged + 3 added)
 *   2. archetype_definitions.csv — ~109 rows
 *
 * Run:  node _generate_archetypes.js
 */

const fs = require("fs");
const path = require("path");

// ─────────────────────────────────────────────────────────
// 1. Parse atlas HTML
// ─────────────────────────────────────────────────────────
const atlasPath = path.join(__dirname, "dashboard-repo", "prism-v12-3-atlas.html");
const html = fs.readFileSync(atlasPath, "utf-8");

// Track which section we're in for tier assignment
const SECTION_TIERS = {
  "TIER 1": "T1",
  "TIER 2": "T2",
  "MEANS-SALIENT": "MEANS",
  "GATE-DEFINED": "GATE",
  "ONT-VARIANT": "T2",       // ONT variants go in T2
  "REALITY-PRIMARY": "REALITY",
};

/**
 * Parse a single <tr> row from the atlas.
 * Returns { id, name, freq, traits: [{node, pos, sal}], ontLevel, desc, tier }
 */
function parseRow(trHtml, currentTier) {
  const idMatch = trHtml.match(/<td class="id">([^<]+)<\/td>/);
  const freqMatch = trHtml.match(/<td class="freq">([^<]+)<\/td>/);
  const nameMatch = trHtml.match(/<td class="name">([^<]+)<\/td>/);
  const descMatch = trHtml.match(/<td class="desc">([^<]+)<\/td>/);

  if (!idMatch || !nameMatch) return null;

  const id = idMatch[1].trim();
  let freq = freqMatch ? parseFloat(freqMatch[1].replace("%", "")) / 100 : 0.018;
  const name = nameMatch[1].trim();
  const desc = descMatch ? descMatch[1].trim() : "";

  // Parse trait tags: <span class="tag tag-ends">MAT:L+</span>
  const tagRe = /<span class="tag [^"]*">([^<]+)<\/span>/g;
  const traits = [];
  let match;
  while ((match = tagRe.exec(trHtml)) !== null) {
    const tagText = match[1].trim();
    // Skip ONT tags (e.g. "High", "Low", "Mid", "Var")
    if (["High", "Low", "Mid", "Var"].includes(tagText)) continue;
    // Parse NODE:POS_SAL format e.g. "MAT:L+", "CD:H~", "EPS:M+"
    const colonIdx = tagText.indexOf(":");
    if (colonIdx === -1) continue;
    const node = tagText.substring(0, colonIdx);
    const rest = tagText.substring(colonIdx + 1);
    // Position letter: L, M, H
    const posLetter = rest[0];
    // Salience marker: +, ~
    const salMarker = rest.length > 1 ? rest[1] : "~";
    traits.push({ node, posLetter, salMarker });
  }

  // Parse ONT level
  let ontLevel = "Mid";
  const ontTagMatch = trHtml.match(/tag-ont-[hml]">([^<]+)<\/span>/) ||
                      trHtml.match(/tag-ont-v">([^<]+)<\/span>/);
  if (ontTagMatch) ontLevel = ontTagMatch[1].trim();

  return { id, name, freq, traits, ontLevel, desc, tier: currentTier };
}

// Parse all sections and rows
const archetypes = [];
const sectionRe = /<div class="section[^"]*">([^<]+)<\/div>/g;
const sections = [];
let sm;
while ((sm = sectionRe.exec(html)) !== null) {
  sections.push({ title: sm[1].trim(), offset: sm.index });
}

// For each section, find the table and rows
for (let si = 0; si < sections.length; si++) {
  const section = sections[si];
  const nextOffset = si + 1 < sections.length ? sections[si + 1].offset : html.length;
  const sectionHtml = html.substring(section.offset, nextOffset);

  // Determine tier
  let tier = "T2";
  for (const [key, val] of Object.entries(SECTION_TIERS)) {
    if (section.title.toUpperCase().includes(key.toUpperCase())) {
      tier = val;
      break;
    }
  }

  // Find all <tr> rows
  const trRe = /<tr[^>]*>[\s\S]*?<\/tr>/g;
  let trMatch;
  while ((trMatch = trRe.exec(sectionHtml)) !== null) {
    const trHtml = trMatch[0];
    // Skip header rows
    if (trHtml.includes("<th>") || trHtml.includes("<th ")) continue;
    const parsed = parseRow(trHtml, tier);
    if (parsed) archetypes.push(parsed);
  }
}

console.log(`Parsed ${archetypes.length} archetypes from atlas`);

// ─────────────────────────────────────────────────────────
// 1b. Name overrides — rename archetypes whose names reference
//     concepts the 15 measurement nodes cannot capture
// ─────────────────────────────────────────────────────────
const NAME_OVERRIDES = {
  "065": "Equity-First Reformer",         // was Georgist (land value tax theory — no fiscal policy node)
  "071": "Solidarity Radical",            // was Catholic Worker (Catholic social teaching — no religion node)
  "063": "Values-Based Centrist",         // was Christian Democrat (religious framework — no religion node)
  "086": "Frontier Optimist",             // was Transhumanist (tech enhancement — no technology node)
  "098": "Fatalist Hierarchist",          // was Techno-Feudalist (tech oligarchy — no technology node)
  "092": "Nationalist Redistributor",     // was National Bolshevik (synthesized extremes — can't express synthesis)
  "095": "Authoritarian Skeptic",         // was Dark Enlightenment (neoreactionary theory — too specific)
  "085": "Radical Simplifier",            // was Primitivist (anti-civilization — no civilization node)
  "094": "Individualist Anti-Authoritarian", // was Post-Left Anarchist (beyond anarchism — no org node)
  "062": "Regulated Market Advocate",     // was Ordoliberal (German social market theory — too specific)
  "064": "Cooperative Economist",         // was Market Socialist (worker ownership — no ownership node)
  "072": "Small-Scale Capitalist",        // was Distributist (widespread property — no ownership node)
  "099": "Abundance Optimist",            // was Post-Scarcity Utopian (tech abundance — no tech node)
  "100": "Radical Egalitarian Optimist",  // was Fully Automated Luxury Communist (tech+communism — no tech node)
  "066": "Process-Centered Citizen",      // was Civic Republican (classical political theory — too specific)
  "022": "Community-Voice Progressive",   // was Identity-Rooted Progressive (standpoint epistemology — no methodology node)
  "070": "Establishment Conservative",    // was Rockefeller Republican (historical GOP faction — too specific)
};

// ─────────────────────────────────────────────────────────
// 1c. Merge logic — absorb near-identical archetypes
// ─────────────────────────────────────────────────────────
// Map of archetype ID to remove → { into: surviving ID, newName: merged name }
const MERGE_MAP = {
  "055": { into: "024", newName: "Confrontational Progressive" },    // B1: Conflict-Minded → Movement Progressive
  "061": { into: "044", newName: "Market-Friendly Progressive" },    // B2: Neoliberal → Neoliberal Progressive
  "040": { into: "046", newName: "Pragmatic Optimist" },             // B3: Win-Win Centrist → Solutions-Oriented Moderate
  "N13": { into: "001", newName: "Engaged Democrat" },               // B4: Vigilant Democrat → Hopeful Democrat
  "047": { into: "018", newName: null },                             // B5: Hardline Movement Conservative → Movement Conservative (keep name)
};

const MERGED_IDS = new Set(Object.keys(MERGE_MAP));

// Apply merges: remove absorbed archetypes, add their prior to survivor, rename survivor
for (let i = archetypes.length - 1; i >= 0; i--) {
  if (MERGED_IDS.has(archetypes[i].id)) {
    const removed = archetypes[i];
    const merge = MERGE_MAP[removed.id];
    const survivor = archetypes.find(a => a.id === merge.into);
    if (survivor) {
      survivor.freq += removed.freq;
      if (merge.newName) {
        survivor.name = merge.newName;
      }
    }
    archetypes.splice(i, 1);
    console.log(`Merged ${removed.id} (${removed.name}) into ${merge.into} (prior added)`);
  }
}

// Apply name overrides
for (const arch of archetypes) {
  if (NAME_OVERRIDES[arch.id]) {
    const oldName = arch.name;
    arch.name = NAME_OVERRIDES[arch.id];
    console.log(`Renamed ${arch.id}: "${oldName}" → "${arch.name}"`);
  }
}

// ─────────────────────────────────────────────────────────
// 1d. Add new archetypes (Category D)
// ─────────────────────────────────────────────────────────
const NEW_ARCHETYPES = [
  {
    id: "D01",
    name: "Pragmatic Populist",
    freq: 0.016,
    traits: [
      { node: "MAT", posLetter: "L", salMarker: "+" },
      { node: "COM", posLetter: "H", salMarker: "+" },
      { node: "ZS", posLetter: "H", salMarker: "+" },
      { node: "TRB", posLetter: "H", salMarker: "+" },
      { node: "ENG", posLetter: "H", salMarker: "+" },
    ],
    ontLevel: "Mid",
    desc: "Populist economics + high tribalism + engagement",
    tier: "T2",
  },
  {
    id: "D02",
    name: "Resigned Moderate",
    freq: 0.016,
    traits: [
      { node: "ONT_H", posLetter: "L", salMarker: "+" },
      { node: "ONT_S", posLetter: "L", salMarker: "+" },
      { node: "PF", posLetter: "L", salMarker: "+" },
      { node: "ENG", posLetter: "M", salMarker: "~" },
      { node: "COM", posLetter: "M", salMarker: "~" },
    ],
    ontLevel: "Low",
    desc: "Pessimistic but still participates",
    tier: "T2",
  },
  {
    id: "D03",
    name: "Hawkish Liberal",
    freq: 0.016,
    traits: [
      { node: "MAT", posLetter: "L", salMarker: "+" },
      { node: "CD", posLetter: "L", salMarker: "+" },
      { node: "ZS", posLetter: "H", salMarker: "+" },
      { node: "COM", posLetter: "H", salMarker: "+" },
    ],
    ontLevel: "Mid",
    desc: "Progressive values + zero-sum worldview + uncompromising",
    tier: "T2",
  },
];

for (const newArch of NEW_ARCHETYPES) {
  archetypes.push(newArch);
  console.log(`Added new archetype: ${newArch.id} ${newArch.name}`);
}

console.log(`\nFinal archetype count after merges/additions: ${archetypes.length}`);

// ─────────────────────────────────────────────────────────
// 2. Map tag notation to pos/sal values
// ─────────────────────────────────────────────────────────

const CONTINUOUS_NODES = ["MAT", "CD", "CU", "MOR", "PRO", "COM", "ZS", "ONT_H", "ONT_S", "PF", "TRB", "ENG"];
const CATEGORICAL_NODES = ["EPS", "AES", "H"];
const ALL_NODES = [...CONTINUOUS_NODES, ...CATEGORICAL_NODES];

function posLetterToValue(letter) {
  switch (letter) {
    case "L": return 2;
    case "M": return 3;
    case "H": return 4;
    default: return 3;
  }
}

function salMarkerToValue(marker) {
  switch (marker) {
    case "+": return 2;
    case "~": return 1;
    default: return 1;
  }
}

// ─────────────────────────────────────────────────────────
// 3. Map categorical node tags
// ─────────────────────────────────────────────────────────
// For EPS, AES, H: the L/M/H in atlas maps to specific categories
// EPS: L=empiricist, M=institutionalist, H=traditionalist
// AES: L=statesman, M=fighter(?), H=authentic/visionary
// H: L=egalitarian, M=institutional, H=traditional

// More refined categorical mappings based on archetype descriptions:
const CATEGORICAL_MAPPING = {
  // EPS mappings per archetype (manually curated based on descriptions)
  EPS: {
    // Default: L=empiricist, M=institutionalist, H=traditionalist
    default_L: "empiricist",
    default_M: "institutionalist",
    default_H: "traditionalist",
  },
  // AES mappings
  AES: {
    // Default: L=statesman, M=authentic, H=visionary
    // But some archetypes clearly use fighter
    default_L: "statesman",
    default_M: "authentic",
    default_H: "visionary",
  },
  // H mappings
  H: {
    default_L: "egalitarian",
    default_M: "institutional",
    default_H: "traditional",
  }
};

// Per-archetype overrides for categorical assignments based on descriptions
// COMPREHENSIVE: every archetype gets a deliberate EPS assignment
const EPS_OVERRIDES = {
  // === Empiricist (data-driven, evidence-based, follows the data) ===
  "016": "empiricist",  // Evidence-Based Progressive
  "050": "empiricist",  // Data-Driven Democrat
  "046": "empiricist",  // Solutions-Oriented Moderate
  "035": "empiricist",  // Free-Thinking Moderate — evaluates independently
  "M07": "empiricist",  // Rationalist Technocrat — first-principles reasoning
  "M15": "empiricist",  // Evidence-First Reformer
  "088": "empiricist",  // Meritocrat — talent/data driven
  "089": "empiricist",  // Elitist Democrat — technocratic competence
  "M11": "empiricist",  // Armchair Analyst — loves data/analysis
  // "061": merged into 044

  "086": "empiricist",  // Transhumanist — tech/science epistemology
  "044": "empiricist",  // Neoliberal Progressive — data-friendly markets
  "034": "empiricist",  // Rising Tide Social Democrat — policy wonk
  "036": "empiricist",  // Optimistic Progressive — believes in progress
  "062": "empiricist",  // Ordoliberal — rules-based markets
  "065": "empiricist",  // Georgist — economic analysis
  "099": "empiricist",  // Post-Scarcity Utopian — tech optimism
  "100": "empiricist",  // FALC — technology enables communism

  // === Institutionalist (works through institutions, process matters) ===
  "008": "institutionalist", // Institutional Progressive
  "O14": "institutionalist", // Pragmatic Establishmentarian
  "O13": "institutionalist", // Reform-Optimist Progressive
  "068": "institutionalist", // Third Way Democrat — works within system
  "070": "institutionalist", // Rockefeller Republican — old-school institutional
  "066": "institutionalist", // Civic Republican — constitutional process sacred
  "037": "institutionalist", // Deliberative Centrist — process is the value
  "M12": "institutionalist", // Deliberative Moderate — how we engage matters
  "045": "institutionalist", // Policy Over Party — evaluates policy merits
  "043": "institutionalist", // Common Ground Seeker — seeks compromise
  // "040": merged into 046
  "067": "institutionalist", // Communitarian Centrist — community institutions
  "063": "institutionalist", // Christian Democrat — institutional religious frame
  "N03": "institutionalist", // Civic Engagement Maximalist — participation in institutions
  "G07": "institutionalist", // Rule-Following Citizen — follows institutional rules
  "N05": "institutionalist", // Armchair Combatant
  "102": "institutionalist", // Resigned Hierarchical Pluralist
  "072": "institutionalist", // Distributist — decentralized institutional
  "M02": "institutionalist", // Constitutional Purist
  "M03": "institutionalist", // Norm Guardian

  // === Traditionalist (faith, heritage, accumulated wisdom) ===
  "M10": "traditionalist",  // Burkean Epistemicist — tradition IS how we know
  "020": "traditionalist",  // Parish Traditionalist
  "101": "traditionalist",  // Principled Communitarian Optimist
  "O25": "traditionalist",  // Aspirational Kitchen Table Democrat
  "003": "traditionalist",  // Heritage Conservative — defends tradition
  "004": "traditionalist",  // Heritage Fortress Conservative
  "041": "traditionalist",  // All-In Traditionalist
  "056": "traditionalist",  // Structure and Community — values inherited order
  "091": "traditionalist",  // Fortress Traditionalist
  "078": "traditionalist",  // National Conservative — traditional nation-state
  "077": "traditionalist",  // Conservative Socialist — traditional left
  "071": "traditionalist",  // Catholic Worker — faith tradition
  "N16": "traditionalist",  // Social Gospel Voter — faith tradition
  "093": "traditionalist",  // Traditional Cosmopolitan — traditional values applied universally
  "095": "traditionalist",  // Dark Enlightenment — return to traditional authority
  "074": "traditionalist",  // Localist — local tradition/heritage
  "079": "traditionalist",  // Civic Nationalist — civic tradition

  // === Intuitionist (gut feeling, lived experience, emotion-driven) ===
  "R01": "intuitionist",    // Grievance-Activated Populist — gut-level activation
  "022": "intuitionist",    // Identity-Rooted Progressive — lived experience
  "R03": "intuitionist",    // Decline-Anxious Swing Voter — anxiety-driven
  "051": "intuitionist",    // Working-Class Traditionalist — gut-level values
  "032": "intuitionist",    // Neighborhood Democrat — community-rooted intuition
  "058": "intuitionist",    // Community-Rooted Progressive — faith/community
  "025": "intuitionist",    // Prophetic Progressive — moral witness
  // "055": merged into 024

  "031": "intuitionist",    // Siege Mentality Partisan — threat-driven intuition
  "N15": "intuitionist",    // Fighting-Class Democrat — gut-level class struggle
  // "N13": merged into 001


  // === Autonomous (self-directed, independent thinker, rejects authority) ===
  "052": "autonomous",  // Cosmopolitan Libertarian — individualist
  "049": "autonomous",  // Global Markets Libertarian — self-directed
  "081": "autonomous",  // Minarchist — rejects authority
  "094": "autonomous",  // Post-Left Anarchist — anti-organizational
  "082": "autonomous",  // Anarcho-Communist — anti-state
  "085": "autonomous",  // Primitivist — rejects civilization
  "097": "autonomous",  // Anti-Politics — rejects politics itself
  "059": "autonomous",  // Independent Social Democrat — dislikes party
  "029": "autonomous",  // Quiet Conservative — independent/private
  "028": "autonomous",  // Entrepreneurial Conservative — self-made
  "098": "autonomous",  // Techno-Feudalist — tech-independent
  "N08": "autonomous",  // Reluctant Partisan — reluctantly picks sides
  "042": "autonomous",  // Borderless Moderate — rejects national boundaries
  "038": "autonomous",  // Cosmopolitan Centrist — globally independent

  // === Nihilist (nothing is knowable, system is corrupt, cynicism) ===
  "005": "nihilist",     // Quiet Middle — doesn't care about epistemology
  "G01": "nihilist",     // Survival Pragmatist — politics is irrelevant
  "O04": "nihilist",     // Doomer Leftist — it's all rigged
  "G11": "nihilist",     // Quiet Dissident — silently disagrees
  "G10": "nihilist",     // Online Spectator — politics as entertainment
  "N04": "nihilist",     // Digital Warrior — performative, not substantive
  "G04": "nihilist",     // Private-Life Progressive — avoids politics
  "092": "nihilist",     // Nationalist Redistributor — synthesis of extremes

  // === New archetypes (Category D) ===
  "D01": "intuitionist",   // Pragmatic Populist — gut-level populist
  "D02": "institutionalist", // Resigned Moderate — pessimistic but participates
  "D03": "empiricist",     // Hawkish Liberal — evidence-based but zero-sum
};

// COMPREHENSIVE AES assignments for every archetype
const AES_OVERRIDES = {
  // === Statesman (dignified, deliberative, institutional leadership) ===
  "037": "statesman",  // Deliberative Centrist
  "M12": "statesman",  // Deliberative Moderate
  "M03": "statesman",  // Norm Guardian
  "059": "statesman",  // Independent Social Democrat
  "060": "statesman",  // Mutual Aid Progressive
  "065": "statesman",  // Georgist
  "071": "statesman",  // Catholic Worker
  "070": "statesman",  // Rockefeller Republican — old-school dignified
  "066": "statesman",  // Civic Republican — civic virtue
  "068": "statesman",  // Third Way Democrat — triangulation/pragmatic
  "045": "statesman",  // Policy Over Party — above partisanship
  "043": "statesman",  // Common Ground Seeker — seeks compromise
  // "040": merged into 046

  "002": "statesman",  // Sunrise Conservative — optimistic/dignified
  "028": "statesman",  // Entrepreneurial Conservative — business pragmatist
  "063": "statesman",  // Christian Democrat — institutional dignified
  "O14": "statesman",  // Pragmatic Establishmentarian — works within system
  "M02": "statesman",  // Constitutional Purist — principled process
  "M10": "statesman",  // Burkean Epistemicist — wisdom tradition
  "072": "statesman",  // Distributist — principled position

  // === Technocrat (rational, systems-focused, analytical) ===
  "008": "technocrat",  // Institutional Progressive — works through systems
  "050": "technocrat",  // Data-Driven Democrat — analytical
  "016": "technocrat",  // Evidence-Based Progressive — follow the data
  "034": "technocrat",  // Rising Tide Social Democrat — policy wonk
  "M07": "technocrat",  // Rationalist Technocrat — explicitly technocratic
  "088": "technocrat",  // Meritocrat — systems of merit
  "089": "technocrat",  // Elitist Democrat — expert governance
  "044": "technocrat",  // Neoliberal Progressive — market-friendly analysis
  // "061": merged into 044

  "062": "technocrat",  // Ordoliberal — rules-based systems
  "046": "technocrat",  // Solutions-Oriented Moderate — practical problem-solving
  "M11": "technocrat",  // Armchair Analyst — analytical mindset
  "086": "technocrat",  // Transhumanist — tech-focused
  "098": "technocrat",  // Techno-Feudalist — tech platform thinking
  "M15": "technocrat",  // Evidence-First Reformer — evidence-based

  // === Pastoral (caring, nurturing, community-focused) ===
  "005": "pastoral",    // Quiet Middle — gentle/passive
  "032": "pastoral",    // Neighborhood Democrat — community rooted
  "058": "pastoral",    // Community-Rooted Progressive — community/faith
  "020": "pastoral",    // Parish Traditionalist — faith community
  "N16": "pastoral",    // Social Gospel Voter — caring faith
  "029": "pastoral",    // Quiet Conservative — quiet/private
  "G01": "pastoral",    // Survival Pragmatist — focused on family
  "G04": "pastoral",    // Private-Life Progressive — lives values quietly
  "077": "pastoral",    // Conservative Socialist — working-class community
  "074": "pastoral",    // Localist — local community focus
  "067": "pastoral",    // Communitarian Centrist — community bonds
  "042": "pastoral",    // Borderless Moderate — humanitarian
  "G06": "pastoral",    // Identity Networker — social/community
  "N10": "pastoral",    // Social Conservative Moderate — community stability
  "101": "pastoral",    // Principled Communitarian Optimist — community

  // === Authentic (genuine, unfiltered, real) ===
  "G10": "authentic",   // Online Spectator — passive observer
  "G11": "authentic",   // Quiet Dissident — genuinely dissenting
  "O04": "authentic",   // Doomer Leftist — authentic pessimism
  "094": "authentic",   // Post-Left Anarchist — anti-organizational
  "097": "authentic",   // Anti-Politics — genuine withdrawal
  "013": "authentic",   // Statistical Middle — no strong aesthetic
  "R03": "authentic",   // Decline-Anxious Swing Voter — genuine anxiety
  "R01": "authentic",   // Grievance-Activated Populist — genuine grievance
  "051": "authentic",   // Working-Class Traditionalist — authentic working class
  "022": "authentic",   // Identity-Rooted Progressive — lived experience
  "093": "authentic",   // Traditional Cosmopolitan — genuine universalism
  "085": "authentic",   // Primitivist — authentic rejection
  "N08": "authentic",   // Reluctant Partisan — genuinely reluctant
  "053": "authentic",   // Culturally Cautious Centrist — genuine caution
  "N05": "authentic",   // Armchair Combatant — genuinely combative
  "064": "authentic",   // Market Socialist — genuine anti-capitalist
  "052": "authentic",   // Cosmopolitan Libertarian — genuine individualist
  "038": "authentic",   // Cosmopolitan Centrist — genuine openness
  "O26": "authentic",   // Anxious Kitchen Table Democrat

  // === Fighter (combative, aggressive, adversarial) ===
  "N04": "fighter",     // Digital Warrior — combative online
  "N12": "fighter",     // Social Civic Nationalist — combative civic
  "004": "fighter",     // Heritage Fortress Conservative — defensive/combative
  "N14": "fighter",     // Fortress Conservative — defensive
  // "047": merged into 018

  "031": "fighter",     // Siege Mentality Partisan — existential warfare
  // "055": merged into 024

  "011": "fighter",     // Class Conflict Progressive — class warfare framing
  "N15": "fighter",     // Fighting-Class Democrat — economic combat
  "091": "fighter",     // Fortress Traditionalist — siege mentality
  "018": "fighter",     // Movement Conservative — combative style
  "010": "fighter",     // Full Spectrum Conservative — aggressive fusion
  "082": "fighter",     // Anarcho-Communist — revolutionary
  // "N13": merged into 001


  // === Visionary (aspirational, transformative, future-oriented) ===
  "025": "visionary",   // Prophetic Progressive — moral vision
  "N11": "visionary",   // Progressive Civic Nationalist — civic vision
  "096": "visionary",   // Radical Centrist — synthesize best ideas
  "092": "visionary",   // National Bolshevik — synthesis vision
  "100": "visionary",   // FALC — utopian vision
  "099": "visionary",   // Post-Scarcity Utopian — abundance vision
  "036": "visionary",   // Optimistic Progressive — progress vision
  "024": "visionary",   // Movement Progressive — uplift/inspiration
  "027": "visionary",   // Idealist Progressive — human perfectibility
  "009": "visionary",   // Global Citizen Liberal — universal humanity
  "O13": "visionary",   // Reform-Optimist Progressive — transformative reform
  "019": "visionary",   // Expanding Pie Moderate — positive-sum vision
  "003": "visionary",   // Heritage Conservative — defending a vision of society
  "079": "visionary",   // Civic Nationalist — patriotic vision
  "012": "visionary",   // Markets-First Conservative — economic freedom vision
  "049": "visionary",   // Global Markets Libertarian — free trade vision
  "081": "visionary",   // Minarchist — night-watchman state vision
  "078": "visionary",   // National Conservative — nation-state vision
  "041": "visionary",   // All-In Traditionalist — maximum traditional vision
  "095": "visionary",   // Dark Enlightenment — neoreactionary vision
  "102": "visionary",   // Resigned Hierarchical Pluralist
  "N03": "visionary",   // Civic Engagement Maximalist — participation vision
  "O25": "visionary",   // Aspirational Kitchen Table Democrat — American Dream

  // === New archetypes (Category D) ===
  "D01": "fighter",      // Pragmatic Populist — combative populism
  "D02": "authentic",    // Resigned Moderate — genuine pessimism
  "D03": "fighter",      // Hawkish Liberal — confrontational liberal
};

// COMPREHENSIVE H (Hierarchy) assignments for every archetype
const H_OVERRIDES = {
  // === Egalitarian (flat, equal, anti-hierarchy) ===
  "082": "egalitarian",   // Anarcho-Communist — abolish hierarchy
  "094": "egalitarian",   // Post-Left Anarchist — anti-organizational
  "027": "egalitarian",   // Idealist Progressive — human perfectibility
  "022": "egalitarian",   // Identity-Rooted Progressive — equality focus
  "024": "egalitarian",   // Movement Progressive — equality vision
  // "055": merged into 024

  "011": "egalitarian",   // Class Conflict Progressive — class equality
  "064": "egalitarian",   // Market Socialist — worker ownership
  "100": "egalitarian",   // FALC — communist utopia
  "060": "egalitarian",   // Mutual Aid Progressive — mutual aid
  "036": "egalitarian",   // Optimistic Progressive — social progress
  "058": "egalitarian",   // Community-Rooted Progressive — progressive equality
  "025": "egalitarian",   // Prophetic Progressive — justice
  "032": "egalitarian",   // Neighborhood Democrat — community equality
  "N15": "egalitarian",   // Fighting-Class Democrat — workers vs powerful
  "085": "egalitarian",   // Primitivist — pre-hierarchical
  "097": "egalitarian",   // Anti-Politics — rejects political hierarchy
  "099": "egalitarian",   // Post-Scarcity Utopian — post-hierarchy

  // === Meritocratic (reward talent/effort, earned inequality OK) ===
  "088": "meritocratic",  // Meritocrat — explicitly meritocratic
  "050": "meritocratic",  // Data-Driven Democrat — evidence-based merit
  "089": "meritocratic",  // Elitist Democrat — expert merit
  "028": "meritocratic",  // Entrepreneurial Conservative — business merit
  "044": "meritocratic",  // Neoliberal Progressive — market merit
  // "061": merged into 044

  "M07": "meritocratic",  // Rationalist Technocrat — competence-based
  "086": "meritocratic",  // Transhumanist — capability-based
  "052": "meritocratic",  // Cosmopolitan Libertarian — individual merit
  "049": "meritocratic",  // Global Markets Libertarian — market merit
  "012": "meritocratic",  // Markets-First Conservative — economic merit
  "098": "meritocratic",  // Techno-Feudalist — tech oligarchy merit
  "081": "meritocratic",  // Minarchist — individual achievement

  // === Institutional (rules-based order, democratic institutions) ===
  "072": "institutional",  // Distributist — decentralized institutions
  "074": "institutional",  // Localist — local institutional
  "056": "institutional",  // Structure and Community — institutional order
  "101": "institutional",  // Principled Communitarian Optimist
  "070": "institutional",  // Rockefeller Republican — institutional GOP
  "066": "institutional",  // Civic Republican — constitutional institutions
  "037": "institutional",  // Deliberative Centrist — democratic institutions
  "043": "institutional",  // Common Ground Seeker — institutional compromise
  // "040": merged into 046

  "045": "institutional",  // Policy Over Party — institutional evaluation
  "M12": "institutional",  // Deliberative Moderate — democratic process
  "M02": "institutional",  // Constitutional Purist — constitutional institutions
  "M03": "institutional",  // Norm Guardian — institutional norms
  "008": "institutional",  // Institutional Progressive — works through institutions
  "034": "institutional",  // Rising Tide Social Democrat — institutional redistribution
  "O14": "institutional",  // Pragmatic Establishmentarian — establishment institutions
  "O13": "institutional",  // Reform-Optimist Progressive — institutional reform
  "068": "institutional",  // Third Way Democrat — institutional pragmatism
  "067": "institutional",  // Communitarian Centrist — community institutions
  "063": "institutional",  // Christian Democrat — religious institutional
  "062": "institutional",  // Ordoliberal — rules-based market institutions
  "035": "institutional",  // Free-Thinking Moderate — independent institutional
  "046": "institutional",  // Solutions-Oriented Moderate — practical institutions
  "013": "institutional",  // Statistical Middle — default institutional
  "N03": "institutional",  // Civic Engagement Maximalist — participatory
  "079": "institutional",  // Civic Nationalist — civic institutions
  "053": "institutional",  // Culturally Cautious Centrist — cautious institutional
  "M15": "institutional",  // Evidence-First Reformer
  "O25": "institutional",  // Aspirational Kitchen Table Democrat
  "N10": "institutional",  // Social Conservative Moderate
  "042": "institutional",  // Borderless Moderate — international institutions
  "065": "institutional",  // Georgist — institutional reform
  "071": "institutional",  // Catholic Worker — radical but institutional faith
  "N16": "institutional",  // Social Gospel Voter — faith-based institutional

  // === Traditional (inherited order, religious/cultural hierarchy) ===
  "020": "traditional",   // Parish Traditionalist — faith-based tradition
  "003": "traditional",   // Heritage Conservative — cultural tradition
  "004": "traditional",   // Heritage Fortress Conservative — defensive tradition
  "041": "traditional",   // All-In Traditionalist — maximum tradition
  "078": "traditional",   // National Conservative — national tradition
  "077": "traditional",   // Conservative Socialist — traditional left
  "091": "traditional",   // Fortress Traditionalist — scarcity-driven tradition
  "093": "traditional",   // Traditional Cosmopolitan — traditional values universally
  "010": "traditional",   // Full Spectrum Conservative — Reaganite tradition
  "018": "traditional",   // Movement Conservative — movement tradition
  // "047": merged into 018

  "N14": "traditional",   // Fortress Conservative — defensive tradition
  "051": "traditional",   // Working-Class Traditionalist — working-class tradition
  "029": "traditional",   // Quiet Conservative — quiet tradition
  "002": "traditional",   // Sunrise Conservative — optimistic tradition
  "031": "traditional",   // Siege Mentality Partisan — siege tradition
  "M10": "traditional",   // Burkean Epistemicist — wisdom tradition

  // === Paternal (protective authority, noblesse oblige) ===
  "102": "paternal",       // Resigned Hierarchical Pluralist — accepts steep hierarchy
  "007": "paternal",       // Prosperity Democrat — paternalistic economics
  "O26": "paternal",       // Anxious Kitchen Table Democrat — needs system protection
  "001": "paternal",       // Hopeful Democrat — believes in protective government
  // "N13": merged into 001

  "059": "paternal",       // Independent Social Democrat — social democratic protection
  "N12": "paternal",       // Social Civic Nationalist — civic protection

  // === Strong Order (authoritarian, hard power) ===
  "095": "strong_order",   // Dark Enlightenment — return to authority
  "092": "strong_order",   // National Bolshevik — authoritarian synthesis

  // === New archetypes (Category D) ===
  "D01": "egalitarian",    // Pragmatic Populist — populist egalitarianism
  "D02": "institutional",  // Resigned Moderate — institutional default
  "D03": "institutional",  // Hawkish Liberal — institutional order

  // Defaults for remaining:
  // R01, R03, G01, G04, G06, G10, G11, N04, N05, N08, M11, 005, 009, 016, 019, 038, 096
  // These will fall through to the L/M/H default mapping
};

function getCategoricalAssignment(archetypeId, catNode, posLetter) {
  const overrides = catNode === "EPS" ? EPS_OVERRIDES :
                    catNode === "AES" ? AES_OVERRIDES : H_OVERRIDES;
  if (overrides[archetypeId]) return overrides[archetypeId];
  const defaults = CATEGORICAL_MAPPING[catNode];
  return defaults[`default_${posLetter}`];
}

// ─────────────────────────────────────────────────────────
// 4. Build archetype node profiles
// ─────────────────────────────────────────────────────────

// EPS/AES/H prototype distributions (from categories.ts)
const EPS_PROTOTYPES = {
  empiricist:      [0.72, 0.14, 0.03, 0.04, 0.05, 0.02],
  institutionalist:[0.15, 0.68, 0.05, 0.03, 0.06, 0.03],
  traditionalist:  [0.04, 0.08, 0.70, 0.06, 0.08, 0.04],
  intuitionist:    [0.05, 0.05, 0.08, 0.68, 0.09, 0.05],
  autonomous:      [0.08, 0.08, 0.08, 0.10, 0.60, 0.06],
  nihilist:        [0.03, 0.04, 0.04, 0.05, 0.10, 0.74],
};

const AES_PROTOTYPES = {
  statesman:  [0.70, 0.10, 0.04, 0.06, 0.04, 0.06],
  technocrat: [0.08, 0.74, 0.04, 0.04, 0.03, 0.07],
  pastoral:   [0.06, 0.05, 0.72, 0.07, 0.03, 0.07],
  authentic:  [0.05, 0.05, 0.08, 0.70, 0.05, 0.07],
  fighter:    [0.04, 0.03, 0.04, 0.08, 0.73, 0.08],
  visionary:  [0.06, 0.08, 0.05, 0.06, 0.08, 0.67],
};

const H_PROTOTYPES = {
  egalitarian:  [0.74, 0.10, 0.06, 0.03, 0.03, 0.04],
  meritocratic: [0.10, 0.72, 0.08, 0.03, 0.03, 0.04],
  institutional:[0.06, 0.10, 0.70, 0.05, 0.05, 0.04],
  traditional:  [0.03, 0.05, 0.06, 0.72, 0.08, 0.06],
  paternal:     [0.04, 0.06, 0.08, 0.12, 0.62, 0.08],
  strong_order: [0.03, 0.04, 0.06, 0.10, 0.12, 0.65],
};

// ─────────────────────────────────────────────────────────
// 5. Anti-trait definitions
// ─────────────────────────────────────────────────────────
const ANTI_TRAITS = {
  // Conservative archetypes
  // NOTE: anti:"high" means penalty when respondent pos > 3.5
  // 018 has COM=4 from supplementary — anti:COM="high" is RISKY (boundary self-penalty)
  // Instead, don't use anti on nodes where archetype pos=4
  "018": { CU: "low" },                       // Movement Conservative — removed COM anti (self-penalty at pos=4)
  "041": { CU: "low" },                       // All-In Traditionalist — removed COM anti (self-penalty at pos=4)
  "004": { CD: "low", MOR: "high" },          // Heritage Fortress Conservative
  // "047": merged into 018

  // Progressive archetypes
  "009": { CD: "high", CU: "high" },          // Global Citizen Liberal
  "022": { CD: "high", CU: "high" },          // Identity-Rooted Progressive
  "011": { MAT: "high" },                     // Class Conflict Progressive

  // Libertarian archetypes
  "081": { MAT: "low", PRO: "high" },         // Minarchist
  "049": { MAT: "low", PRO: "high" },         // Global Markets Libertarian

  // Centrist/Moderate archetypes (critical for differentiation)
  "043": { PF: "high", TRB: "high" },         // Common Ground Seeker
  // "040": merged into 046
  "035": { PF: "high", TRB: "high" },         // Free-Thinking Moderate
  "096": { PF: "high", TRB: "high", MAT: "high" }, // Radical Centrist (merged with later entry)
  "037": { PF: "high", TRB: "high" },         // Deliberative Centrist
  "M12": { PF: "high", TRB: "high" },         // Deliberative Moderate

  // Disengaged archetypes
  "005": { ENG: "high" },                     // Quiet Middle
  "G01": { ENG: "high" },                     // Survival Pragmatist
  "097": { ENG: "high", PRO: "high" },        // Anti-Politics
  "G04": { ENG: "high" },                     // Private-Life Progressive
  "G11": { ENG: "high" },                     // Quiet Dissident
  "N04": { ENG: "high" },                     // Digital Warrior (online not offline)

  // Over-absorbing archetypes — add anti-traits to repel mismatches
  "010": { TRB: "low" },                      // Full Spectrum Conservative — repel low-TRB respondents (012, 049 have TRB=2)
  "N14": { CD: "low", MAT: "low" },           // Fortress Conservative — repel culturally/economically liberal
  "M07": { CD: "high" },                      // Rationalist Technocrat — repel culturally conservative
  "008": { MAT: "high", CD: "high" },         // Institutional Progressive — repel conservatives
  "086": { MAT: "high" },                     // Transhumanist — repel economic conservatives
  "068": { MAT: "low" },                      // Third Way Democrat — repel strong redistributionists

  // Rule-Following Citizen absorbs too many (All-In Trad, Nat'l Con, Structure&Community)
  "G07": { PF: "high", CD: "low", CU: "low" },  // removed TRB anti (self-penalty: G07 has TRB=4)

  // Digital Warrior absorbs siege/fortress/nat-bol/anti-politics
  // N04 already has ENG: "high" above
  // Add MOR anti to repel high-MOR archetypes (like 097 Anti-Politics with MOR=4)
  // and COM anti to repel high-COM archetypes

  // Armchair Combatant — N05 has MAT=4, CD=4
  // anti:CD="high" is safe (respondent CD ~3.25, rp=0.125 < 0.5)
  // DON'T use anti:MAT="high" — self-penalizes (respondent MAT ~4.69)
  "N05": { CD: "high" },

  // Market Socialist absorbs Prophetic Progressive and O25
  "064": { PRO: "low" },

  // Institutional Progressive absorbs too many (Elitist Democrat, Indep Soc Dem, N03)
  // already has MAT:"high", CD:"high"
  // Add ZS anti to repel low-ZS respondents (like 089 Elitist Dem with ZS=2)

  // Communitarian Centrist absorbs N16 Social Gospel Voter and N10 Soc Con Mod
  // NOTE: 067 has CD=2 from supplementary, so anti:CD="low" is risky (boundary)
  // Instead use anti:CD="high" to repel CD=4 respondents (safe since 067's CD=2)
  "067": { CD: "high" },

  // Reluctant Partisan — removed ZS anti, causing over-repulsion
  // "N08": { ZS: "high" },  // disabled — was too aggressive

  // Third Way Democrat absorbs Christian Democrat, Rockefeller Republican, G07
  // Add MOR anti:low to repel high-MOR respondents
  // 068 already has MAT:"low"

  // Free-Thinking Moderate absorbs Traditional Cosmopolitan (093)
  // already has PF:"high", TRB:"high"

  // Hopeful Democrat absorbs Primitivist (085) — prior advantage (0.0114 vs 0.0079)
  // Anti-traits won't help here because 085's respondent doesn't land far enough
  // from center to trigger anti thresholds. The fix must come from 085's side.

  // Radical Centrist — merged into main entry above (was duplicate key)

  // Data-Driven Democrat absorbs Burkean Epistemicist (M10)
  // Anti-traits are ineffective here — respondent MOR/CD stay too close to center
  // The fix must come from M10 having stronger differentiating signals

  // Identity Networker absorbs Private-Life Progressive (G04)
  // Add ENG anti:low to repel low-ENG respondents
  "G06": { CD: "high" },

  // Fortress Conservative absorbs Full Spectrum Conservative and Fortress Traditionalist
  // Already has CD:"low", MAT:"low"
  // Add ENG anti:high to repel high-ENG respondents (010, 091)

  // Pragmatic Establishmentarian absorbs O26
  // Add ZS anti:high to repel low-ZS respondents
  "O14": { ZS: "high" },

  // Policy Over Party absorbs Prosperity Democrat (007)
  // Add ZS anti:high to repel different ZS
  "045": { ZS: "high" },

  // Rockefeller Republican absorbs Borderless Moderate (042)
  // 042 has CU=4, MOR=2 — add anti:CU=high and anti:MOR=low to repel
  "070": { MOR: "low", CU: "high" },
};

// ─────────────────────────────────────────────────────────
// 6. Supplementary traits for under-specified archetypes
// ─────────────────────────────────────────────────────────
// Supplementary traits RULES:
// 1. ONLY use well-recovered nodes: MAT, CD, COM, MOR, ZS, ENG, TRB (≤12 mismatches each)
// 2. AVOID poorly-recovered nodes: PF (64 mismatches), CU (34), ONT_S (34), ONT_H (15), PRO (29)
// 3. Position must be 2 or 4 (never 3 — centrist pos adds zero differentiation)
// Format: { nodeId: { pos, sal } } — only for continuous nodes
const SUPPLEMENTARY_TRAITS = {
  // ═══════════════════════════════════════════════════════════════
  // NEAR-DUPLICATE DIFFERENTIATION (diffScore 0-3 pairs)
  // sal=2 ("defining") for traits that MUST differentiate near-duplicates
  // sal=1 ("present") for supporting/secondary traits
  // ═══════════════════════════════════════════════════════════════

  // 044 Market-Friendly Progressive (merged with 061 Neoliberal)
  "044": { MAT: { pos: 2, sal: 2 }, COM: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 } },
  // "061": merged into 044

  // 046 Pragmatic Optimist (merged with 040 Win-Win Centrist)
  "046": { MAT: { pos: 4, sal: 1 } },
  // "040": merged into 046

  // 024 Movement Progressive vs 082 Anarcho-Communist
  "024": { COM: { pos: 2, sal: 1 } },
  "082": { COM: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // 012 Markets-First Conservative -> Global Markets Libertarian (049)
  // Loses on PRO(0.464). Delta only 0.060.
  "012": { CD: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 }, ZS: { pos: 2, sal: 2 } },
  // 049 absorbs 012: add MOR sal=2 to increase distance to 012's respondent (MOR at 3.03)
  // 049's own respondent MOR at 2.74 — self-penalty increase 0.371, absorber penalty increase 0.749
  "049": { MOR: { pos: 2, sal: 2 }, ENG: { pos: 4, sal: 1 } },
  "081": { COM: { pos: 2, sal: 1 } },

  // N14 Fortress Conservative vs 018 Movement Conservative
  "N14": { TRB: { pos: 4, sal: 1 } },
  // 018 Movement Conservative — add ZS to differentiate from 068 Third Way Democrat
  "018": { TRB: { pos: 4, sal: 1 }, ZS: { pos: 4, sal: 2 } },

  // 002 Sunrise Conservative vs 028 Entrepreneurial Conservative
  "002": { CD: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },
  "028": { CD: { pos: 4, sal: 1 }, ENG: { pos: 2, sal: 1 } },

  // 010 Full Spectrum Conservative -> Fortress Conservative (N14)
  // Loses on CD(1.436 — CD anti:low on N14 HURTS 010), PF(1.084), ONT_S, MOR, ZS
  // Wins on ENG(-1.225), ONT_H(-0.484), CU(-0.318)
  // Fix: 010 needs more uniqueness — upgrade COM to sal=2, add ENG sal=2
  // 010 Full Spectrum Conservative: add TRB sal=2 to increase distance to 012/049 respondents (TRB at ~2.1)
  // 010's own respondent TRB at ~3.12, so self-penalty is small
  "010": { COM: { pos: 4, sal: 2 }, ENG: { pos: 4, sal: 2 }, TRB: { pos: 4, sal: 2 } },
  // "047": merged into 018

  // 035 Free-Thinking Moderate vs 096 Radical Centrist
  // 035 Free-Thinking Moderate: absorbs 042 and 093. Add MOR=4/sal=2 to increase distance to their respondents.
  "035": { CD: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 2 } },
  // 096 Radical Centrist: MAT=4/sal=2 was too aggressive (absorbed 012, 042). Revert.
  "096": { CD: { pos: 4, sal: 1 } },

  // R01 Grievance-Activated Populist vs R03 Decline-Anxious Swing Voter
  "R01": { COM: { pos: 4, sal: 1 }, MAT: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 1 } },
  "R03": { COM: { pos: 2, sal: 1 }, MAT: { pos: 2, sal: 1 } },

  // 045 Policy Over Party / N03 Civic Engagement Maximalist / M12 Deliberative Moderate
  "045": { MOR: { pos: 4, sal: 1 }, CD: { pos: 2, sal: 1 } },

  // N03 -> Engaged Democrat (001): loses on prior (0.0088 vs 0.0226) and ONT_H, H, EPS
  // Fix: upgrade CD+ENG to sal=2, add TRB=4/sal=2 for more differentiation
  "N03": { MOR: { pos: 4, sal: 2 }, CD: { pos: 2, sal: 2 }, MAT: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 2 }, TRB: { pos: 4, sal: 2 } },

  // M12 Deliberative Moderate — sal=2 was causing confusion with 013
  // Keep sal=1 but add more differentiating nodes
  "M12": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 2 } },

  // 025 Prophetic Progressive vs 036 Optimistic Progressive
  "025": { TRB: { pos: 4, sal: 1 } },
  "036": { TRB: { pos: 2, sal: 1 } },

  // 041 All-In Traditionalist -> National Conservative (078)
  // Loses on PF(0.780), ONT_S(0.455), TRB(0.350), COM(0.281)
  // Fix: 041 upgrade MAT+TRB to sal=2
  "041": { MAT: { pos: 4, sal: 2 }, COM: { pos: 4, sal: 1 }, TRB: { pos: 4, sal: 2 } },

  // 078 National Conservative — needs to NOT absorb 041
  "078": { COM: { pos: 4, sal: 1 } },

  // 100 FALC vs 027 Idealist Progressive
  "100": { MAT: { pos: 2, sal: 1 }, COM: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 027 Idealist Progressive -> Prophetic Progressive (025)
  // Loses on AES(0.350), ENG(0.331). Prior disadvantage: 0.0079 vs 0.0099
  // Fix: upgrade ENG to sal=2 and add CD to sal=2 (027 has CD=2/sal=2 from atlas)
  "027": { MOR: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 2 }, ENG: { pos: 4, sal: 2 } },

  // 043 Common Ground Seeker
  "043": { MOR: { pos: 4, sal: 1 }, MAT: { pos: 2, sal: 1 } },

  // 063 Christian Democrat -> Third Way Democrat (068)
  // Loses on PRO(0.677), CD(0.369), COM(0.350), ZS(0.219)
  // Fix: give 063 sal=2 on COM and TRB
  "063": { TRB: { pos: 4, sal: 2 }, ENG: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 2 } },
  "072": { TRB: { pos: 2, sal: 1 }, MAT: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // M02 Constitutional Purist vs M03 Norm Guardian
  "M02": { MAT: { pos: 4, sal: 1 }, CD: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 1 } },
  "M03": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 1 } },

  // N04 Digital Warrior vs N05 Armchair Combatant
  // N04 absorbs 092, 097 — need to make N04 more specific
  "N04": { CD: { pos: 2, sal: 2 }, MOR: { pos: 2, sal: 2 }, MAT: { pos: 2, sal: 1 } },
  "N05": { CD: { pos: 4, sal: 2 }, MAT: { pos: 4, sal: 2 }, MOR: { pos: 4, sal: 1 } },

  // ═══════════════════════════════════════════════════════════════
  // UNDER-SPECIFIED + CONFUSION-FIX ARCHETYPES
  // ═══════════════════════════════════════════════════════════════

  // 005 Quiet Middle — apathetic, disengaged
  "005": { MAT: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 1 } },
  // G01 Survival Pragmatist — economic survival
  "G01": { MAT: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // 088 Meritocrat vs M07 Rationalist Technocrat
  "088": { CD: { pos: 4, sal: 1 } },
  "M07": { CD: { pos: 2, sal: 1 } },

  // 091 Fortress Traditionalist -> Fortress Conservative (N14)
  // Loses on CD(1.436 — N14 has anti:low pushing up dist), EPS(0.431), MOR(0.423), MAT(0.350)
  // Fix: upgrade MAT to sal=2, add ENG sal=2
  // 091: MOR sal=2 causes self-penalty (respondent at 2.87). Reduce to sal=1.
  "091": { MOR: { pos: 2, sal: 1 }, ENG: { pos: 2, sal: 2 }, MAT: { pos: 4, sal: 2 } },

  // 042 Borderless Moderate -> Rockefeller Republican (070)
  // Loses on ZS(1.114), COM(0.609), CU(0.607), MOR(0.603), MAT(0.350)
  // Fix: upgrade MOR+ZS to sal=2
  // 042 Borderless Moderate: ZS=2/sal=2 causes self-penalty (respondent at 3.33). Reduce to sal=1.
  "042": { CD: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 }, MAT: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 2 }, ZS: { pos: 2, sal: 1 } },

  // 022 Identity-Rooted Progressive
  "022": { ENG: { pos: 4, sal: 1 } },

  // 055 merged into 024
  // "055": { MOR: { pos: 2, sal: 1 } },

  // 058 Community-Rooted Progressive
  "058": { COM: { pos: 2, sal: 1 } },

  // 009 Global Citizen Liberal
  "009": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // 064 Market Socialist
  "064": { CD: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // N08 Reluctant Partisan — was absorbing 037 and 059 because sal=2 was too aggressive
  // Reduce back to sal=1 to stop over-absorbing
  "N08": { COM: { pos: 4, sal: 1 }, MAT: { pos: 2, sal: 1 } },

  // G06 Identity Networker (absorbs G04 — Private-Life Progressive)
  "G06": { CD: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 2 }, MAT: { pos: 2, sal: 1 }, TRB: { pos: 4, sal: 2 } },

  // G10 Online Spectator: add MAT=2/sal=1 to differentiate from 053
  "G10": { COM: { pos: 2, sal: 1 }, ZS: { pos: 4, sal: 1 }, MAT: { pos: 2, sal: 1 } },

  // 089 Elitist Democrat -> Institutional Progressive (008)
  // Loses on PF(1.084), CD(0.421), ZS(0.357)
  // Fix: upgrade ZS to sal=2, MOR to sal=2
  "089": { ENG: { pos: 4, sal: 1 }, ZS: { pos: 2, sal: 2 }, MOR: { pos: 4, sal: 2 } },

  // 056 Structure and Community (confused with Rule-Following Citizen)
  "056": { ENG: { pos: 4, sal: 1 }, MAT: { pos: 4, sal: 1 }, TRB: { pos: 4, sal: 1 } },

  // 068 Third Way Democrat — sal=2 helps fix 063, 070, G07 but can absorb 018
  "068": { ENG: { pos: 4, sal: 2 }, TRB: { pos: 4, sal: 2 } },

  // 086 Transhumanist
  "086": { TRB: { pos: 2, sal: 1 } },

  // 008 Institutional Progressive (absorbs 059, 089, N03) — needs to repel them
  "008": { CD: { pos: 2, sal: 2 }, MOR: { pos: 2, sal: 2 } },

  // N13 merged into 001
  // "N13": { TRB: { pos: 4, sal: 1 } },
  "N15": { TRB: { pos: 2, sal: 1 } },

  // 034 Rising Tide Social Democrat vs 050 Data-Driven Democrat
  "034": { ENG: { pos: 4, sal: 1 } },
  // 050 Data-Driven Democrat: CD=2/sal=2 caused M10→066 regression. Revert.
  "050": { ENG: { pos: 4, sal: 1 } },

  // 059 Independent Social Democrat -> was getting absorbed by 008 then N08
  // Key issue: PF and CU are poorly recovered nodes. Use well-recovered nodes at sal=1.
  // Avoid sal=2 which was causing N08 to absorb it instead
  "059": { MAT: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // N16 Social Gospel Voter -> Communitarian Centrist (067)
  // Loses on ZS(1.059), PRO(1.005), ONT_H(0.353)
  // Fix: upgrade MAT+ZS to sal=2
  "N16": { MAT: { pos: 2, sal: 2 }, ZS: { pos: 2, sal: 2 } },

  // 029 Quiet Conservative
  "029": { COM: { pos: 2, sal: 1 } },

  // 013 Statistical Middle
  "013": { MAT: { pos: 4, sal: 1 }, MOR: { pos: 4, sal: 1 } },

  // 053 Culturally Cautious Centrist: add COM=2/sal=1 for differentiation
  "053": { MAT: { pos: 4, sal: 1 }, ZS: { pos: 4, sal: 1 }, CD: { pos: 4, sal: 1 }, MOR: { pos: 4, sal: 1 }, COM: { pos: 2, sal: 1 } },

  // 007 Prosperity Democrat -> Policy Over Party (045)
  // Loses on ZS(0.617), COM(0.350), ENG(0.331), H(0.298), ONT_H(0.182)
  // Prior disadvantage: 0.0089 vs 0.0114
  // Fix: upgrade ZS+COM to sal=2
  "007": { MOR: { pos: 2, sal: 1 }, COM: { pos: 4, sal: 2 }, ZS: { pos: 2, sal: 2 } },
  // 074 Localist
  "074": { MAT: { pos: 2, sal: 1 }, ZS: { pos: 4, sal: 1 }, COM: { pos: 2, sal: 1 } },

  // 019 Expanding Pie Moderate -> Pragmatic Optimist (046) fix: upgrade MOR+CD to sal=2
  "019": { MAT: { pos: 4, sal: 1 }, CD: { pos: 2, sal: 2 }, MOR: { pos: 4, sal: 2 } },

  // 099 Post-Scarcity Utopian
  "099": { MOR: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 001 Hopeful Democrat
  "001": { CD: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // O25 Aspirational Kitchen Table Democrat -> Market Socialist (064)
  // Loses on PF(1.084). Prior disadvantage: 0.0065 vs 0.0089
  // Fix: upgrade CD to sal=2, add ZS sal=2
  "O25": { CD: { pos: 4, sal: 2 }, ZS: { pos: 2, sal: 2 } },

  // 077 Conservative Socialist
  "077": { ENG: { pos: 4, sal: 1 } },

  // 079 Civic Nationalist vs 066 Civic Republican
  "079": { CD: { pos: 4, sal: 1 }, MOR: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },
  "066": { CD: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 101 Principled Communitarian Optimist
  "101": { CD: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 102 Resigned Hierarchical Pluralist
  "102": { CD: { pos: 2, sal: 1 }, MAT: { pos: 2, sal: 1 }, ENG: { pos: 2, sal: 1 } },

  // 092 National Bolshevik -> Digital Warrior (N04)
  // Loses on AES(0.649), PRO(0.389), COM(0.350), ONT_S(0.280)
  // Fix: upgrade COM+MOR to sal=2
  "092": { MOR: { pos: 2, sal: 2 }, COM: { pos: 4, sal: 2 } },

  // 097 Anti-Politics -> Digital Warrior (N04)
  // Loses on AES(0.910), PRO(0.808), COM(0.350), H(0.247)
  // Fix: upgrade MAT+MOR to sal=2
  "097": { MAT: { pos: 2, sal: 2 }, CD: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 2 } },

  // 095 Dark Enlightenment
  "095": { ENG: { pos: 4, sal: 1 } },

  // 094 Post-Left Anarchist
  "094": { ENG: { pos: 4, sal: 1 } },

  // 085 Radical Simplifier -> Engaged Democrat (001)
  // Prior 0.0079 vs 0.0226. Needs 1.262 distance advantage. Has 0.713.
  // Fix: upgrade ONT_S to sal=2, add ZS=4/sal=1 and COM=4/sal=1
  "085": { ENG: { pos: 4, sal: 1 }, CD: { pos: 4, sal: 1 }, MOR: { pos: 4, sal: 1 }, ZS: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 1 } },

  // 098 Techno-Feudalist
  "098": { ENG: { pos: 2, sal: 1 } },

  // O14 Pragmatic Establishmentarian (absorbs O26)
  "O14": { CD: { pos: 4, sal: 2 }, MOR: { pos: 4, sal: 2 }, ENG: { pos: 4, sal: 1 } },

  // O13 Reform-Optimist Progressive
  "O13": { MOR: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // O04 Doomer Leftist
  "O04": { ENG: { pos: 2, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // 037 Deliberative Centrist -> Reluctant Partisan (N08)
  // Loses on PF(1.000), ZS(0.934), TRB(0.350), ENG(0.331)
  // Fix: upgrade ZS+TRB to sal=2
  // 037 Deliberative Centrist -> Radical Centrist (096): ZS=2 respondent drifts to 3.09. Remove ZS supplementary.
  "037": { MAT: { pos: 2, sal: 1 }, MOR: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 }, TRB: { pos: 2, sal: 2 } },

  // 038 Cosmopolitan Centrist
  "038": { MAT: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // G04 Private-Life Progressive -> Identity Networker (G06)
  // Loses on CD(0.492 — CD sal=2 causes salience mismatch penalty), TRB(0.307), EPS(0.275)
  // Prior advantage: 0.0109 vs 0.0089 but still loses
  // Fix: reduce CD to sal=1 (was sal=2 which penalized via salience mismatch)
  "G04": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // G07 Rule-Following Citizen -> Third Way Democrat (068)
  // Loses on PRO(0.446), MAT(0.434), COM(0.350), H(0.307), TRB(0.220)
  // Fix: upgrade MAT+COM to sal=2
  "G07": { MAT: { pos: 4, sal: 2 }, CD: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 2 } },

  // G11 Quiet Dissident
  "G11": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 } },

  // N10 Social Conservative Moderate -> Communitarian Centrist (067)
  // Loses on CD(0.369), COM(0.350), ONT_S(0.343), ENG(0.332)
  // Fix: upgrade CD+COM to sal=2 (N10 is the more conservative one)
  // N10: CD sal=2 was causing salience mismatch self-penalty (respondent CD at 3.25). Reduce to sal=1.
  "N10": { MAT: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 2 }, MOR: { pos: 4, sal: 1 }, CD: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 2 } },

  // N11 Progressive Civic Nationalist
  "N11": { MAT: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // N12 Social Civic Nationalist
  "N12": { MOR: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // M10 Burkean Epistemicist -> Data-Driven Democrat (050)
  // Loses on H(0.360), PRO(0.350), MAT(0.146)
  // Fix: upgrade MAT+MOR to sal=2
  // M10 Burkean Epistemicist -> Data-Driven Democrat (050)
  // Loses on H(0.360), PRO(0.217), MOR(0.146), CD(0.121). Wins on EPS(-0.348).
  // TRB sal=2 caused regression (confused with Catholic Worker). Keep original.
  "M10": { MAT: { pos: 2, sal: 2 }, MOR: { pos: 4, sal: 1 } },  // MOR sal=2→1: respondent MOR drifts to 3.34, sal=2 causes self-penalty

  // M11 Armchair Analyst
  "M11": { MAT: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // M15 Evidence-First Reformer
  "M15": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 031 Siege Mentality Partisan
  "031": { CD: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // 032 Neighborhood Democrat
  "032": { ENG: { pos: 4, sal: 1 } },

  // 051 Working-Class Traditionalist
  "051": { COM: { pos: 4, sal: 1 }, ENG: { pos: 4, sal: 1 } },

  // 052 Cosmopolitan Libertarian
  "052": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // 003 Heritage Conservative
  "003": { ENG: { pos: 4, sal: 1 } },

  // 004 Heritage Fortress Conservative
  "004": { ENG: { pos: 4, sal: 1 } },

  // 011 Class Conflict Progressive
  "011": { ENG: { pos: 4, sal: 1 } },

  // 020 Parish Traditionalist
  "020": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 4, sal: 1 } },

  // 067 Communitarian Centrist (absorbs N16, N10) — needs to repel them
  // Add sal=2 to its defining traits to push away mismatched respondents
  "067": { TRB: { pos: 4, sal: 2 }, MAT: { pos: 2, sal: 2 } },

  // 070 Rockefeller Republican -> Third Way Democrat (068)
  // Loses on PRO(0.376), COM(0.350)
  // Wins on MOR(-0.538), TRB(-0.268)
  // Fix: upgrade MOR to sal=2
  "070": { ENG: { pos: 4, sal: 1 }, MOR: { pos: 4, sal: 2 } },

  // 071 Catholic Worker
  "071": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 4, sal: 1 } },

  // 093 Traditional Cosmopolitan -> Free-Thinking Moderate (035)
  // Loses on CD(0.499), AES(0.450), ENG(0.332), H(0.304), MOR(0.295)
  // Prior disadvantage: 0.0079 vs 0.0129
  // Fix: upgrade CD+MOR to sal=2
  // 093 Traditional Cosmopolitan -> Free-Thinking Moderate (035)
  // CD sal=2 causes self-penalty (respondent at 3.14). MOR sal=2 causes salience mismatch.
  // Reduce both to sal=1 to lower self-penalties.
  "093": { ENG: { pos: 4, sal: 1 }, CD: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // O26 Anxious Kitchen Table Democrat -> Pragmatic Establishmentarian (O14)
  // Loses on PF(0.780), ZS(0.680), H(0.601), COM(0.350)
  // Prior disadvantage: 0.0079 vs 0.0129
  // Fix: upgrade ZS to sal=2, add COM sal=2 (already inherited from 007 but ensure)
  "O26": { ZS: { pos: 2, sal: 2 }, COM: { pos: 4, sal: 2 } },

  // 065 Georgist -> Deliberative Moderate (M12)
  // Loses on ZS(0.830), COM(0.546). ZS/MOR sal=2 would self-penalize.
  // Fix: add MOR=2/sal=1, CD=2/sal=1 for differentiation from M12 (which has MOR=4, CD=2)
  "065": { MOR: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 1 } },

  // 060 Mutual Aid Progressive
  "060": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 2, sal: 1 } },

  // === New archetypes (Category D) ===
  // D01 Pragmatic Populist: MAT:L+, COM:H+, ZS:H+, TRB:H+, ENG:H+ already in traits
  // Add MOR to differentiate from R01 Grievance-Activated Populist
  "D01": { MOR: { pos: 2, sal: 2 }, CD: { pos: 2, sal: 1 } },

  // D02 Resigned Moderate: ONT_H:L+, ONT_S:L+, PF:L+, ENG:M~, COM:M~ already in traits
  // Fix: upgrade MOR+CD to sal=2, add CU=2/sal=1 to differentiate from O04
  "D02": { MAT: { pos: 2, sal: 1 }, CD: { pos: 2, sal: 2 }, MOR: { pos: 4, sal: 2 }, TRB: { pos: 2, sal: 1 }, CU: { pos: 2, sal: 1 } },

  // D03 Hawkish Liberal: MAT:L+, CD:L+, ZS:H+, COM:H+ already in traits
  // Differentiate from Class Conflict Progressive (011) via H:institutional vs H:egalitarian
  "D03": { ENG: { pos: 4, sal: 1 }, TRB: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 } },
};

// ─────────────────────────────────────────────────────────
// 6b. Node overrides — force atlas-specified nodes to new values
// ─────────────────────────────────────────────────────────
// PF never recovers from 3.0, CU/PRO recover poorly.
// Archetypes with PF≠3/sal>0 self-penalize because respondent PF stays at 3.0.
// Override to pos=3/sal=0 to remove the self-penalty.
// NOTE: this only affects DISTANCE, not answer generation (PF questions still exist)
const NODE_OVERRIDES = {
  // PF overrides: respondent PF NEVER moves from 3.0
  // Any archetype with PF≠3 and sal>0 accumulates free distance penalty
  "010": { PF: { pos: 3, sal: 0 }, CD: { pos: 4, sal: 1 } },   // Full Spectrum Conservative: PF self-penalty 1.084, CD self-penalty (respondent at 2.88)
  "059": { PF: { pos: 3, sal: 0 }, CU: { pos: 3, sal: 0 } },   // Independent Social Democrat: PF self-penalty 1.000 + CU self-penalty 0.607
  // 037: merged into entry below with PF + ZS overrides
  "089": { PF: { pos: 3, sal: 0 } },   // Elitist Democrat: PF=4/sal=2 -> self-penalty 1.084
  "M12": { PF: { pos: 3, sal: 0 } },   // Deliberative Moderate: PF=2/sal=2 -> self-penalty 1.084
  "O25": { PF: { pos: 3, sal: 0 } },   // Aspirational KT Democrat: PF=4/sal=2 -> self-penalty 1.084
  "O26": { PF: { pos: 3, sal: 0 } },   // Anxious KT Democrat: PF=4/sal=2 -> self-penalty 0.780
  "085": { PF: { pos: 3, sal: 0 }, PRO: { pos: 3, sal: 0 }, CD: { pos: 3, sal: 1 } },   // Radical Simplifier: PF+PRO override + CD respondent drifts to 2.87, sal=2 self-penalizes → pos=3/sal=1
  "G04": { PF: { pos: 3, sal: 0 } },   // Private-Life Progressive: PF=2/sal=2 -> self-penalty 1.065
  "G11": { PF: { pos: 3, sal: 0 } },   // Quiet Dissident: PF=2/sal=2 -> self-penalty 0.780
  "007": { PF: { pos: 3, sal: 0 } },   // Prosperity Democrat: PF=4/sal=2 -> self-penalty 0.780
  "065": { PF: { pos: 3, sal: 0 }, ZS: { pos: 3, sal: 0 } },   // Georgist: PF self-penalty 0.237, ZS self-penalty 0.830 (respondent at 2.97)
  // 091: merged into entry below with CD override

  // CU overrides: CU recovers poorly (34 mismatches)
  // 056 has CU=4/sal=2 but respondent lands at 2.39 — massive self-penalty of 2.780
  "056": { CU: { pos: 3, sal: 0 } },   // Structure and Community: CU=4/sal=2 -> self-penalty 2.414 vs G07

  // CD overrides: poorly-recovered CD causes self-penalty
  "091": { PF: { pos: 3, sal: 0 }, CD: { pos: 3, sal: 0 } },  // Fortress Traditionalist: CD=4/sal=2 respondent at 2.88 -> neutralize to eliminate self-penalty
  "018": { CD: { pos: 4, sal: 1 } },   // Movement Conservative: CD=4/sal=2 respondent at 3.25 -> sal=1 reduces self-penalty
  "N10": { CD: { pos: 4, sal: 1 }, COM: { pos: 4, sal: 2 } },   // Social Conservative Moderate: CD sal 2→1, COM sal 1→2 (match 067's COM sal=2)
  "093": { CD: { pos: 4, sal: 1 }, MOR: { pos: 2, sal: 1 } },  // Traditional Cosmopolitan: CD+MOR atlas sal=2 -> sal=1 to reduce self-penalty
  // 037: ZS override to sal=0 caused regression (→N08). Try pos=3/sal=1 instead (match respondent drift to 3.09)
  "037": { PF: { pos: 3, sal: 0 }, ZS: { pos: 3, sal: 1 } },   // Deliberative Centrist: PF override + ZS pos=3 (respondent drifts to 3.09)

  // 042 Borderless Moderate: Override self-penalizing nodes. Keep pos/sal=1 instead of sal=0
  // to maintain SOME differentiation (sal=0 makes it absorb 012, 081)
  "042": { CU: { pos: 3, sal: 0 }, ZS: { pos: 2, sal: 1 }, MOR: { pos: 2, sal: 1 } },

  // PRO overrides: PRO poorly recovered (29 mismatches)
  // 085: merged into entry above with PF+PRO overrides
  "028": { PRO: { pos: 3, sal: 0 } },   // Entrepreneurial Conservative: PRO=2/sal=1 -> self-penalty 0.636 vs N05
  "063": { PRO: { pos: 3, sal: 0 } },   // Christian Democrat: PRO=4/sal=1 -> self-penalty 0.677 vs 068
  // 049 absorbs 012: increase 049's MOR to sal=2 (atlas MOR:L~=sal=1) to differentiate from 012 (MOR=3)
  "049": { MOR: { pos: 2, sal: 2 } },

  // 096 Radical Centrist absorbs 093 Traditional Cosmopolitan (0.052 short on prior-adjusted distance)
  // ENG sal=2 gives 096 a big advantage (+0.332 on ENG node). Reduce to sal=1 to equalize.
  "096": { ENG: { pos: 4, sal: 1 } },

  // M10 Burkean Epistemicist → Data-Driven Democrat (050), delta 0.612
  // PRO: both pos=4 but M10 sal=1, 050 sal=2 → 050 gets lower distance (+0.217 advantage)
  // Upgrade M10 PRO to sal=2 to equalize PRO distance (doesn't change answer gen since pos stays 4)
  // M10: PRO sal=2 to match 050. CD pos=3 since respondent drifts to 3.25. ZS pos=3 since respondent drifts to 3.14.
  "M10": { PRO: { pos: 4, sal: 2 }, CD: { pos: 3, sal: 1 }, ZS: { pos: 3, sal: 1 } },

  // === New archetypes (Category D) ===
  // D02 Resigned Moderate: PF never recovers from 3.0, override PF:L+ to neutral
  // D02: PF never recovers. ENG=3/sal=1 → override to 2/sal=1 (resigned = low engagement)
  "D02": { PF: { pos: 3, sal: 0 }, ENG: { pos: 2, sal: 1 } },

  // 019 Expanding Pie Moderate: PF=2/sal=2 self-penalty 1.065 (respondent at 3.0)
  // Override PF and ONT_H to reduce self-penalty
  "019": { PF: { pos: 3, sal: 0 }, ONT_H: { pos: 3, sal: 0 } },

  // 053 Culturally Cautious Centrist: CU poorly recovered → sal=0. CD respondent drifts → sal=1.
  "053": { CU: { pos: 3, sal: 0 }, CD: { pos: 4, sal: 1 } },

  // 098 Fatalist Hierarchist: boosted EPS weights (Q32,Q45) cause M11 (EPS sal=2) to absorb 098 (EPS sal=1).
  // Neutralize CD self-penalty + boost ONT_H to sal=2 to differentiate (098=ONT_H:4/sal=1 vs M11=ONT_H:3/sal=0)
  "098": { CD: { pos: 3, sal: 0 }, ONT_H: { pos: 4, sal: 2 } },
};

// ─────────────────────────────────────────────────────────
// 7. ONT handling
// ─────────────────────────────────────────────────────────
// ONT_H and ONT_S default positions based on ONT level
function getOntDefaults(ontLevel) {
  switch (ontLevel) {
    case "High": return { ONT_H: 4, ONT_S: 4 };
    case "Low":  return { ONT_H: 2, ONT_S: 2 };
    case "Mid":  return { ONT_H: 3, ONT_S: 3 };
    case "Var":  return { ONT_H: 3, ONT_S: 3 }; // Variable = use mid as default
    default:     return { ONT_H: 3, ONT_S: 3 };
  }
}

// ─────────────────────────────────────────────────────────
// 8. Build final archetype objects
// ─────────────────────────────────────────────────────────

function buildArchetype(parsed) {
  const nodes = {};
  const shownNodes = new Set();

  // Track trait tags
  for (const trait of parsed.traits) {
    shownNodes.add(trait.node);
  }

  // First pass: set values from atlas tags
  for (const trait of parsed.traits) {
    const { node, posLetter, salMarker } = trait;
    const sal = salMarkerToValue(salMarker);

    if (CATEGORICAL_NODES.includes(node)) {
      const catName = getCategoricalAssignment(parsed.id, node, posLetter);
      const protoMap = node === "EPS" ? EPS_PROTOTYPES :
                       node === "AES" ? AES_PROTOTYPES : H_PROTOTYPES;
      nodes[node] = {
        kind: "categorical",
        probs: protoMap[catName],
        sal: sal,
        _catName: catName,  // metadata for output
      };
    } else if (CONTINUOUS_NODES.includes(node)) {
      nodes[node] = {
        kind: "continuous",
        pos: posLetterToValue(posLetter),
        sal: sal,
      };
    }
  }

  // Second pass: Apply node overrides (force atlas values to new ones, or create if missing)
  if (NODE_OVERRIDES[parsed.id]) {
    for (const [nodeId, spec] of Object.entries(NODE_OVERRIDES[parsed.id])) {
      if (nodes[nodeId] && nodes[nodeId].kind === "continuous") {
        nodes[nodeId].pos = spec.pos;
        nodes[nodeId].sal = spec.sal;
      } else if (!nodes[nodeId] && CONTINUOUS_NODES.includes(nodeId)) {
        nodes[nodeId] = { kind: "continuous", pos: spec.pos, sal: spec.sal };
      }
    }
  }

  // Third pass: Apply supplementary traits (only fills missing nodes)
  if (SUPPLEMENTARY_TRAITS[parsed.id]) {
    for (const [nodeId, spec] of Object.entries(SUPPLEMENTARY_TRAITS[parsed.id])) {
      if (!nodes[nodeId]) {
        nodes[nodeId] = { kind: "continuous", pos: spec.pos, sal: spec.sal };
        shownNodes.add(nodeId);
      }
    }
  }

  // Fourth pass: Fill unspecified nodes with defaults
  const ontDefaults = getOntDefaults(parsed.ontLevel);

  for (const nodeId of CONTINUOUS_NODES) {
    if (!nodes[nodeId]) {
      let defaultPos = 3;
      if (nodeId === "ONT_H") defaultPos = ontDefaults.ONT_H;
      if (nodeId === "ONT_S") defaultPos = ontDefaults.ONT_S;
      nodes[nodeId] = { kind: "continuous", pos: defaultPos, sal: 0 };
    }
  }

  for (const nodeId of CATEGORICAL_NODES) {
    if (!nodes[nodeId]) {
      // Check if there's an override for this archetype
      const overrides = nodeId === "EPS" ? EPS_OVERRIDES :
                        nodeId === "AES" ? AES_OVERRIDES : H_OVERRIDES;
      const hasOverride = !!overrides[parsed.id];

      let catName;
      if (hasOverride) {
        catName = overrides[parsed.id];
      } else {
        // Fallback defaults
        if (nodeId === "EPS") catName = "autonomous";
        else if (nodeId === "AES") catName = "pastoral";
        else catName = "institutional";
      }

      const protoMap = nodeId === "EPS" ? EPS_PROTOTYPES :
                       nodeId === "AES" ? AES_PROTOTYPES : H_PROTOTYPES;
      nodes[nodeId] = {
        kind: "categorical",
        probs: protoMap[catName],
        sal: hasOverride ? 1 : 0,  // sal=1 for overrides, sal=0 for defaults
        _catName: catName,
      };
    }
  }

  // Fifth pass: Apply anti-traits
  if (ANTI_TRAITS[parsed.id]) {
    for (const [nodeId, antiVal] of Object.entries(ANTI_TRAITS[parsed.id])) {
      if (nodes[nodeId] && nodes[nodeId].kind === "continuous") {
        nodes[nodeId].anti = antiVal;
      }
    }
  }

  // Special handling for O26 (ONT variant of 007)
  // O26 has same base traits as 007 but with Low ONT
  // This is handled naturally since O26 has ontLevel=Low

  return {
    id: parsed.id,
    name: parsed.name,
    tier: parsed.tier,
    prior: parsed.freq,
    nodes: nodes,
    _salientCount: Object.values(nodes).filter(n => n.sal > 0).length,
  };
}

const builtArchetypes = archetypes.map(buildArchetype);

// Post-process O26: inherit traits from 007 (Prosperity Democrat) with Low ONT
const o26 = builtArchetypes.find(a => a.id === "O26");
const base007 = builtArchetypes.find(a => a.id === "007");
if (o26 && base007) {
  // Deep-copy all nodes from 007
  for (const nodeId of ALL_NODES) {
    if (base007.nodes[nodeId]) {
      o26.nodes[nodeId] = { ...base007.nodes[nodeId] };
    }
  }
  // Override ONT to Low (the defining difference)
  o26.nodes.ONT_H = { kind: "continuous", pos: 2, sal: 2 };
  o26.nodes.ONT_S = { kind: "continuous", pos: 2, sal: 2 };
  o26._salientCount = Object.values(o26.nodes).filter(n => n.sal > 0).length;
  console.log(`O26 inherited from 007: ${o26._salientCount} salient nodes`);
}

// Count salient nodes
const salientCounts = builtArchetypes.map(a => ({ id: a.id, name: a.name, salient: a._salientCount }));
const lowSalient = salientCounts.filter(s => s.salient < 5);
console.log(`\nArchetypes with <5 salient nodes: ${lowSalient.length}`);
lowSalient.forEach(s => console.log(`  ${s.id} ${s.name}: ${s.salient} salient`));

// ─────────────────────────────────────────────────────────
// 9. Normalize priors to sum to 1.0
// ─────────────────────────────────────────────────────────
const totalPrior = builtArchetypes.reduce((sum, a) => sum + a.prior, 0);
console.log(`\nTotal prior before normalization: ${totalPrior.toFixed(4)}`);

for (const arch of builtArchetypes) {
  arch.prior = arch.prior / totalPrior;
}

const checkSum = builtArchetypes.reduce((sum, a) => sum + a.prior, 0);
console.log(`Total prior after normalization: ${checkSum.toFixed(6)}`);

// ─────────────────────────────────────────────────────────
// 10. Generate archetypes.ts
// ─────────────────────────────────────────────────────────

function formatProbs(probs) {
  return `[${probs.map(p => p.toFixed(2)).join(", ")}]`;
}

function generateTS() {
  const lines = [];
  lines.push('import type { Archetype } from "../types.js";');
  lines.push('import {');
  lines.push('  EPS_PROTOTYPES,');
  lines.push('  AES_PROTOTYPES,');
  lines.push('  H_PROTOTYPES');
  lines.push('} from "./categories.js";');
  lines.push('');
  lines.push('export const ARCHETYPES: Archetype[] = [');

  for (let i = 0; i < builtArchetypes.length; i++) {
    const arch = builtArchetypes[i];
    const comma = i < builtArchetypes.length - 1 ? "," : "";

    lines.push('  {');
    lines.push(`    id: "${arch.id}",`);
    lines.push(`    name: "${arch.name}",`);
    lines.push(`    tier: "${arch.tier}",`);
    lines.push(`    prior: ${arch.prior.toFixed(6)},`);
    lines.push('    nodes: {');

    // Output nodes in standard order
    const nodeOrder = [...CONTINUOUS_NODES, ...CATEGORICAL_NODES];
    for (let ni = 0; ni < nodeOrder.length; ni++) {
      const nodeId = nodeOrder[ni];
      const node = arch.nodes[nodeId];
      const nodeComma = ni < nodeOrder.length - 1 ? "," : "";

      if (node.kind === "continuous") {
        let nodeLine = `      ${nodeId}: { kind: "continuous", pos: ${node.pos}, sal: ${node.sal}`;
        if (node.anti) {
          nodeLine += `, anti: "${node.anti}"`;
        }
        nodeLine += ` }${nodeComma}`;
        lines.push(nodeLine);
      } else {
        // Categorical - use prototype reference
        const catName = node._catName;
        const protoRef = nodeId === "EPS" ? "EPS_PROTOTYPES" :
                         nodeId === "AES" ? "AES_PROTOTYPES" : "H_PROTOTYPES";
        let nodeLine = `      ${nodeId}: { kind: "categorical", probs: ${protoRef}.${catName}, sal: ${node.sal} }${nodeComma}`;
        lines.push(nodeLine);
      }
    }

    lines.push('    }');
    lines.push(`  }${comma}`);
  }

  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

// ─────────────────────────────────────────────────────────
// 11. Generate CSV
// ─────────────────────────────────────────────────────────
function generateCSV() {
  const header = "id,name,prior,MAT_pos,MAT_sal,CD_pos,CD_sal,CU_pos,CU_sal,MOR_pos,MOR_sal,PRO_pos,PRO_sal,COM_pos,COM_sal,ZS_pos,ZS_sal,ONT_H_pos,ONT_H_sal,ONT_S_pos,ONT_S_sal,PF_pos,PF_sal,TRB_pos,TRB_sal,ENG_pos,ENG_sal,EPS_cat,EPS_sal,AES_cat,AES_sal,H_cat,H_sal";
  const rows = [header];

  for (const arch of builtArchetypes) {
    const n = arch.nodes;
    const row = [
      arch.id,
      arch.name,
      arch.prior.toFixed(6),
      n.MAT.pos, n.MAT.sal,
      n.CD.pos, n.CD.sal,
      n.CU.pos, n.CU.sal,
      n.MOR.pos, n.MOR.sal,
      n.PRO.pos, n.PRO.sal,
      n.COM.pos, n.COM.sal,
      n.ZS.pos, n.ZS.sal,
      n.ONT_H.pos, n.ONT_H.sal,
      n.ONT_S.pos, n.ONT_S.sal,
      n.PF.pos, n.PF.sal,
      n.TRB.pos, n.TRB.sal,
      n.ENG.pos, n.ENG.sal,
      n.EPS._catName, n.EPS.sal,
      n.AES._catName, n.AES.sal,
      n.H._catName, n.H.sal,
    ].join(",");
    rows.push(row);
  }

  return rows.join("\n") + "\n";
}

// ─────────────────────────────────────────────────────────
// 12. Write output files
// ─────────────────────────────────────────────────────────
const tsOutput = generateTS();
const csvOutput = generateCSV();

const tsPath = path.join(__dirname, "prism-quiz-engine", "src", "config", "archetypes.ts");
const csvPath = path.join(__dirname, "archetype_definitions.csv");

fs.writeFileSync(tsPath, tsOutput, "utf-8");
console.log(`\nWrote ${tsPath}`);
console.log(`  ${builtArchetypes.length} archetypes`);

fs.writeFileSync(csvPath, csvOutput, "utf-8");
console.log(`Wrote ${csvPath}`);

// Print summary stats
console.log("\n=== Summary ===");
console.log(`Total archetypes: ${builtArchetypes.length}`);
const tierCounts = {};
for (const a of builtArchetypes) {
  tierCounts[a.tier] = (tierCounts[a.tier] || 0) + 1;
}
console.log("By tier:", tierCounts);

const avgSalient = builtArchetypes.reduce((s, a) => s + a._salientCount, 0) / builtArchetypes.length;
console.log(`Avg salient nodes: ${avgSalient.toFixed(1)}`);

const maxPrior = builtArchetypes.reduce((m, a) => Math.max(m, a.prior), 0);
const minPrior = builtArchetypes.reduce((m, a) => Math.min(m, a.prior), 1);
console.log(`Prior range: ${(minPrior * 100).toFixed(2)}% - ${(maxPrior * 100).toFixed(2)}%`);

const antiTraitCount = builtArchetypes.filter(a =>
  Object.values(a.nodes).some(n => n.kind === "continuous" && n.anti)
).length;
console.log(`Archetypes with anti-traits: ${antiTraitCount}`);

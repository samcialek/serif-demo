import { ARCHETYPES } from "./config/archetypes.js";
import {
  EPS_CATEGORIES,
  AES_CATEGORIES,
  H_CATEGORIES,
  TRB_ANCHORS,
} from "./config/categories.js";
import type {
  ContinuousNodeId,
  CategoricalNodeId,
  ContinuousTemplate,
  CategoricalTemplate,
  Archetype,
} from "./types.js";

// ── helpers ────────────────────────────────────────────────────────────

const CONT_IDS: ContinuousNodeId[] = [
  "MAT", "CD", "CU", "MOR", "PRO", "COM",
  "ZS", "ONT_H", "ONT_S", "PF", "TRB", "ENG",
];

const CAT_IDS: CategoricalNodeId[] = ["EPS", "AES", "H"];

const CONT_FULLNAMES: Record<ContinuousNodeId, string> = {
  MAT: "Material Conditions",
  CD: "Cultural Defense",
  CU: "Cultural Universalism",
  MOR: "Moral Absolutism",
  PRO: "Proceduralism",
  COM: "Communitarianism",
  ZS: "Zero-Sum Thinking",
  ONT_H: "Ontological Human Nature",
  ONT_S: "Ontological Social Structure",
  PF: "Political Identity",
  TRB: "Tribalism",
  ENG: "Engagement Level",
};

const CAT_FULLNAMES: Record<CategoricalNodeId, string> = {
  EPS: "Epistemology",
  AES: "Aesthetic / Leader Style",
  H: "Hierarchy",
};

const CAT_LABEL_ARRAYS: Record<CategoricalNodeId, readonly string[]> = {
  EPS: EPS_CATEGORIES,
  AES: AES_CATEGORIES,
  H: H_CATEGORIES,
};

const POS_COLORS: Record<number, string> = {
  1: "#2563eb",
  2: "#93c5fd",
  3: "#d1d5db",
  4: "#fca5a5",
  5: "#dc2626",
};

function salOpacity(sal: number): number {
  switch (sal) {
    case 0: return 0.20;
    case 1: return 0.45;
    case 2: return 0.72;
    case 3: return 1.0;
    default: return 0.20;
  }
}

function salBorder(sal: number): string {
  switch (sal) {
    case 0: return "1px solid transparent";
    case 1: return "1px solid rgba(0,0,0,0.15)";
    case 2: return "2px solid rgba(0,0,0,0.35)";
    case 3: return "3px solid rgba(0,0,0,0.6)";
    default: return "1px solid transparent";
  }
}

function topCategory(probs: number[], labels: readonly string[]): string {
  let maxIdx = 0;
  let maxVal = probs[0]!;
  for (let i = 1; i < probs.length; i++) {
    if ((probs[i] ?? 0) > maxVal) {
      maxVal = probs[i]!;
      maxIdx = i;
    }
  }
  return labels[maxIdx] ?? "?";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── sort archetypes by prior descending ────────────────────────────────

const sorted = [...ARCHETYPES].sort((a, b) => b.prior - a.prior);

// ── build table rows ───────────────────────────────────────────────────

function buildContCell(node: ContinuousTemplate | undefined): string {
  if (!node) {
    return `<td class="cell empty" title="not set">-</td>`;
  }
  const bg = POS_COLORS[node.pos] ?? "#d1d5db";
  const opacity = salOpacity(node.sal);
  const border = salBorder(node.sal);
  const antiMark = node.anti ? `<span class="anti" title="anti=${node.anti}">\u2298</span>` : "";
  const tip = `pos=${node.pos}, sal=${node.sal}${node.anti ? `, anti=${node.anti}` : ""}`;
  return `<td class="cell" style="background:${bg};opacity:${opacity};border:${border}" title="${escapeHtml(tip)}">${node.pos}${antiMark}</td>`;
}

function buildCatCell(node: CategoricalTemplate | undefined, catId: CategoricalNodeId): string {
  if (!node) {
    return `<td class="cell cat-cell empty" title="not set">-</td>`;
  }
  const labels = CAT_LABEL_ARRAYS[catId];
  const top = topCategory([...node.probs], labels);
  const tip = `${top} (sal=${node.sal})`;
  const opacity = salOpacity(node.sal);
  return `<td class="cell cat-cell" style="opacity:${opacity}" title="${escapeHtml(tip)}">${escapeHtml(top)}</td>`;
}

function buildTrbAnchorCell(arch: Archetype): string {
  if (!arch.trbAnchorPrior) {
    return `<td class="cell cat-cell empty" title="none">-</td>`;
  }
  const entries = Object.entries(arch.trbAnchorPrior) as [string, number][];
  if (entries.length === 0) return `<td class="cell cat-cell empty" title="none">-</td>`;
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0]!;
  const tip = entries.map(([k, v]) => `${k}: ${(v * 100).toFixed(0)}%`).join(", ");
  return `<td class="cell cat-cell" title="${escapeHtml(tip)}">${escapeHtml(top[0].slice(0, 4))}</td>`;
}

function buildRow(arch: Archetype): string {
  const priorPct = (arch.prior * 100).toFixed(2);
  const contCells = CONT_IDS.map((id) => {
    const node = arch.nodes[id];
    return buildContCell(node && node.kind === "continuous" ? node : undefined);
  }).join("");
  const catCells = CAT_IDS.map((id) => {
    const node = arch.nodes[id];
    return buildCatCell(node && node.kind === "categorical" ? node : undefined, id);
  }).join("");
  const trbCell = buildTrbAnchorCell(arch);

  return `<tr data-name="${escapeHtml(arch.name.toLowerCase())}" data-id="${escapeHtml(arch.id.toLowerCase())}">
    <td class="cell id-cell">${escapeHtml(arch.id)}</td>
    <td class="cell name-cell">${escapeHtml(arch.name)}</td>
    <td class="cell tier-cell">${escapeHtml(arch.tier)}</td>
    <td class="cell prior-cell">${priorPct}%</td>
    ${contCells}
    ${catCells}
    ${trbCell}
  </tr>`;
}

const rows = sorted.map(buildRow).join("\n");

// ── column headers ─────────────────────────────────────────────────────

const contHeaders = CONT_IDS.map(
  (id) => `<th class="hdr cont-hdr"><span class="hdr-full">${escapeHtml(CONT_FULLNAMES[id])}</span><span class="hdr-abbr">${id}</span></th>`
).join("");

const catHeaders = CAT_IDS.map(
  (id) => `<th class="hdr cat-hdr"><span class="hdr-full">${escapeHtml(CAT_FULLNAMES[id])}</span><span class="hdr-abbr">${id}</span></th>`
).join("");

// ── output HTML ────────────────────────────────────────────────────────

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>PRISM Archetypes Visualization (${ARCHETYPES.length})</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: #fff; color: #1e293b; margin: 0; padding: 16px;
  }
  h1 { font-size: 1.25rem; margin: 0 0 4px 0; }
  .subtitle { font-size: 0.8rem; color: #64748b; margin-bottom: 12px; }

  /* legend */
  .legend {
    display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 14px;
    font-size: 0.75rem; color: #475569; align-items: flex-start;
  }
  .legend-section { display: flex; flex-direction: column; gap: 4px; }
  .legend-section strong { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: #334155; }
  .legend-row { display: flex; gap: 6px; align-items: center; }
  .legend-swatch {
    display: inline-block; width: 22px; height: 16px; border-radius: 2px; border: 1px solid #94a3b8;
  }
  .legend-sal { display: inline-flex; gap: 4px; align-items: center; }
  .legend-sal-box {
    display: inline-block; width: 22px; height: 16px; border-radius: 2px; background: #93c5fd;
  }

  /* filter */
  .filter-bar { margin-bottom: 10px; }
  .filter-bar input {
    padding: 5px 10px; font-size: 0.8rem; border: 1px solid #cbd5e1; border-radius: 4px; width: 280px;
  }
  .count-badge {
    display: inline-block; margin-left: 10px; font-size: 0.75rem; color: #64748b;
  }

  /* table */
  .table-wrap { overflow-x: auto; max-height: calc(100vh - 200px); }
  table {
    border-collapse: separate; border-spacing: 0;
    font-size: 0.72rem; white-space: nowrap;
  }
  thead th {
    position: sticky; top: 0; z-index: 2;
    background: #f8fafc; border-bottom: 2px solid #94a3b8;
    padding: 3px 2px; text-align: center; font-weight: 600;
    vertical-align: bottom;
  }
  /* group header row */
  .group-hdr {
    position: sticky; top: 0; z-index: 3;
    background: #f1f5f9; border-bottom: 1px solid #cbd5e1;
    font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em; color: #475569;
    text-align: center; padding: 2px 4px;
  }
  thead tr:nth-child(2) th {
    top: 22px; /* offset below group row */
    height: 130px;
    white-space: nowrap;
  }
  /* full name shown rotated */
  .hdr-full {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    display: inline-block;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: #1e293b;
  }
  .hdr-abbr {
    display: block;
    font-size: 0.62rem;
    color: #64748b;
    margin-top: 2px;
    font-weight: 500;
  }

  .cell {
    padding: 2px 3px; text-align: center; min-width: 38px; max-width: 50px;
    font-size: 0.72rem; border-bottom: 1px solid #e2e8f0;
    transition: opacity 0.15s;
  }
  .id-cell { font-family: monospace; min-width: 36px; color: #475569; }
  .name-cell { text-align: left; min-width: 160px; max-width: 220px; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
  .tier-cell { min-width: 32px; font-family: monospace; color: #64748b; }
  .prior-cell { min-width: 54px; font-family: monospace; }
  .cat-cell { font-style: italic; color: #334155; background: #f8fafc; min-width: 90px; max-width: 120px; font-size: 0.68rem; }
  .empty { color: #cbd5e1; }

  .anti {
    font-size: 0.6rem; vertical-align: super; margin-left: 1px; color: rgba(0,0,0,0.6);
  }

  tr:hover td { filter: brightness(0.92); }

  /* cont-hdr / cat-hdr coloring */
  .cont-hdr { background: #eff6ff; }
  .cat-hdr  { background: #fef9c3; }

  .hidden { display: none; }
</style>
</head>
<body>

<h1>PRISM Archetypes &mdash; Full Trait Map</h1>
<p class="subtitle">${ARCHETYPES.length} archetypes &middot; sorted by prior (desc) &middot; hover cells for details</p>

<!-- legend -->
<div class="legend">
  <div class="legend-section">
    <strong>Position (continuous nodes)</strong>
    <div class="legend-row">
      <span class="legend-swatch" style="background:#2563eb"></span>1 (strong left/low)
      <span class="legend-swatch" style="background:#93c5fd"></span>2
      <span class="legend-swatch" style="background:#d1d5db"></span>3 (center)
      <span class="legend-swatch" style="background:#fca5a5"></span>4
      <span class="legend-swatch" style="background:#dc2626"></span>5 (strong right/high)
    </div>
  </div>
  <div class="legend-section">
    <strong>Salience (opacity / border)</strong>
    <div class="legend-row legend-sal">
      <span class="legend-sal-box" style="opacity:0.20;border:1px solid transparent"></span>0 (faint)
      <span class="legend-sal-box" style="opacity:0.45;border:1px solid rgba(0,0,0,0.15)"></span>1
      <span class="legend-sal-box" style="opacity:0.72;border:2px solid rgba(0,0,0,0.35)"></span>2
      <span class="legend-sal-box" style="opacity:1.0;border:3px solid rgba(0,0,0,0.6)"></span>3 (bold)
    </div>
  </div>
  <div class="legend-section">
    <strong>Symbols</strong>
    <div class="legend-row">\u2298 = anti constraint (high or low)</div>
  </div>
  <div class="legend-section">
    <strong>Categorical cells</strong>
    <div class="legend-row">Show top category name. Hover for salience level.</div>
  </div>
</div>

<!-- filter -->
<div class="filter-bar">
  <input id="filterInput" type="text" placeholder="Filter by name or ID\u2026" autocomplete="off">
  <span class="count-badge" id="countBadge">${ARCHETYPES.length} shown</span>
</div>

<!-- table -->
<div class="table-wrap">
<table>
<thead>
  <tr>
    <th class="group-hdr" colspan="4">Info</th>
    <th class="group-hdr" colspan="${CONT_IDS.length}" style="background:#eff6ff">Continuous Nodes</th>
    <th class="group-hdr" colspan="${CAT_IDS.length}" style="background:#fef9c3">Categorical Nodes</th>
    <th class="group-hdr" style="background:#f0fdf4">Anch</th>
  </tr>
  <tr>
    <th class="hdr">ID</th>
    <th class="hdr" style="text-align:left">Name</th>
    <th class="hdr">Tier</th>
    <th class="hdr">Prior</th>
    ${contHeaders}
    ${catHeaders}
    <th class="hdr" title="TRB Anchor Prior" style="background:#f0fdf4">TRB_A</th>
  </tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
</div>

<script>
(function() {
  var input = document.getElementById("filterInput");
  var badge = document.getElementById("countBadge");
  var rows = document.querySelectorAll("tbody tr");
  input.addEventListener("input", function() {
    var q = this.value.toLowerCase().trim();
    var shown = 0;
    rows.forEach(function(tr) {
      var name = tr.getAttribute("data-name") || "";
      var id = tr.getAttribute("data-id") || "";
      var match = !q || name.indexOf(q) !== -1 || id.indexOf(q) !== -1;
      tr.classList.toggle("hidden", !match);
      if (match) shown++;
    });
    badge.textContent = shown + " shown";
  });
})();
</script>

</body>
</html>`;

process.stdout.write(html);

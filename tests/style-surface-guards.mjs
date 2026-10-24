/* Shared style QA guards: pure helpers for Node negative cases and Chromium.
   A partial side frame is a real frame even without top/bottom borders.
   SPDX-License-Identifier: AGPL-3.0-or-later */

const visibleBorder = (width, style) =>
  Number(width) > 0 && !["none", "hidden"].includes(String(style || "").toLowerCase());

/* info.border order: top, right, bottom, left.
   info.inset order: right, left (computed padding or measured text distance).
   The violation list makes one-sided regressions observable. */
export function sideBorderViolations(info, minimumInset = 12) {
  const failures = [];
  for (const [name, side, inset] of [["right", 1, 0], ["left", 3, 1]]) {
    if (visibleBorder(info.border[side], info.borderStyles[side])
        && Number(info.inset[inset]) < minimumInset) failures.push(name);
  }
  // Negative-offset outlines may paint *inside* the content box as well.
  if (visibleBorder(info.outlineWidth, info.outlineStyle)
      && Number(info.outlineOffset) < 0) {
    for (const [name, , inset] of [["right", 1, 0], ["left", 3, 1]]) {
      if (Number(info.inset[inset]) < minimumInset && !failures.includes(name)) failures.push(name);
    }
  }
  return failures;
}

const frameProps = new Set([
  "border", "border-width", "border-left", "border-right", "border-inline",
  "border-inline-start", "border-inline-end", "border-left-width",
  "border-right-width", "border-inline-width", "border-inline-start-width",
  "border-inline-end-width", "outline", "outline-width",
]);
const targets = /\.(?:info-row|file-row|text-card|cost-total)(?![\w-])|\[data-surface-role\s*=\s*["'](?:reading-row|cost-summary)["']\]/;
const zeroOrNone = value => /^(?:0(?:\.0+)?(?:px|rem|em)?|none|hidden|initial|unset)$/i.test(String(value).trim());

function paddingSides(declarations) {
  const value = key => declarations.get(key)?.replace(/\s*!important\s*$/, "").trim();
  let left = "0", right = "0";
  const p = value("padding");
  if (p) {
    const words = p.split(/\s+/);
    right = words.length >= 2 ? words[1] : words[0];
    left = words.length >= 4 ? words[3] : words.length >= 2 ? words[1] : words[0];
  }
  const inline = value("padding-inline");
  if (inline) {
    const words = inline.split(/\s+/);
    left = words[0];
    right = words.at(-1);
  }
  left = value("padding-inline-start") ?? value("padding-left") ?? left;
  right = value("padding-inline-end") ?? value("padding-right") ?? right;
  const numeric = val => {
    const match = /^([\d.]+)(px|rem|em)$/.exec(val || "");
    if (!match) return 0; // A var() or an unknown unit is not proof of safe spacing.
    const n = Number(match[1]);
    return match[2] === "px" ? n : n * 16;
  };
  return [numeric(right), numeric(left)];
}

/* Lightweight conservative lint, NOT a full CSS cascade parser.
   It also checks border-inline and side-only properties; computed-style
   Playwright tests remain the authority for specificity and inheritance. */
export function findUnpairedSurfaceFrames(css, minimumInset = 12) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const violations = [];
  for (const match of withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    if (!targets.test(selector)) continue;
    const declarations = new Map();
    for (const entry of match[2].split(";")) {
      const m = /^\s*([\w-]+)\s*:\s*(.+)\s*$/.exec(entry);
      if (m) declarations.set(m[1].toLowerCase(), m[2].trim());
    }
    const frame = [...declarations].filter(([key, val]) => frameProps.has(key)
      && !zeroOrNone(val.replace(/\s*!important\s*$/, "")));
    if (!frame.length) continue;
    const [right, left] = paddingSides(declarations);
    // A positive-offset focus outline does not encroach into text space.
    const insetFrame = frame.filter(([name]) => !name.startsWith("outline")
      || Number.parseFloat(declarations.get("outline-offset") || "0") < 0);
    if (insetFrame.length && (right < minimumInset || left < minimumInset)) {
      violations.push({ selector, properties: insetFrame.map(([name]) => name), left, right });
    }
  }
  return violations;
}

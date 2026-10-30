#!/usr/bin/env node
/* #109: publishing gate. Only emit ID and deterministic JSON source paths.
   Mirrors the existing legacy fallback used by normalizeData(); never edits.
   SPDX-License-Identifier: AGPL-3.0-or-later */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

const file = resolve(process.argv[2] || "trip.json");
try {
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const copy = structuredClone(raw);
  (Array.isArray(copy.days) ? copy.days : []).forEach((day, dayIndex) => {
    day.id ||= `day-${dayIndex + 1}`;
    day.items ||= [];
    day.items.forEach((item, index) => {
      item.id ||= `${day.id}-item-${index + 1}`;
    });
  });
  const sandbox = { window: {} };
  runInNewContext(readFileSync(new URL("../item-identity.js", import.meta.url), "utf8"), sandbox);
  const report = sandbox.window.TravelLiteItemIds.audit(copy.days);
  if (!report.hasIssues) {
    console.log("PASS — globally unique item IDs (" + (copy.days || []).length + " day entries); published data unchanged.");
  } else {
    for (const issue of report.diagnostics) {
      console.error((issue.id === null ? "Invalid item ID" : "Duplicate item ID: " + JSON.stringify(issue.id)) +
        " — " + issue.paths.join(", "));
    }
    process.exitCode = 1;
  }
} catch (error) {
  console.error("ID validation failed: " + error.message);
  process.exitCode = 1;
}

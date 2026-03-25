#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"

node --input-type=module - "$BASE_URL" <<'NODE'
const [baseUrl] = process.argv.slice(2);
const routes = [
  "/atlas",
  "/atlas/portal",
  "/atlas/team-login",
  "/atlas/investors",
  "/atlas/review",
  "/atlas/cases",
  "/atlas/flows",
  "/atlas/library",
  "/atlas/investor-handoff",
  "/atlas/brand/turicum-wordmark.svg"
];

console.log(`Turicum cutover checks against ${baseUrl}`);

for (const route of routes) {
  const url = new URL(route, baseUrl).toString();
  let response;

  try {
    response = await fetch(url, { redirect: "manual" });
  } catch (error) {
    console.error(`Cutover check failed for ${route}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  console.log(`${route.padEnd(40)} ${response.status}`);

  if (response.status >= 400) {
    console.error(`Cutover check failed for ${route}`);
    process.exit(1);
  }
}

console.log("All Turicum cutover checks passed.");
NODE

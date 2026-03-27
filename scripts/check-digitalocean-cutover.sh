#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:3100}"

node --input-type=module - "$BASE_URL" <<'NODE'
const [baseUrl] = process.argv.slice(2);
const routes = [
  "/turicum",
  "/turicum/portal",
  "/turicum/team-login",
  "/turicum/investors",
  "/turicum/review",
  "/turicum/cases",
  "/turicum/flows",
  "/turicum/library",
  "/turicum/investor-handoff",
  "/turicum/brand/turicum-wordmark.svg"
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

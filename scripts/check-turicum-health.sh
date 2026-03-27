#!/bin/zsh

set -euo pipefail

BASE_URL="${1:-https://marketshift.net}"
PATHS=(
  "/turicum"
  "/turicum/portal"
  "/turicum/investors"
  "/turicum/team-login"
  "/turicum/api/health"
)

for path in "${PATHS[@]}"; do
  code=$(/usr/bin/curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${path}")
  printf "%3s %s\n" "$code" "${BASE_URL}${path}"
done

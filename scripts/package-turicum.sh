#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT/dist"
STAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE="$DIST_DIR/turicum-platform-$STAMP.tar.gz"

mkdir -p "$DIST_DIR"
setopt null_glob
rm -f "$DIST_DIR"/turicum-platform-*.tar.gz

cd "$ROOT"

paths=(
  README.md
  package.json
  package-lock.json
  next.config.ts
  next-env.d.ts
  tsconfig.json
  .env.local.example
  app
  components
  config
  data
  docs
  lib
  scripts
  supabase
)

if [[ -d storage ]]; then
  paths+=(storage)
fi

tar \
  --exclude='.DS_Store' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env.local' \
  --exclude='tsconfig.tsbuildinfo' \
  -czf "$ARCHIVE" \
  "${paths[@]}"

printf 'Created %s\n' "$ARCHIVE"

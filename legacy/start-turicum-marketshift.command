#!/bin/zsh
set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

for shell_file in "$HOME/.zprofile" "$HOME/.zshrc" "$HOME/.profile" "$HOME/.bash_profile"; do
  if [[ -f "$shell_file" ]]; then
    source "$shell_file"
  fi
done

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

pause_before_exit() {
  echo ""
  read '?Press Return to close this window...'
}

fail_with_message() {
  local message="$1"
  echo "$message"
  pause_before_exit
  exit 1
}

run_step() {
  local label="$1"
  shift
  echo "==> $label"
  if ! "$@"; then
    fail_with_message "$label failed. Scroll up in this window for the exact error."
  fi
}

if ! command -v npm >/dev/null 2>&1; then
  fail_with_message "npm was not found on this Mac. Install Node.js first, then run start-turicum-marketshift.command again."
fi

if [[ ! -f .env.local ]]; then
  cat > .env.local <<ENVEOF
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=turicum-documents
TURICUM_BASE_PATH=/turicum
APP_ORIGIN=https://marketshift.net
NEXT_PUBLIC_BASE_PATH=/turicum
NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net
ENVEOF
  fail_with_message ".env.local was missing, so a template was created. Add your Supabase values, then run start-turicum-marketshift.command again."
fi

if ! grep -q '^TURICUM_BASE_PATH=/turicum$' .env.local; then
  {
    echo ''
    echo 'TURICUM_BASE_PATH=/turicum'
    echo 'APP_ORIGIN=https://marketshift.net'
    echo 'NEXT_PUBLIC_BASE_PATH=/turicum'
    echo 'NEXT_PUBLIC_APP_ORIGIN=https://marketshift.net'
  } >> .env.local
fi

if [[ ! -d node_modules ]]; then
  run_step "Installing packages" npm install
fi

run_step "Building Turicum for /turicum" npm run build

echo ""
echo "Turicum is starting on http://localhost:3100"
echo "This build is configured for https://marketshift.net/turicum"
echo "Keep this window open while Turicum is running."
echo ""
if ! npx next start -p 3100; then
  fail_with_message "Turicum could not start on port 3100. The port may already be in use."
fi

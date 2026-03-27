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
  fail_with_message "npm was not found on this Mac. Install Node.js first, then run start-turicum.command again."
fi

if [[ ! -d node_modules ]]; then
  run_step "Installing packages" npm install
fi

run_step "Building Turicum" npm run build

echo ""
echo "Turicum is starting on http://localhost:3100"
echo "Keep this window open while Turicum is running."
echo ""
if ! npx next start -p 3100; then
  fail_with_message "Turicum could not start on port 3100. The port may already be in use."
fi

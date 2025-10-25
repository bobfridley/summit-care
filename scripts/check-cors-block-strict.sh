#!/usr/bin/env bash
# scripts/check-cors-block-strict.sh
# Verify that each api/functions/*.{ts,tsx} file includes:
#   - a CORS_HEADERS definition
#   - an OPTIONS preflight handler
# Exits with code 1 if any are missing.

set -euo pipefail

shopt -s nullglob
FILES=(api/functions/*.ts api/functions/*.tsx)
shopt -u nullglob

MISSING=()

for f in "${FILES[@]}"; do
  # Check for our CORS_HEADERS block
  if grep -Eq 'const[[:space:]]+CORS_HEADERS[[:space:]]*:[[:space:]]*Record<.*>' "$f"; then
    has_headers=yes
  else
    has_headers=no
  fi

  # Check for an OPTIONS preflight handler
  if grep -Eq 'if[[:space:]]*\([[:space:]]*req\.method[[:space:]]*===?[[:space:]]*["'\'']OPTIONS["'\'']' "$f"; then
    has_options=yes
  else
    has_options=no
  fi

  if [[ "$has_headers" != "yes" || "$has_options" != "yes" ]]; then
    MISSING+=("$f")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  echo "✅ All functions include CORS headers and an OPTIONS preflight."
  exit 0
fi

echo "⚠️  The following files are missing a CORS header block or OPTIONS preflight:"
printf ' - %s\n' "${MISSING[@]}"
echo
echo "💡 Fix: run:  npm run fix:cors"
exit 1

#!/usr/bin/env bash
# scripts/check-cors-block.sh
# Verify api/functions/*.{ts,tsx} contain a standard CORS block.
# Exits non-zero if any are missing (great for CI / pre-commit).

set -euo pipefail

shopt -s nullglob
FILES=(api/functions/*.ts api/functions/*.tsx)
shopt -u nullglob

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No files found under api/functions/*.ts{,x} — nothing to check."
  exit 0
fi

MISSING=()

for f in "${FILES[@]}"; do
  # Detect our canonical CORS header block (added by add-cors-block.sh)
  if ! grep -Eq 'const\s+CORS_HEADERS\s*:\s*Record<\s*string\s*,\s*string\s*>\s*=\s*\{' "$f"; then
    MISSING+=("$f")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  echo "✅ All functions include a CORS header block."
  exit 0
fi

echo "⚠️  The following files are missing the CORS header block:"
printf ' - %s\n' "${MISSING[@]}"
echo
echo "💡 Fix: run:  npm run fix:cors   (or npm run fix:cors:prod -- sets specific origin)"
exit 1

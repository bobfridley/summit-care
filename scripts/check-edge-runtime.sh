#!/usr/bin/env bash
# scripts/check-edge-runtime.sh
# List api/functions/*.{ts,tsx} that are missing `export const runtime = 'edge';`

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
  if ! grep -Eq "export\s+const\s+runtime\s*=\s*['\"]edge['\"]\s*;" "$f"; then
    MISSING+=("$f")
  fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
  echo "✅ All functions declare runtime='edge'."
  exit 0
fi

echo "⚠️  The following files are missing runtime='edge':"
printf '%s\n' "${MISSING[@]}"
exit 1

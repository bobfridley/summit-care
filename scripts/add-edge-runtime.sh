#!/usr/bin/env bash
# scripts/add-edge-runtime.sh
# Add `export const runtime = 'edge';` to api/functions/*.{ts,tsx} files
# that don't already declare it. Optionally add preferredRegion, too.
#
# Usage:
#   bash scripts/add-edge-runtime.sh
#   bash scripts/add-edge-runtime.sh --region iad1,sfo1
#   bash scripts/add-edge-runtime.sh --dry-run
#
# Notes:
# - Safe to run multiple times (idempotent)
# - Works on macOS & Linux
# - Creates no backups; uses a temp file then move (atomic)

set -euo pipefail

DRY_RUN=0
REGIONS=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=1; shift ;;
    --region|--regions)
      REGIONS="${2:-}"
      if [[ -z "$REGIONS" ]]; then
        echo "Error: --region requires a value (e.g., iad1,sfo1)"; exit 1
      fi
      shift 2
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# Glob both .ts and .tsx
shopt -s nullglob
FILES=(api/functions/*.ts api/functions/*.tsx)
shopt -u nullglob

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No files found under api/functions/*.ts{,x} — nothing to do."
  exit 0
fi

echo "Scanning ${#FILES[@]} function files under api/functions …"

ADDED=0
SKIPPED=0

for f in "${FILES[@]}"; do
  # Skip non-regular files
  [[ -f "$f" ]] || continue

  if grep -Eq "export\s+const\s+runtime\s*=\s*['\"]edge['\"]\s*;" "$f"; then
    echo "✓ $f already declares runtime='edge' (skipping)"
    ((SKIPPED++))
    continue
  fi

  echo "→ Adding runtime='edge' to $f"
  ((ADDED++))

  if [[ $DRY_RUN -eq 1 ]]; then
    continue
  fi

  tmp="${f}.tmp.$$"
  {
    echo "export const runtime = 'edge';"
    if [[ -n "$REGIONS" ]]; then
      # Emit array like: ['iad1','sfo1']
      IFS=',' read -r -a ARR <<< "$REGIONS"
      printf "export const preferredRegion = ["
      for i in "${!ARR[@]}"; do
        [[ $i -gt 0 ]] && printf ","
        printf "'%s'" "${ARR[$i]}"
      done
      echo "];"
    fi
    cat "$f"
  } > "$tmp"
  mv "$tmp" "$f"
done

echo
echo "Done. Added to: $ADDED file(s), skipped: $SKIPPED."
[[ $DRY_RUN -eq 1 ]] && echo "(dry run — no files were modified)"

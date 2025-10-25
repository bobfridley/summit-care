#!/usr/bin/env bash
set -euo pipefail

# rename-jsx-to-tsx.sh
# - Renames all *.jsx files to *.tsx (recursively)
# - Skips if the .tsx already exists
# - Supports --preview (dry run)
# - Uses git mv when in a Git repo to preserve history

preview=0
use_git=0

# Parse args
for arg in "$@"; do
  case "$arg" in
    -n|--preview|--dry-run) preview=1 ;;
    --no-git) use_git=0 ;;
    --git) use_git=1 ;;
    -h|--help)
      cat <<'USAGE'
Usage:
  ./scripts/rename-jsx-to-tsx.sh [--preview] [--git|--no-git]

Options:
  --preview, -n   Show what would be renamed, but do not change files
  --git           Force using git mv (if in a Git repo)
  --no-git        Force not using git mv
  --help, -h      Show this help
USAGE
      exit 0
      ;;
  esac
done

# Auto-detect git if not explicitly set
if [[ $use_git -eq 0 && -d .git ]]; then
  if command -v git >/dev/null 2>&1; then
    use_git=1
  fi
fi

count_total=0
count_renamed=0
count_skipped=0

# Use find to locate all .jsx files (case-sensitive)
while IFS= read -r -d '' f; do
  ((count_total++))
  tsx="${f%.jsx}.tsx"

  if [[ -e "$tsx" ]]; then
    echo "(skip) $tsx already exists"
    ((count_skipped++))
    continue
  fi

  if [[ $preview -eq 1 ]]; then
    echo "$f -> $tsx"
  else
    if [[ $use_git -eq 1 ]]; then
      git mv "$f" "$tsx"
    else
      mv "$f" "$tsx"
    fi
    echo "Renamed: $f -> $tsx"
    ((count_renamed++))
  fi
done < <(find . -type f -name "*.jsx" -print0)

echo "----"
echo "Total .jsx found: $count_total"
echo "Renamed: $count_renamed"
echo "Skipped (already exists): $count_skipped"
if [[ $preview -eq 1 ]]; then
  echo "Mode: preview (no changes made)"
fi

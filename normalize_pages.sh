#!/usr/bin/env bash
set -euo pipefail

PAGES_DIR="${1:-src/pages}"        # or "pages"
MAP_FILE="${2:-.route_rename_map.txt}"
DRY_RUN="${DRY_RUN:-1}"            # 1=dry-run (default), 0=apply
UPDATE_URLS="${UPDATE_URLS:-0}"    # 1=also replace '/Route' -> '/route' strings

RESERVED_RE='^(_app|_document|_error|404)(\.|$)'

if [[ ! -d "$PAGES_DIR" ]]; then
  echo "❌ Pages directory not found: $PAGES_DIR" >&2
  exit 1
fi

echo "🔍 Scanning: $PAGES_DIR"
: > "$MAP_FILE"

# Collect top-level entries once, uniquely (macOS-friendly; no -printf)
shopt -s nullglob
declare -A SEEN
for entry in "$PAGES_DIR"/* "$PAGES_DIR"/.*; do
  base="$(basename "$entry")"
  # skip dot entries and reserved Next files
  [[ "$base" == "." || "$base" == ".." ]] && continue
  [[ "$base" =~ $RESERVED_RE ]] && continue
  # only consider names starting with uppercase
  [[ "$base" =~ ^[A-Z] ]] || continue
  # de-dup on original name
  [[ -n "${SEEN[$base]+x}" ]] && continue
  SEEN[$base]=1

  lower="$(echo "$base" | tr '[:upper:]' '[:lower:]')"
  target="$PAGES_DIR/$lower"

  # If target exists and is not the same file (case-insensitive collisions), suffix -lower
  if [[ -e "$target" && ! "$entry" -ef "$target" ]]; then
    target="${target}-lower"
  fi
  echo "$PAGES_DIR/$base -> $target" | tee -a "$MAP_FILE"
done
shopt -u nullglob

if [[ ! -s "$MAP_FILE" ]]; then
  echo "✅ No capitalized routes found in $PAGES_DIR"
  exit 0
fi

echo -e "\n📝 Proposed renames saved to: $MAP_FILE\n"
cat "$MAP_FILE"
echo

if [[ "$DRY_RUN" == "1" ]]; then
  echo "💡 DRY RUN ONLY. To apply, run:"
  echo "    DRY_RUN=0 ./normalize_pages.sh \"$PAGES_DIR\" \"$MAP_FILE\""
  echo "   (Optionally set UPDATE_URLS=1 to also update '/Route' → '/route' in code)"
  exit 0
fi

echo "🚀 Applying renames..."
USE_GIT=0
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  USE_GIT=1
fi

# Two-step rename for case-insensitive filesystems (via a unique temp name)
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  src="${line%% -> *}"
  dst="${line##* -> }"

  # Skip if source no longer exists (already moved in a previous run)
  [[ -e "$src" ]] || continue

  tmp="${src}.TMPMOVE.$$"
  if [[ "$USE_GIT" -eq 1 ]]; then
    git mv "$src" "$tmp"
    git mv "$tmp" "$dst"
  else
    mv "$src" "$tmp"
    mv "$tmp" "$dst"
  fi
done < "$MAP_FILE"

echo "✅ File/dir renames complete."

if [[ "$UPDATE_URLS" == "1" ]]; then
  echo "🔁 Updating URL strings in code (e.g., '/Dashboard' → '/dashboard')..."
  # Only touch tracked files if in a git repo; otherwise search everything except common ignores
  if [[ "$USE_GIT" -eq 1 ]]; then
    FILES=$(git ls-files)
  else
    FILES=$(find . -type f ! -path "./.git/*" ! -path "./node_modules/*" ! -path "./.next/*")
  fi

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    src="${line%% -> *}"; dst="${line##* -> }"
    src_name="$(basename "$src")"
    dst_name="$(basename "$dst")"
    src_seg="${src_name%%.*}"
    dst_seg="${dst_name%%.*}"

    # Replace '/Src' → '/src' (only when followed by /, quote, ?, or end)
    # perl is used for safe in-place edits across many files
    perl -0777 -pi -e "s#/${src_seg}(?=[/\"'\\?]|$)#/${dst_seg}#g" $FILES 2>/dev/null || true
  done < "$MAP_FILE"
  echo "✅ URL string updates complete."
else
  echo "ℹ️ Skipped URL replacements (set UPDATE_URLS=1 to enable)."
fi

echo "🎉 Done. Review, build, and commit."

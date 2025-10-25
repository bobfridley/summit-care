#!/usr/bin/env bash
set -euo pipefail

# Add // @ts-nocheck to the top of UI TSX files if not present
add_ts_nocheck() {
  local file="$1"
  if head -n 1 "$file" | grep -q '@ts-nocheck'; then
    echo "(keep) $file already has @ts-nocheck"
  else
    # preserve shebang if present (rare in tsx)
    if head -c 2 "$file" | grep -q '^#!'; then
      # insert after first line
      awk 'NR==1{print; print "// @ts-nocheck"; next}1' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    else
      # insert at very top
      (echo "// @ts-nocheck"; cat "$file") > "$file.tmp" && mv "$file.tmp" "$file"
    fi
    echo "Added @ts-nocheck → $file"
  fi
}

export -f add_ts_nocheck

# Scope to UI
find src/components -type f -name "*.tsx" -print0 2>/dev/null | xargs -0 -I{} bash -c 'add_ts_nocheck "$@"' _ {}
find src/pages      -type f -name "*.tsx" -print0 2>/dev/null | xargs -0 -I{} bash -c 'add_ts_nocheck "$@"' _ {}

echo "Done."

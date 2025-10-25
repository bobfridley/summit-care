#!/usr/bin/env bash
# scripts/add-cors-block.sh
# Adds a standard CORS header block to api/functions/*.{ts,tsx}.
# Prints which files changed and a small diff summary (macOS + Linux compatible).

set -euo pipefail

ALLOW_ORIGIN="*"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --origin)
      ALLOW_ORIGIN="${2:-*}"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

TMPBLOCK="$(mktemp -t corsblock.XXXXXX)"
cat >"$TMPBLOCK" <<EOF
// --- CORS header block (auto-added) ---
const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "${ALLOW_ORIGIN}",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

if (req.method === "OPTIONS") {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
// --- end CORS block ---
EOF

shopt -s nullglob
FILES=(api/functions/*.ts api/functions/*.tsx)
shopt -u nullglob

echo "🚀 Adding CORS block to ${#FILES[@]} function files…"
ADDED=0; SKIPPED=0

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] || continue
  if grep -q "CORS_HEADERS" "$f"; then
    echo "✓ $f already has CORS block"
    ((SKIPPED++))
    continue
  fi

  echo "→ Injecting CORS block into $f"
  ((ADDED++))
  tmp="${f}.tmp.$$"

  # insert block
  if grep -q "export const runtime" "$f"; then
    sed "/export const runtime/ r $TMPBLOCK" "$f" > "$tmp"
  else
    cat "$TMPBLOCK" "$f" > "$tmp"
  fi

  # show summary diff (3 context lines)
  echo "---- diff summary for $f ----"
  diff -U 3 "$f" "$tmp" || true
  echo "-----------------------------"

  mv "$tmp" "$f"
done

rm -f "$TMPBLOCK"
echo
echo "✅ Done. Added: $ADDED, skipped: $SKIPPED."

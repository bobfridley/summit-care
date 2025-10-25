#!/usr/bin/env bash
# scripts/find-duplicate-api-files.sh
# Detect API filename collisions that would break Vercel routing
# Works on macOS (BSD find) and Linux (GNU find)

set -euo pipefail

echo "🔍 Scanning for duplicate API route filenames..."

# Find all potential route files
find api -type f \( \
  -name "*.ts"  -o -name "*.tsx" \
  -o -name "*.js"  -o -name "*.jsx" \
  -o -name "*.mjs" -o -name "*.cjs" \
\) -exec bash -c '
  for f; do
    # Strip extension
    base="${f%.*}"
    printf "%s\n" "$base"
  done
' _ {} + \
| sort | uniq -d | tee /tmp/api-duplicates.txt

if [[ -s /tmp/api-duplicates.txt ]]; then
  echo "⚠️  Duplicate route basenames detected!"
  echo "These files share the same route path and must be deduplicated:"
  echo
  cat /tmp/api-duplicates.txt
  echo
  echo "💡 Fix: remove or rename one of each pair (e.g., .ts vs .tsx)."
  exit 1
else
  echo "✅ No duplicate API route files found."
fi

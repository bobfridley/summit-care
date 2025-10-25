#!/usr/bin/env bash
# scripts/test-api.sh
# Smoke test against Vite proxy (http://localhost:5173)
# Optional: set B44_TOKEN to include Authorization header for authed routes.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173}"

has_auth() { [ -n "${B44_TOKEN:-}" ]; }

curl_status() {
  # usage: curl_status METHOD PATH
  local method="$1" ; shift
  local path="$1"   ; shift
  if has_auth; then
    curl -sS -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${B44_TOKEN}" \
      -X "$method" "${BASE_URL}${path}"
  else
    curl -sS -o /dev/null -w "%{http_code}" \
      -X "$method" "${BASE_URL}${path}"
  fi
}

PASS=0
FAIL=0

hit() {
  local name="$1" method="$2" path="$3" expect="$4" extra="${5:-}"
  local code
  code="$(curl_status "$method" "$path")"
  if [ "$code" = "$expect" ]; then
    printf "✅ %-22s %s %s  → %s\n" "$name" "$method" "$path" "$code"
    PASS=$((PASS+1))
  else
    printf "❌ %-22s %s %s  → %s (expected %s) %s\n" \
      "$name" "$method" "$path" "$code" "$expect" "$extra"
    FAIL=$((FAIL+1))
  fi
}

echo "Running smoke tests against ${BASE_URL}"
echo "(Using auth: $(has_auth && echo yes || echo no))"
echo

# Health (should respond)
hit "health" GET "/api/health" "200"

# backend-health may be 200 (ok) or 502 (degraded)
bh_code="$(curl_status GET "/api/backend-health")"
if [ "$bh_code" = "200" ] || [ "$bh_code" = "502" ]; then
  printf "✅ %-22s %s %s  → %s\n" "backend-health" "GET" "/api/backend-health" "$bh_code"
  PASS=$((PASS+1))
else
  printf "❌ %-22s %s %s  → %s (expected 200 or 502)\n" "backend-health" "GET" "/api/backend-health" "$bh_code"
  FAIL=$((FAIL+1))
fi

# DB endpoints (auth required)
if ! has_auth; then
  hit "meds list (unauth)"   GET "/api/mysql-medications" "401"
  hit "climbs list (unauth)" GET "/api/mysql-climbs"      "401"
else
  hit "meds list (auth)"     GET "/api/mysql-medications?q=statin&limit=5" "200"
  hit "climbs list (auth)"   GET "/api/mysql-climbs?limit=5"               "200"
fi

echo
printf "Summary: %d passed, %d failed\n" "$PASS" "$FAIL"
exit $([ "$FAIL" -eq 0 ] && echo 0 || echo 1)

#!/usr/bin/env sh
set -e

# -----------------------------
#  SummitCare Verified Push Tool
# -----------------------------
# Runs full verification → commit → push
# with CI-style feedback and summary.
# -----------------------------

# ANSI colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

echo "${CYAN}🔍 Running full verification before push...${NC}"

# 1️⃣ Verify format, lint, and types
pnpm run verify

# 2️⃣ Optional: simulate build (uncomment if you want)
# echo "${YELLOW}🏗  Simulating Vercel build...${NC}"
# pnpm run vercel:build

echo ""
echo "${GREEN}✅ All checks passed!${NC}"

# 3️⃣ Capture current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 4️⃣ Prompt for commit message
echo ""
read -p "📝 Enter your commit message: " msg

# 5️⃣ Stage all changes
git add -A

# 6️⃣ Commit and push
git commit -m "$msg" >/dev/null 2>&1 || echo "${YELLOW}⚠️  Nothing to commit.${NC}"
git push -u origin "$BRANCH"

# 7️⃣ Show summary
LATEST_COMMIT=$(git log -1 --pretty=format:"%h — %s")
REMOTE_URL=$(git config --get remote.origin.url | sed -E 's/git@github\.com:/https:\/\/github.com\//; s/\.git$//')

echo ""
echo "${GREEN}🚀 Push complete and verified!${NC}"
echo "──────────────────────────────"
echo "🌿 Branch: ${CYAN}${BRANCH}${NC}"
echo "🔖 Commit: ${YELLOW}${LATEST_COMMIT}${NC}"
echo "🔗 Repo: ${CYAN}${REMOTE_URL}/tree/${BRANCH}${NC}"
echo "──────────────────────────────"
echo ""

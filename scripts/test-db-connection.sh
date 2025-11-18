#!/usr/bin/env bash

# scripts/test-db-connection.sh
# Quick sanity check that server/.env + MySQL are wired correctly.

set -euo pipefail

ROOT_DIR="/opt/summitcare"
SERVER_ENV="$ROOT_DIR/server/.env"

if [[ ! -f "$SERVER_ENV" ]]; then
  echo "❌ server/.env not found at $SERVER_ENV"
  exit 1
fi

echo "🔧 Loading env from $SERVER_ENV"
# shellcheck disable=SC2046
export $(grep -vE '^(#|$)' "$SERVER_ENV" | xargs -d '\n')

# Check required variables
REQUIRED_VARS=(MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE)
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Missing required env var: $var"
    exit 1
  fi
done

echo "🔎 Testing connection to MySQL..."
echo "    Host: $MYSQL_HOST"
echo "    Port: $MYSQL_PORT"
echo "    User: $MYSQL_USER"
echo "    DB:   $MYSQL_DATABASE"

mysql_cmd=(
  mysql
  -h "$MYSQL_HOST"
  -P "$MYSQL_PORT"
  -u "$MYSQL_USER"
  "-p$MYSQL_PASSWORD"
  -D "$MYSQL_DATABASE"
  -e "SELECT DATABASE() AS current_db; SHOW TABLES;"
)

if "${mysql_cmd[@]}"; then
  echo "✅ MySQL connection OK and tables listed successfully."
else
  echo "❌ MySQL connection failed."
  exit 1
fi

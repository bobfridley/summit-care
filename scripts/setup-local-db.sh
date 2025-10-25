#!/usr/bin/env bash
# scripts/setup-local-db.sh
# macOS-friendly local DB bootstrap (MariaDB/MySQL)
# - Ensures service is running (Homebrew)
# - Creates `summitcare` DB if missing
# - Imports schema, optionally sample data

set -euo pipefail

# -------- config --------
DB_NAME="${DB_NAME:-summitcare}"
DB_HOST="${MYSQL_HOST:-127.0.0.1}"
DB_PORT="${MYSQL_PORT:-3306}"
DB_USER="${MYSQL_USER:-root}"
DB_PASS="${MYSQL_PASSWORD:-}"
SCHEMA_FILE_DEFAULT="schema/summitcare.sql"
SAMPLE_FILE_DEFAULT="schema/summitcare_sample_data.sql"

SCHEMA_FILE="${SCHEMA_FILE:-$SCHEMA_FILE_DEFAULT}"
SAMPLE_FILE="${SAMPLE_FILE:-$SAMPLE_FILE_DEFAULT}"
IMPORT_SAMPLE="${IMPORT_SAMPLE:-true}"    # set to false to skip sample data

# -------- helpers --------
say() { printf "➜ %s\n" "$*"; }
ok()  { printf "✅ %s\n" "$*"; }
warn(){ printf "⚠️  %s\n" "$*"; }
die() { printf "❌ %s\n" "$*" >&2; exit 1; }

ask_password_if_missing() {
  if [[ -z "$DB_PASS" ]]; then
    read -r -s -p "Enter local DB password for user '$DB_USER' (press Enter if none): " DB_PASS
    echo
  fi
}

mysql_cmd() {
  # Prefer `mysql` if available (MariaDB installs it too)
  if command -v mysql >/dev/null 2>&1; then
    echo "mysql"
    return 0
  fi
  die "Could not find the 'mysql' client in PATH. Install MariaDB or MySQL via Homebrew."
}

ensure_service_running() {
  # Try MariaDB first (matches your VPS); fall back to MySQL if you installed that
  if command -v brew >/dev/null 2>&1; then
    # If either service is installed but not running, start it
    if brew list --formula 2>/dev/null | grep -q "^mariadb$"; then
      if ! brew services list | grep -E "^mariadb\s+started" >/dev/null 2>&1; then
        say "Starting MariaDB via Homebrew…"
        brew services start mariadb >/dev/null
        sleep 1
      fi
      return 0
    fi

    if brew list --formula 2>/dev/null | grep -q "^mysql$"; then
      if ! brew services list | grep -E "^mysql\s+started" >/dev/null 2>&1; then
        say "Starting MySQL via Homebrew…"
        brew services start mysql >/dev/null
        sleep 1
      fi
      return 0
    fi

    warn "Neither 'mariadb' nor 'mysql' is installed via Homebrew."
    warn "You can install one with:  brew install mariadb   (recommended)  or  brew install mysql"
  else
    warn "Homebrew not found; assuming DB is already running."
  fi
}

db_exec() {
  local sql="$1"
  local mysql_bin
  mysql_bin="$(mysql_cmd)"

  # Build args. Use --password=… only if we actually have one.
  if [[ -n "$DB_PASS" ]]; then
    "$mysql_bin" \
      --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" --password="$DB_PASS" \
      --protocol=TCP \
      -e "$sql"
  else
    "$mysql_bin" \
      --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" \
      --protocol=TCP \
      -e "$sql"
  fi
}

db_import() {
  local db="$1"
  local file="$2"
  [[ -f "$file" ]] || die "File not found: $file"
  local mysql_bin
  mysql_bin="$(mysql_cmd)"

  say "Importing $(basename "$file") into '$db'…"
  if [[ -n "$DB_PASS" ]]; then
    "$mysql_bin" \
      --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" --password="$DB_PASS" \
      --protocol=TCP \
      "$db" < "$file"
  else
    "$mysql_bin" \
      --host="$DB_HOST" --port="$DB_PORT" \
      --user="$DB_USER" \
      --protocol=TCP \
      "$db" < "$file"
  fi
  ok "Imported $(basename "$file")"
}

db_exists() {
  local name="$1"
  local out
  set +e
  out="$(db_exec "SHOW DATABASES LIKE '${name//\'/\'\'}';" 2>/dev/null | tail -n +2 || true)"
  set -e
  [[ "$out" == "$name" ]]
}

create_db_if_missing() {
  if db_exists "$DB_NAME"; then
    ok "Database '$DB_NAME' already exists."
  else
    say "Creating database '$DB_NAME'…"
    db_exec "CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    ok "Created database '$DB_NAME'."
  fi
}

# -------- run --------
say "Local DB setup for '${DB_NAME}' @ ${DB_HOST}:${DB_PORT}"

ensure_service_running
ask_password_if_missing
create_db_if_missing

if [[ -f "$SCHEMA_FILE" ]]; then
  db_import "$DB_NAME" "$SCHEMA_FILE"
else
  warn "Schema file not found at '$SCHEMA_FILE'. Skipping schema import."
fi

if [[ "${IMPORT_SAMPLE,,}" == "true" ]]; then
  if [[ -f "$SAMPLE_FILE" ]]; then
    db_import "$DB_NAME" "$SAMPLE_FILE"
  else
    warn "Sample data file not found at '$SAMPLE_FILE'. Skipping sample import."
  fi
else
  say "Skipping sample data import (IMPORT_SAMPLE=false)."
fi

ok "Local DB is ready."

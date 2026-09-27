#!/usr/bin/env bash
#
# One-time Turso setup for the booking database.
#
# Turso is hosted SQLite reached over HTTP. It is the free, reliable backend the
# booking system needs on Vercel (whose filesystem is read-only, so a local
# SQLite file cannot survive there). The free tier is far more than one clinic
# will ever use.
#
# This script creates the database and an auth token, then prints the two
# environment variables to paste into Vercel. It changes nothing else and stores
# no secrets on disk.
#
# Run it once:   bash scripts/setup-turso.sh
#
set -euo pipefail

DB_NAME="${1:-ajay-pundir-clinic}"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }

echo
bold "Turso setup for the clinic booking database"
echo

# 1. CLI present? ---------------------------------------------------------------
if ! command -v turso >/dev/null 2>&1; then
  yellow "The Turso CLI is not installed."
  echo "Install it (macOS/Linux):"
  echo "    curl -sSfL https://get.tur.so/install.sh | bash"
  echo "then open a new terminal and run this script again."
  exit 1
fi

# 2. Logged in? -----------------------------------------------------------------
if ! turso auth whoami >/dev/null 2>&1; then
  yellow "You are not logged in to Turso."
  echo "Run:"
  echo "    turso auth login"
  echo "(it opens the browser — the free plan needs no card) then re-run this script."
  exit 1
fi
green "Logged in as: $(turso auth whoami)"

# 3. Create the database (idempotent) -------------------------------------------
if turso db show "$DB_NAME" >/dev/null 2>&1; then
  yellow "Database '$DB_NAME' already exists — reusing it."
else
  echo "Creating database '$DB_NAME'…"
  turso db create "$DB_NAME"
  green "Created."
fi

# 4. Fetch URL + a fresh token --------------------------------------------------
URL="$(turso db show "$DB_NAME" --url)"
TOKEN="$(turso db tokens create "$DB_NAME")"

# 5. Print what to paste --------------------------------------------------------
echo
bold "Done. Add these to Vercel → Settings → Environment Variables"
bold "(and to .env.local for local testing against Turso):"
echo
echo "    TURSO_DATABASE_URL=$URL"
echo "    TURSO_AUTH_TOKEN=$TOKEN"
echo
yellow "Also set a long ADMIN_PASSCODE (min 6 chars) for the /admin counter screen."
echo
echo "The schema is created automatically on first connection — no migration to run."
echo "After deploying, verify with:   npm run verify:booking -- https://your-domain"
echo

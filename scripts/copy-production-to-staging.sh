#!/usr/bin/env bash
# Copy current production Postgres data (public + auth) into the staging project.
# Run only after FireFly Staging exists and supabase/projects.json has "staging".
#
# Usage:
#   STAGING_DB_URL='postgresql://postgres:<pass>@db.<staging-ref>.supabase.co:5432/postgres' \
#     ./scripts/copy-production-to-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGING_REF="$(node -e 'const p=require("./supabase/projects.json"); if(!p.staging){process.exit(2)}; process.stdout.write(p.staging)' )"
PROD_REF="llpwwvlvxdqpbcrvwvgs"
DUMP_DIR="$(mktemp -d /tmp/firefly-prod-dump.XXXXXX)"

if [[ -z "${STAGING_DB_URL:-}" ]]; then
  echo "Set STAGING_DB_URL to the staging Postgres URI (direct, port 5432)."
  exit 1
fi

echo "Dumping production public + auth data from $PROD_REF …"
supabase db dump --linked --data-only --use-copy --schema public -f "$DUMP_DIR/public.sql"
supabase db dump --linked --data-only --use-copy --schema auth -f "$DUMP_DIR/auth.sql"

echo "Restoring into staging $STAGING_REF …"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -c "TRUNCATE auth.users CASCADE;" || true
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f "$DUMP_DIR/auth.sql"
psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f "$DUMP_DIR/public.sql"

echo "Copying storage objects via a local temp dir …"
STORAGE_DIR="$DUMP_DIR/storage"
mkdir -p "$STORAGE_DIR"
supabase storage ls --linked -r ss:///event-images || true
supabase storage cp -r --linked ss:///event-images "$STORAGE_DIR/event-images" || true
supabase storage cp -r --linked ss:///feed-media "$STORAGE_DIR/feed-media" || true

supabase link --project-ref "$STAGING_REF" --yes
if [[ -d "$STORAGE_DIR/event-images" ]]; then
  supabase storage cp -r --linked "$STORAGE_DIR/event-images" ss:///event-images || true
fi
if [[ -d "$STORAGE_DIR/feed-media" ]]; then
  supabase storage cp -r --linked "$STORAGE_DIR/feed-media" ss:///feed-media || true
fi

supabase link --project-ref "$PROD_REF" --yes
echo "Copy complete. Relinked CLI to production ($PROD_REF)."
echo "Dump kept at $DUMP_DIR (delete when you are done verifying staging)."

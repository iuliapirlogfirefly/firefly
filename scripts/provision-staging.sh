#!/usr/bin/env bash
# Create the FireFly Staging Supabase project if it does not already exist.
# Staging was created in the JanosPuzzles org as vidjqydhflwemhmygoen.
# Usage: ./scripts/provision-staging.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASSWORD_FILE="${PASSWORD_FILE:-/tmp/firefly-staging/db-password}"
mkdir -p "$(dirname "$PASSWORD_FILE")"
if [[ ! -s "$PASSWORD_FILE" ]]; then
  openssl rand -hex 20 > "$PASSWORD_FILE"
  chmod 600 "$PASSWORD_FILE"
fi
DB_PASSWORD="$(cat "$PASSWORD_FILE")"

echo "Creating FireFly Staging in org zpstcaxiuicjkqqmjjwc (eu-west-1)…"
JSON="$(supabase projects create "FireFly Staging" \
  --org-id zpstcaxiuicjkqqmjjwc \
  --region eu-west-1 \
  --db-password "$DB_PASSWORD" \
  --output json)"

REF="$(node -e 'const j=JSON.parse(process.argv[1]); process.stdout.write(j.ref || j.id || "")' "$JSON")"
if [[ -z "$REF" ]]; then
  echo "Could not parse project ref from:"
  echo "$JSON"
  exit 1
fi

node -e '
const fs = require("fs");
const p = JSON.parse(fs.readFileSync("supabase/projects.json","utf8"));
p.staging = process.argv[1];
fs.writeFileSync("supabase/projects.json", JSON.stringify(p, null, 2) + "\n");
' "$REF"

echo "Waiting for project $REF to become healthy…"
for i in $(seq 1 36); do
  STATUS="$(supabase projects list --output json | node -e '
    const ref=process.argv[1];
    const rows=JSON.parse(require("fs").readFileSync(0,"utf8"));
    const p=rows.find(r => r.ref===ref);
    process.stdout.write(p ? p.status : "UNKNOWN");
  ' "$REF")"
  echo "  status: $STATUS"
  if [[ "$STATUS" == "ACTIVE_HEALTHY" ]]; then
    break
  fi
  sleep 10
done

KEYS="$(supabase projects api-keys --project-ref "$REF" --output json)"
node -e '
const fs = require("fs");
const ref = process.argv[1];
const keys = JSON.parse(process.argv[2]);
const pick = (name) => {
  const row = keys.find(k => (k.name || k.api_key_name || "").toLowerCase() === name || (k.id || "") === name);
  return row?.api_key || row?.key || row?.secret || "";
};
const anon = pick("anon") || pick("publishable");
const service = pick("service_role") || pick("secret");
const lines = [
  `NEXT_PUBLIC_SUPABASE_URL=https://${ref}.supabase.co`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}`,
  `SUPABASE_SERVICE_ROLE_KEY=${service}`,
  `NEXT_PUBLIC_APP_URL=https://firefly-git-develop-fireflydev.vercel.app`,
  `NEXT_PUBLIC_USE_MOCK_DATA=false`,
].join("\n") + "\n";
fs.writeFileSync(".env.staging.local", lines);
console.log("Wrote .env.staging.local");
' "$REF" "$KEYS"

supabase link --project-ref "$REF" --password "$DB_PASSWORD" --yes
supabase db push --linked --yes

echo "Next:"
echo "  1. Configure Auth site URL to https://firefly-git-develop-fireflydev.vercel.app"
echo "  2. STAGING_DB_URL=... ./scripts/copy-production-to-staging.sh"
echo "  3. npm run db:link:prod"
echo "  4. Point Vercel Preview env at the keys in .env.staging.local"

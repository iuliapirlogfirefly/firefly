#!/usr/bin/env node
/**
 * Copy production app data into the staging project using the Management API
 * (no Docker/pg_dump). Auth password hashes are preserved via SQL.
 *
 * Requires production keys (.env.production.local or .env.local)
 * and staging keys (.env.staging.local).
 */
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
} from "./load-env.mjs";

function parseEnvFile(filename) {
  const env = {};
  const path = resolve(filename);
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

function queryLinked(sql) {
  const result = spawnSync(
    "supabase",
    ["db", "query", "--linked", "--output", "json", sql],
    { encoding: "utf8" }
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  const parsed = JSON.parse(result.stdout);
  return parsed.rows ?? parsed;
}

function runLinkedSql(sql) {
  const result = spawnSync(
    "supabase",
    ["db", "query", "--linked", sql],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

function link(ref) {
  const extra =
    ref === STAGING_PROJECT_REF && existsSync("/tmp/firefly-staging/db-password")
      ? ["--password", readFileSync("/tmp/firefly-staging/db-password", "utf8").trim()]
      : [];
  const result = spawnSync(
    "supabase",
    ["link", "--project-ref", ref, "--yes", ...extra],
    { stdio: "inherit" }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === "object") {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertStatement(table, rows, columns) {
  if (!rows.length) return "";
  const values = rows.map((row) => {
    const cells = columns.map((col) => sqlLiteral(row[col]));
    return `(${cells.join(", ")})`;
  });
  const colList = columns.map((c) => `"${c}"`).join(", ");
  return `INSERT INTO ${table} (${colList}) VALUES\n${values.join(",\n")};`;
}

const PUBLIC_TABLES = [
  "site_settings",
  "profiles",
  "business_accounts",
  "venues",
  "events",
  "feed_posts",
  "promotions",
  "subscriptions",
  "payments",
  "event_saves",
  "event_reminders",
  "event_duplicate_dismissals",
  "nearby_event_notifications",
  "contact_messages",
  "analytics_events",
  "stripe_webhook_events",
];

async function copyStorage(prod, staging, bucket) {
  async function walk(prefix) {
    const { data, error } = await prod.storage.from(bucket).list(prefix || "", {
      limit: 1000,
    });
    if (error) {
      console.warn(`  list ${bucket}/${prefix}: ${error.message}`);
      return;
    }
    for (const item of data ?? []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        await walk(path);
        continue;
      }
      const { data: file, error: dlError } = await prod.storage
        .from(bucket)
        .download(path);
      if (dlError) {
        console.warn(`  download ${bucket}/${path}: ${dlError.message}`);
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upError } = await staging.storage
        .from(bucket)
        .upload(path, buffer, { upsert: true, contentType: file.type });
      if (upError) {
        console.warn(`  upload ${bucket}/${path}: ${upError.message}`);
      } else {
        console.log(`  copied ${bucket}/${path}`);
      }
    }
  }
  await walk("");
}

async function main() {
  if (!STAGING_PROJECT_REF) {
    console.error("supabase/projects.json is missing staging ref");
    process.exit(1);
  }

  const prodEnvFile = existsSync(resolve(".env.production.local"))
    ? ".env.production.local"
    : ".env.local";
  const prodEnv = parseEnvFile(prodEnvFile);
  const stagingEnv = parseEnvFile(".env.staging.local");
  if (!prodEnv.NEXT_PUBLIC_SUPABASE_URL?.includes(PRODUCTION_PROJECT_REF)) {
    console.error(`${prodEnvFile} is not the production project`);
    process.exit(1);
  }
  if (!stagingEnv.NEXT_PUBLIC_SUPABASE_URL?.includes(STAGING_PROJECT_REF)) {
    console.error(".env.staging.local is not the staging project");
    process.exit(1);
  }

  const prod = createClient(
    prodEnv.NEXT_PUBLIC_SUPABASE_URL,
    prodEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const staging = createClient(
    stagingEnv.NEXT_PUBLIC_SUPABASE_URL,
    stagingEnv.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log("1/4 · Exporting Auth users from production…");
  link(PRODUCTION_PROJECT_REF);
  const authUsers = queryLinked(`
    select id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
           invited_at, confirmation_token, confirmation_sent_at,
           recovery_token, recovery_sent_at, email_change_token_new,
           email_change, email_change_sent_at, last_sign_in_at,
           raw_app_meta_data, raw_user_meta_data, is_super_admin,
           created_at, updated_at, phone, phone_confirmed_at,
           phone_change, phone_change_token, phone_change_sent_at,
           email_change_token_current, email_change_confirm_status,
           banned_until, reauthentication_token, reauthentication_sent_at,
           is_sso_user, deleted_at, is_anonymous
    from auth.users
  `);
  const identities = queryLinked(`
    select id, user_id, identity_data, provider, last_sign_in_at,
           created_at, updated_at, provider_id
    from auth.identities
  `);
  console.log(`  ${authUsers.length} users, ${identities.length} identities`);

  console.log("2/4 · Inserting Auth into staging…");
  link(STAGING_PROJECT_REF);
  runLinkedSql("delete from auth.identities; delete from auth.users;");

  if (authUsers.length) {
    const cols = Object.keys(authUsers[0]);
    runLinkedSql(insertStatement("auth.users", authUsers, cols));
  }
  if (identities.length) {
    const idCols = Object.keys(identities[0]);
    runLinkedSql(insertStatement("auth.identities", identities, idCols));
  }

  console.log("3/4 · Copying public tables…");
  for (const table of PUBLIC_TABLES) {
    const { data, error } = await prod.from(table).select("*");
    if (error) {
      console.warn(`  skip ${table}: ${error.message}`);
      continue;
    }
    if (!data?.length) {
      console.log(`  ${table}: 0 rows`);
      continue;
    }
    if (table === "site_settings") {
      const row = data[0];
      const { error: upError } = await staging
        .from(table)
        .upsert(row, { onConflict: "id" });
      if (upError) console.warn(`  ${table}: ${upError.message}`);
      else console.log(`  ${table}: upserted`);
      continue;
    }
    if (table === "profiles") {
      const { error: upError } = await staging
        .from(table)
        .upsert(data, { onConflict: "id" });
      if (upError) console.warn(`  ${table}: ${upError.message}`);
      else console.log(`  ${table}: ${data.length} upserted`);
      continue;
    }
    const payload =
      table === "events"
        ? data.map(({ location, search_vector, ...rest }) => rest)
        : data;
    const { error: insError } = await staging.from(table).insert(payload);
    if (insError) {
      console.warn(`  ${table}: ${insError.message}`);
    } else {
      console.log(`  ${table}: ${data.length} rows`);
    }
  }

  console.log("4/4 · Copying storage objects…");
  for (const bucket of ["event-images", "feed-media"]) {
    await copyStorage(prod, staging, bucket);
  }

  link(PRODUCTION_PROJECT_REF);
  console.log("Copy complete. CLI relinked to production.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

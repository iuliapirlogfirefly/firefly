#!/usr/bin/env node
/**
 * Destructive wipe of application data, Auth users, and Storage objects.
 * Keeps schema and storage buckets. Restores the site_settings singleton.
 *
 * Required:
 *   CONFIRM_PRODUCTION_WIPE=llpwwvlvxdqpbcrvwvgs
 *
 * Only runs against the production project.
 */
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";
import {
  PRODUCTION_PROJECT_REF,
  isProductionSupabaseUrl,
  loadScriptEnv,
  requireSupabaseKeys,
} from "./load-env.mjs";

loadScriptEnv();

const { url, serviceKey } = requireSupabaseKeys();

if (!isProductionSupabaseUrl(url)) {
  console.error("This wipe script only targets production. URL was:", url);
  process.exit(1);
}

if (process.env.CONFIRM_PRODUCTION_WIPE !== PRODUCTION_PROJECT_REF) {
  console.error(
    "Refusing to wipe. Set CONFIRM_PRODUCTION_WIPE=llpwwvlvxdqpbcrvwvgs"
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function emptyBucket(bucket) {
  async function walk(prefix) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix || "", { limit: 1000 });
    if (error) {
      console.warn(`Storage list ${bucket}/${prefix}:`, error.message);
      return;
    }
    if (!data?.length) return;
    const files = [];
    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        await walk(path);
      } else {
        files.push(path);
      }
    }
    if (files.length) {
      const { error: removeError } = await admin.storage.from(bucket).remove(files);
      if (removeError) {
        console.warn(`Storage remove ${bucket}:`, removeError.message);
      } else {
        console.log(`  removed ${files.length} object(s) from ${bucket}`);
      }
    }
  }

  await walk("");
}

function runSql() {
  const result = spawnSync(
    "supabase",
    ["db", "query", "--linked", "--file", "scripts/wipe-production.sql"],
    { stdio: "inherit" }
  );
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function main() {
  console.log("Wiping production storage…");
  for (const bucket of ["event-images", "feed-media"]) {
    await emptyBucket(bucket);
  }

  console.log("Truncating production tables and Auth users…");
  runSql();
  console.log("Production wipe complete. Schema and buckets remain.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

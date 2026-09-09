#!/usr/bin/env node
/**
 * Push migrations to production or staging.
 * Usage: node scripts/supabase-push.mjs production|staging
 *
 * Staging requires supabase/projects.json "staging" to be set (the new project ref).
 */
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const target = process.argv[2];
if (target !== "production" && target !== "staging") {
  console.error("Usage: node scripts/supabase-push.mjs production|staging");
  process.exit(1);
}

const projects = JSON.parse(
  readFileSync(resolve("supabase/projects.json"), "utf8")
);
const ref = projects[target];
if (!ref) {
  console.error(
    `No ${target} project ref in supabase/projects.json.`,
    target === "staging"
      ? "Create the FireFly Staging project, then set the staging ref."
      : ""
  );
  process.exit(1);
}

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("supabase", ["link", "--project-ref", ref, "--yes"]);
run("supabase", ["db", "push", "--linked", "--yes"]);

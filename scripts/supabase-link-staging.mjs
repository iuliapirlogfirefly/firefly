#!/usr/bin/env node
import { readFileSync } from "fs";
import { spawnSync } from "child_process";
import { resolve } from "path";

const projects = JSON.parse(
  readFileSync(resolve("supabase/projects.json"), "utf8")
);
if (!projects.staging) {
  console.error(
    "No staging project ref in supabase/projects.json.",
    "Create FireFly Staging, then set { \"staging\": \"<project-ref>\" }."
  );
  process.exit(1);
}

const result = spawnSync(
  "supabase",
  ["link", "--project-ref", projects.staging, "--yes"],
  { stdio: "inherit" }
);
process.exit(result.status ?? 1);

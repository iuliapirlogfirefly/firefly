import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projects = JSON.parse(
  readFileSync(resolve("supabase/projects.json"), "utf8")
);

export const PRODUCTION_PROJECT_REF = projects.production;
export const STAGING_PROJECT_REF = projects.staging;

export function loadEnvFile(filename) {
  const path = resolve(process.cwd(), filename);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

export function loadScriptEnv() {
  loadEnvFile(".env.staging.local");
  loadEnvFile(".env.local");
  loadEnvFile(".env.vercel");
}

export function isProductionSupabaseUrl(url) {
  return typeof url === "string" && url.includes(`${PRODUCTION_PROJECT_REF}.supabase.co`);
}

export function requireSupabaseKeys() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.staging.local / .env.local / .env.vercel"
    );
    process.exit(1);
  }
  return { url, serviceKey };
}

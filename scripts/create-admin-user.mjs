/**
 * Create (or promote) a Firefly admin user in Supabase.
 *
 * Usage:
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='your-password' npm run db:create-admin
 *
 * Loads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local or .env.vercel.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filename) {
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

loadEnvFile(".env.local");
loadEnvFile(".env.vercel");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL ?? "admin@firefly.app";
const password = process.env.ADMIN_PASSWORD ?? "FireflyAdmin2026!";
const displayName = process.env.ADMIN_NAME ?? "Firefly Admin";

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local / .env.vercel"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: listData } = await supabase.auth.admin.listUsers();
  const existing = listData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId;

  if (existing) {
    userId = existing.id;
    console.log(`User already exists: ${email} (${userId})`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (error) {
      console.error("Failed to create user:", error.message);
      process.exit(1);
    }

    userId = data.user.id;
    console.log(`Created user: ${email} (${userId})`);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ role: "admin", display_name: displayName })
    .eq("id", userId);

  if (profileError) {
    console.error("Failed to set admin role:", profileError.message);
    process.exit(1);
  }

  console.log("\nAdmin user ready.");
  console.log(`  Email:    ${email}`);
  if (!existing) console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);
  console.log("\nSign in at /en/login then open /en/admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

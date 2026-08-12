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

async function findUserIdByEmail(targetEmail) {
  // Prefer generateLink over listUsers — listUsers is paginated and can miss
  // users; recovery link lookup returns the existing user id without sending mail.
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: targetEmail,
  });
  if (error) return null;
  return data?.user?.id ?? null;
}

async function main() {
  let userId = await findUserIdByEmail(email);
  let created = false;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });

    if (error) {
      if (/already.*registered/i.test(error.message)) {
        userId = await findUserIdByEmail(email);
      }
      if (!userId) {
        console.error("Failed to create user:", error.message);
        process.exit(1);
      }
    } else {
      userId = data.user.id;
      created = true;
      console.log(`Created user: ${email} (${userId})`);
    }
  }

  if (!created) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password, email_confirm: true }
    );
    if (updateError) {
      console.error("Failed to reset password:", updateError.message);
      process.exit(1);
    }
    console.log(`User already exists — password reset: ${email} (${userId})`);
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
  console.log(`  Password: ${password}`);
  console.log(`  Role:     admin`);
  console.log(
    "\nSign in at /en/login with account type Person, then open /en/admin"
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

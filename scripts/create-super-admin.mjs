#!/usr/bin/env node
// Promotes an existing account (created through /register) to platform-level
// Super Admin. There is no UI for this in Fase 1 by design — it's a
// one-time bootstrap step run from a trusted machine with the service-role
// key, never exposed through the app itself.
//
// Usage: node scripts/create-super-admin.mjs <email>

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const email = process.argv[2];

if (!email) {
  console.error("Usage: node scripts/create-super-admin.mjs <email>");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment (.env.local)."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to look up profile:", profileError.message);
    process.exit(1);
  }

  if (!profile) {
    console.error(
      `No profile found for ${email}. The account must sign up through /register first.`
    );
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from("platform_admins")
    .upsert({ user_id: profile.id, email: profile.email }, { onConflict: "user_id" });

  if (insertError) {
    console.error("Failed to grant Super Admin:", insertError.message);
    process.exit(1);
  }

  console.log(`${profile.email} (${profile.full_name}) is now a Super Admin.`);
}

main();

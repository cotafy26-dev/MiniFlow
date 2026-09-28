import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

/**
 * Server Component / Server Action / Route Handler client. Reads and
 * writes the session cookie via next/headers, so it always reflects the
 * request's current auth state.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component that can't set cookies
            // (no response to attach them to). Safe to ignore as long as
            // middleware.ts is refreshing the session on every request.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses Row Level Security entirely — never import
 * this from a "use client" file or expose its result to the browser.
 * Reserved for scripts/*.mjs and narrow server-only paths (e.g. the Super
 * Admin panel in a later phase) that must act outside any single tenant's
 * RLS-scoped view.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set — createAdminClient() cannot be used."
    );
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * POST-only, bound to a plain <form action="/auth/signout" method="post">
 * in Topbar — works even if client JS fails to load.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}

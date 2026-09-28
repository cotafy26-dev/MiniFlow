import { NextResponse } from "next/server";

import { sendWelcomeEmailIfNeeded } from "@/core/email/welcome";
import { createClient } from "@/lib/supabase/server";

/**
 * Single handler for both email-confirmation and password-recovery links —
 * both arrive as a PKCE `code` param. `next` decides where to land after
 * the exchange (defaults to /dashboard; forgot-password sends
 * next=/reset-password).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    // Google OAuth hits this same route on every login, not just the
    // first — sendWelcomeEmailIfNeeded is idempotent (profiles.
    // welcome_email_sent_at), so calling it every time is safe. Recovery
    // links (next=/reset-password) never count as "welcome".
    if (next !== "/reset-password" && data.user) {
      try {
        await sendWelcomeEmailIfNeeded(data.user.id);
      } catch (emailError) {
        console.error("sendWelcomeEmailIfNeeded failed", emailError);
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

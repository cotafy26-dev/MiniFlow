import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/apps", "/feed", "/community", "/ranking", "/support"];

// "/reset-password" is deliberately excluded from this list: a user lands
// there via a Supabase password-recovery session (already "authenticated"
// by Supabase's definition), and must still be able to reach the page
// instead of being bounced to /dashboard.
const AUTH_ONLY_WHEN_LOGGED_OUT = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (AUTH_ONLY_WHEN_LOGGED_OUT.includes(pathname) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

// /site/* (hosted mini-apps, served by path — src/app/site/[sitePath]) is
// excluded here, same as _next/static: a site visitor has nothing to do
// with a MedFlow System session and shouldn't pay for the Supabase
// cookie-refresh this proxy does for every other route.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|site/).*)"],
};

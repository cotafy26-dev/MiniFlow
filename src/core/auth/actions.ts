"use server";

import { redirect } from "next/navigation";

import { logActivity } from "@/core/activity-log/log";
import { createClient } from "@/lib/supabase/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface AuthActionResult {
  error?: string;
  needsEmailConfirmation?: boolean;
}

export async function signInWithPasswordAction(
  values: { email: string; password: string },
  redirectTo?: string
): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword(values);
  if (error) return { error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_tenant_id")
    .eq("id", data.user.id)
    .maybeSingle();

  await logActivity({ tenantId: profile?.default_tenant_id ?? null, action: "auth.login" });

  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function signUpWithPasswordAction(values: {
  fullName: string;
  tenantName: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { full_name: values.fullName, tenant_name: values.tenantName },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // With "Confirm email" enabled (Fase 1 default), a fresh signUp returns a
  // user with no active session — the caller must confirm by email before
  // they can sign in. Surface that instead of redirecting.
  if (data.user && !data.session) {
    return { needsEmailConfirmation: true };
  }

  redirect("/dashboard");
}

export async function requestPasswordResetAction(values: {
  email: string;
}): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });

  // Never leak whether the email exists — always report success unless
  // Supabase itself errors (e.g. rate limit).
  if (error) return { error: error.message };
  return {};
}

export async function updatePasswordAction(values: {
  password: string;
}): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password: values.password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signInWithGoogleAction(): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${SITE_URL}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=google_oauth_unavailable");
  }

  redirect(data.url);
}

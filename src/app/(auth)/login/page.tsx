import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { LoginForm } from "@/components/auth/login-form";
import { FieldSeparator } from "@/components/ui/field";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: `${pt.auth.login.title} · ${pt.app.name}` };

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{pt.auth.login.title}</h1>
        <p className="text-sm text-muted-foreground">{pt.auth.login.subtitle}</p>
      </div>

      <Suspense>
        <LoginForm />
      </Suspense>

      <FieldSeparator>{pt.auth.login.orContinueWith}</FieldSeparator>

      <GoogleOAuthButton />

      <p className="text-center text-sm text-muted-foreground">
        {pt.auth.login.noAccount}{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          {pt.auth.login.createAccount}
        </Link>
      </p>
    </div>
  );
}

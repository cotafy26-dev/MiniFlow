import type { Metadata } from "next";
import Link from "next/link";

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { RegisterForm } from "@/components/auth/register-form";
import { FieldSeparator } from "@/components/ui/field";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: `${pt.auth.register.title} · ${pt.app.name}` };

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{pt.auth.register.title}</h1>
        <p className="text-sm text-muted-foreground">{pt.auth.register.subtitle}</p>
      </div>

      <RegisterForm />

      <FieldSeparator>{pt.auth.login.orContinueWith}</FieldSeparator>

      <GoogleOAuthButton />

      <p className="text-center text-sm text-muted-foreground">
        {pt.auth.register.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {pt.auth.register.signIn}
        </Link>
      </p>
    </div>
  );
}

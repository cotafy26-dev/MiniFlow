import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: `${pt.auth.forgotPassword.title} · ${pt.app.name}` };

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{pt.auth.forgotPassword.title}</h1>
        <p className="text-sm text-muted-foreground">{pt.auth.forgotPassword.subtitle}</p>
      </div>

      <ForgotPasswordForm />

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        {pt.auth.forgotPassword.backToLogin}
      </Link>
    </div>
  );
}

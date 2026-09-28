import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: `${pt.auth.resetPassword.title} · ${pt.app.name}` };

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{pt.auth.resetPassword.title}</h1>
        <p className="text-sm text-muted-foreground">{pt.auth.resetPassword.subtitle}</p>
      </div>

      <ResetPasswordForm />
    </div>
  );
}

import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { pt } from "@/lib/i18n/dictionaries/pt";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2">
        <BrandMark size={32} />
        <span className="text-lg font-semibold tracking-tight">{pt.app.name}</span>
      </Link>

      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>

      <p className="max-w-sm text-center text-sm text-muted-foreground">{pt.app.tagline}</p>
    </div>
  );
}

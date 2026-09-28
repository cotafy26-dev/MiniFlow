import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { pt } from "@/lib/i18n/dictionaries/pt";

export default function HomePage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="flex items-center gap-2">
        <BrandMark size={36} />
        <span className="text-xl font-semibold tracking-tight">{pt.app.name}</span>
      </div>

      <p className="max-w-md text-balance text-muted-foreground">{pt.app.tagline}</p>

      <div className="flex gap-3">
        <Button render={<Link href="/register" />}>{pt.auth.register.title}</Button>
        <Button variant="outline" render={<Link href="/login" />}>
          {pt.auth.login.title}
        </Button>
      </div>
    </main>
  );
}

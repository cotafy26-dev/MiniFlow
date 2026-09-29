import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { LeadForm } from "@/components/marketing/lead-form";
import { Badge } from "@/components/ui/badge";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.marketing.plans.title };

export default function PlansSalesPage() {
  const t = pt.marketing.plans;

  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-12 px-6 py-12">
      <div className="flex items-center gap-2">
        <BrandMark size={32} />
        <span className="text-lg font-semibold tracking-tight">{pt.app.name}</span>
      </div>

      <div className="grid gap-10 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">
            {t.badge}
          </Badge>

          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-balance">{t.title}</h1>
            <p className="mt-3 max-w-prose text-muted-foreground text-balance">{t.subtitle}</p>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight">{t.priceLabel}</span>
            <span className="text-muted-foreground">{t.priceSuffix}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t.priceHint}</p>

          <div>
            <h2 className="text-sm font-semibold">{t.featuresTitle}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {t.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <LeadForm />
      </div>
    </main>
  );
}

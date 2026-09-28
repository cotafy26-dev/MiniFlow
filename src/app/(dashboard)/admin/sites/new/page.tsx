import type { Metadata } from "next";

import { SiteForm } from "@/components/admin/site-form";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.sites.newSite };

export default function NewSitePage() {
  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.sites.newSite}</h2>
      <SiteForm mode="create" baseDomain={baseDomain} />
    </div>
  );
}

import type { Metadata } from "next";

import { BannerForm } from "@/components/admin/banner-form";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.banners.newBanner };

export default function NewBannerPage() {
  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{pt.banners.newBanner}</h2>
      <BannerForm mode="create" />
    </div>
  );
}

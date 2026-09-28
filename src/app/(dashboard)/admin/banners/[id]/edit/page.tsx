import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BannerForm } from "@/components/admin/banner-form";
import { getBannerById } from "@/core/banners/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.banners.form.submitEdit };

// timestamptz ("2026-09-27T18:00:00+00:00") -> <input type="datetime-local">
// ("2026-09-27T18:00"), in the browser's local time.
function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default async function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTenantContext();

  const banner = await getBannerById(id);
  if (!banner) notFound();

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <h2 className="text-lg font-semibold">{banner.title}</h2>
      <BannerForm
        mode="edit"
        bannerId={banner.id}
        defaultValues={{
          title: banner.title,
          imageUrl: banner.image_url,
          linkUrl: banner.link_url ?? "",
          isActive: banner.is_active,
          startsAt: toDatetimeLocal(banner.starts_at),
          endsAt: toDatetimeLocal(banner.ends_at),
          sortOrder: banner.sort_order,
        }}
      />
    </div>
  );
}

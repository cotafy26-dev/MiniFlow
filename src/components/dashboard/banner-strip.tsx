import Link from "next/link";

import type { Banner } from "@/core/banners/queries";

function BannerImage({ banner }: { banner: Banner }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={banner.image_url}
      alt={banner.title}
      className="h-32 w-full shrink-0 rounded-xl border object-cover sm:w-80"
    />
  );
}

export function BannerStrip({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return null;

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {banners.map((banner) =>
        banner.link_url ? (
          banner.link_url.startsWith("/") ? (
            <Link key={banner.id} href={banner.link_url} className="shrink-0 sm:w-80">
              <BannerImage banner={banner} />
            </Link>
          ) : (
            <a
              key={banner.id}
              href={banner.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 sm:w-80"
            >
              <BannerImage banner={banner} />
            </a>
          )
        ) : (
          <div key={banner.id} className="shrink-0 sm:w-80">
            <BannerImage banner={banner} />
          </div>
        )
      )}
    </div>
  );
}

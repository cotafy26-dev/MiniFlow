import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MiniAppFilesUploadForm } from "@/components/admin/mini-app-files-upload-form";
import { getMiniAppById, getMiniAppFiles } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export const metadata: Metadata = { title: pt.miniApps.files.title };

export default async function MiniAppFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  const app = await getMiniAppById(ctx.tenant.id, id);
  if (!app || app.type !== "hosted_site") notFound();

  const files = await getMiniAppFiles(ctx.tenant.id, id);
  const baseDomain = process.env.APPS_BASE_DOMAIN || null;

  return (
    <div className="flex max-w-lg flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold">{app.name}</h2>
        <p className="text-sm text-muted-foreground">
          {baseDomain ? `https://${app.subdomain}.${baseDomain}` : pt.miniApps.form.urlPreviewMissingDomain}
        </p>
      </div>
      <MiniAppFilesUploadForm miniAppId={app.id} initialFiles={files} />
    </div>
  );
}

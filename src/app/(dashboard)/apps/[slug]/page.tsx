import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Sparkles } from "lucide-react";

import { AiToolChat } from "@/components/apps/ai-tool-chat";
import { Button } from "@/components/ui/button";
import { getMiniAppBySlug } from "@/core/mini-apps/queries";
import { requireTenantContext } from "@/core/permissions/guards";
import { pt } from "@/lib/i18n/dictionaries/pt";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function MiniAppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireTenantContext();
  if (!ctx.tenant) notFound();

  // notFound() covers both "doesn't exist" and "RLS says you can't see
  // it" through the same path — never leaking which of the two applies.
  const app = await getMiniAppBySlug(ctx.tenant.id, slug);
  if (!app) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-2xl">
          {app.icon || "🧩"}
        </span>
        <div>
          <h1 className="text-xl font-semibold">{app.name}</h1>
          {app.description && <p className="text-sm text-muted-foreground">{app.description}</p>}
        </div>
      </div>

      {app.type === "external_app" && app.url ? (
        <Button render={<Link href={app.url} target="_blank" rel="noopener noreferrer" />} className="w-fit">
          <ExternalLink className="size-4" />
          {pt.apps.detail.openExternalButton}
        </Button>
      ) : app.type === "iframe" && app.url ? (
        <div className="flex flex-col gap-2">
          <iframe
            src={app.url}
            className="h-[70vh] w-full rounded-xl border"
            title={app.name}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            render={<Link href={app.url} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink className="size-4" />
            {pt.apps.detail.openExternalButton}
          </Button>
        </div>
      ) : app.type === "ai_tool" ? (
        <AiToolChat miniAppId={app.id} />
      ) : app.type === "internal_page" && app.content_html ? (
        // Admin-authored HTML, never trusted: rendered via srcDoc inside a
        // fully sandboxed iframe (sandbox="" disables scripts, forms,
        // popups and same-origin access) so it can't touch the viewer's
        // MiniFlow session even if it contains a malicious <script>.
        <iframe
          srcDoc={app.content_html}
          sandbox=""
          className="h-[70vh] w-full rounded-xl border bg-white"
          title={app.name}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-10 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-sm font-medium">{pt.apps.detail.comingSoonTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{pt.apps.detail.comingSoonBody}</p>
          </div>
        </div>
      )}
    </div>
  );
}

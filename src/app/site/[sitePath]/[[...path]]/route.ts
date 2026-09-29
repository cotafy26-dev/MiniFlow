import { createAdminClient, createClient } from "@/lib/supabase/server";

function notFound() {
  return new Response("Não encontrado.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Serves raw files uploaded through /admin/apps/[id]/files for a mini_app
// of type 'hosted_site' — no session, no Next.js page shell — a site
// visitor has nothing to do with a MedFlow System login (this whole path
// is excluded from proxy.ts's auth pipeline). File bytes come straight
// out of the private "mini-app-files" Storage bucket via the service-role
// client, which is safe here since this whole route is server-only and
// never exposes that client to a visitor's browser.
// Sites are reached by path (e.g. "/site/agenda") rather than by
// subdomain, so a page's own relative asset references ("style.css",
// not "/style.css") have nothing to be relative to but "/site/" — one
// level too high. Injecting a <base> tag pins the document's relative-URL
// root back to the site's own path, so an uploaded page authored the
// normal way (relative links, no subdomain assumptions) keeps working.
// It can't fix content that already uses root-absolute paths.
function withBaseTag(html: string, base: string): string {
  const headMatch = /<head[^>]*>/i.exec(html);
  const baseTag = `<base href="${base}">`;
  if (headMatch) {
    const insertAt = headMatch.index + headMatch[0].length;
    return html.slice(0, insertAt) + baseTag + html.slice(insertAt);
  }
  return baseTag + html;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sitePath: string; path?: string[] }> }
) {
  const { sitePath, path } = await params;

  const supabase = await createClient();
  const { data: site } = await supabase
    .rpc("get_hosted_site_by_path", { p_site_path: sitePath })
    .maybeSingle();

  if (!site || !site.is_active) return notFound();

  const filePath = path && path.length > 0 ? path.join("/") : "index.html";

  const admin = createAdminClient();
  const { data: fileRow } = await admin
    .from("mini_app_files")
    .select("storage_path, content_type")
    .eq("mini_app_id", site.id)
    .eq("path", filePath)
    .maybeSingle();

  if (!fileRow) return notFound();

  const { data: blob, error } = await admin.storage.from("mini-app-files").download(fileRow.storage_path);
  if (error || !blob) return notFound();

  if (fileRow.content_type === "text/html") {
    const html = await blob.text();
    return new Response(withBaseTag(html, `/site/${sitePath}/`), {
      headers: { "Content-Type": fileRow.content_type },
    });
  }

  return new Response(blob, { headers: { "Content-Type": fileRow.content_type } });
}

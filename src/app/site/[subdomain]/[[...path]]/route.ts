import { createAdminClient, createClient } from "@/lib/supabase/server";

function notFound() {
  return new Response("Não encontrado.", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// Reached via proxy.ts's subdomain rewrite (or directly). Serves raw
// files uploaded through /admin/apps/[id]/files for a mini_app of type
// 'hosted_site' — no session, no Next.js page shell — a site visitor has
// nothing to do with a MedFlow System login. File bytes come straight out of
// the private "mini-app-files" Storage bucket via the service-role
// client, which is safe here since this whole route is server-only and
// never exposes that client to a visitor's browser.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subdomain: string; path?: string[] }> }
) {
  const { subdomain, path } = await params;

  const supabase = await createClient();
  const { data: site } = await supabase
    .rpc("get_hosted_site_by_subdomain", { p_subdomain: subdomain })
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

  return new Response(blob, { headers: { "Content-Type": fileRow.content_type } });
}

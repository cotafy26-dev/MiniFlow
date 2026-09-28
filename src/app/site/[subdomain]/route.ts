import { createClient } from "@/lib/supabase/server";

// Reached via proxy.ts's subdomain rewrite (or directly). Serves raw,
// unsandboxed HTML — no session, no Next.js page shell — matching the
// "public site" model: a visitor here has nothing to do with a MiniFlow
// login.
export async function GET(_request: Request, { params }: { params: Promise<{ subdomain: string }> }) {
  const { subdomain } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .rpc("get_site_by_subdomain", { p_subdomain: subdomain })
    .maybeSingle();

  if (!data || !data.is_active || !data.html_content) {
    return new Response("Site não encontrado.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(data.html_content, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

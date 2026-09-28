"use server";

import { logActivity } from "@/core/activity-log/log";
import { sendChatMessage, type ChatMessage } from "@/core/ai/chat";
import { requireTenantContext } from "@/core/permissions/guards";
import { createClient } from "@/lib/supabase/server";

export interface AiChatActionResult {
  reply?: string;
  error?: string;
}

export async function sendAiChatMessageAction(
  miniAppId: string,
  history: ChatMessage[],
  message: string
): Promise<AiChatActionResult> {
  const ctx = await requireTenantContext();
  if (!ctx.tenant) return { error: "Você não pertence a nenhum tenant." };

  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 2000) {
    return { error: "Mensagem inválida (1 a 2000 caracteres)." };
  }

  const supabase = await createClient();
  // A null result here means "doesn't exist OR not visible to me" — RLS
  // (can_view_mini_app) already decided that, same reasoning as the
  // notFound() branch in /apps/[slug]/page.tsx.
  const { data: app } = await supabase
    .from("mini_apps")
    .select("type, ai_system_prompt")
    .eq("id", miniAppId)
    .maybeSingle();

  if (!app || app.type !== "ai_tool") {
    return { error: "Ferramenta de IA não encontrada." };
  }

  const result = await sendChatMessage(app.ai_system_prompt, history, trimmed);
  if (result.error) return { error: result.error };

  await logActivity({
    tenantId: ctx.tenant.id,
    action: "ai_tool.message_sent",
    entityType: "mini_app",
    entityId: miniAppId,
  });

  return { reply: result.reply };
}

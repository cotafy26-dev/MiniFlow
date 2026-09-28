import "server-only";

import { GoogleGenAI } from "@google/genai";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatResult {
  reply?: string;
  error?: string;
}

const MODEL = "gemini-3.8-flash";
const MAX_HISTORY_TURNS = 20;

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * history is the conversation so far (oldest first), NOT including
 * userMessage. Trimmed to the last MAX_HISTORY_TURNS entries to bound
 * cost/context size — history is client-held (ephemeral, see the AI
 * mini-app plan), so nothing stops it from growing unbounded otherwise.
 */
export async function sendChatMessage(
  systemPrompt: string | null,
  history: ChatMessage[],
  userMessage: string
): Promise<ChatResult> {
  const ai = getClient();
  if (!ai) return { error: "GEMINI_API_KEY não configurada." };

  const trimmedHistory = history.slice(-MAX_HISTORY_TURNS);
  const contents = [
    ...trimmedHistory.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: systemPrompt ? { systemInstruction: systemPrompt } : undefined,
    });
    const reply = response.text;
    if (!reply) return { error: "O assistente não retornou uma resposta." };
    return { reply };
  } catch {
    return { error: "Não foi possível obter uma resposta do assistente." };
  }
}

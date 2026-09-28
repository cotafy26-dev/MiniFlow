"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendAiChatMessageAction } from "@/core/ai/actions";
import type { ChatMessage } from "@/core/ai/chat";
import { pt } from "@/lib/i18n/dictionaries/pt";
import { cn } from "@/lib/utils";

export function AiToolChat({ miniAppId }: { miniAppId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const text = input.trim();
    if (!text || isSending) return;

    setError(null);
    setIsSending(true);
    const history = messages;
    setMessages([...history, { role: "user", text }]);
    setInput("");

    const result = await sendAiChatMessageAction(miniAppId, history, text);
    setIsSending(false);

    if (result.error || !result.reply) {
      setError(result.error || pt.aiChat.error);
      return;
    }
    setMessages((prev) => [...prev, { role: "model", text: result.reply! }]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-[70vh] flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">{pt.aiChat.empty}</p>}
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}
            >
              {message.text}
            </div>
          </div>
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder={pt.aiChat.placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <Button type="button" onClick={handleSend} disabled={isSending || !input.trim()}>
          {isSending ? pt.aiChat.sending : pt.aiChat.send}
        </Button>
      </div>
    </div>
  );
}

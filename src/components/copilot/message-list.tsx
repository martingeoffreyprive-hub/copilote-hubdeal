"use client";

import { useCopilotContext } from "@/contexts/copilot-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

export function MessageList() {
  const { messages } = useCopilotContext();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="py-4 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-12">
            Démarrez une conversation avec le copilote AI pour vous aider avec votre devis.
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}

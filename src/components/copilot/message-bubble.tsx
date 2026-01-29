"use client";

import { CopilotMessage } from "@/types/copilot";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";

export function MessageBubble({ message }: { message: CopilotMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-2 mb-3", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white rounded-br-md"
            : "bg-white/10 text-white/90 rounded-bl-md"
        )}
      >
        {message.isVoice && <Mic className="inline-block h-3 w-3 mr-1 opacity-50" />}
        {message.content}
      </div>
    </div>
  );
}

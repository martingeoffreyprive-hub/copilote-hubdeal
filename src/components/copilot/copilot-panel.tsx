"use client";

import { useState } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageList } from "./message-list";
import { CopilotSettings } from "./copilot-settings";
import { VoiceVisualizer } from "@/components/voice-visualizer/voice-visualizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Settings, X } from "lucide-react";

export function CopilotPanel() {
  const { addMessage, isConnected } = useCopilotContext();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage("user", input.trim());
    // TODO: Send to OpenAI Realtime API
    addMessage("assistant", "Je suis le copilote AI. La connexion à l'API OpenAI Realtime sera configurée avec votre clé API.");
    setInput("");
  };

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : "bg-white/20"}`} />
          <h2 className="text-sm font-semibold">Copilote AI</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? <X className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
        </Button>
      </div>

      {showSettings ? (
        <CopilotSettings />
      ) : (
        <>
          <MessageList />
          <VoiceVisualizer className="px-4" />
          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-9 w-9 border-white/10 shrink-0">
                <Mic className="h-4 w-4" />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Message au copilote..."
                className="h-9 border-white/10 bg-transparent text-sm"
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}

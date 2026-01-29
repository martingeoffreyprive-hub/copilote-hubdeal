"use client";

import { useState } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageList } from "./message-list";
import { CopilotSettings } from "./copilot-settings";
import { VoiceVisualizer } from "@/components/voice-visualizer/voice-visualizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, Settings, X, Loader2 } from "lucide-react";

export function CopilotPanel() {
  const { messages, settings, addMessage, isConnected } = useCopilotContext();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    if (!settings.apiKey) {
      addMessage("system", "Veuillez d'abord entrer votre clé API OpenAI dans les paramètres (icône engrenage).");
      return;
    }

    addMessage("user", text);
    setInput("");
    setIsLoading(true);

    try {
      const chatMessages = [
        {
          role: "system" as const,
          content: "Tu es un copilote AI pour artisans belges. Tu aides à créer des devis de construction/rénovation. Réponds de manière concise et utile en français. Tu peux suggérer des lignes de devis, des prix, corriger des erreurs.",
        },
        ...messages.filter((m) => m.role !== "system").slice(-20).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: text },
      ];

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-key": settings.apiKey,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: chatMessages,
          max_tokens: 1024,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage("system", data.error?.message || data.error || `Erreur ${res.status}`);
      } else if (data.choices?.[0]?.message?.content) {
        addMessage("assistant", data.choices[0].message.content);
      } else {
        addMessage("system", "Réponse inattendue de l'API.");
      }
    } catch (err) {
      addMessage("system", `Erreur réseau: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GlassCard className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500" : settings.apiKey ? "bg-orange-500" : "bg-white/20"}`} />
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
                placeholder={settings.apiKey ? "Message au copilote..." : "Configurez la clé API..."}
                className="h-9 border-white/10 bg-transparent text-sm"
                disabled={isLoading}
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}

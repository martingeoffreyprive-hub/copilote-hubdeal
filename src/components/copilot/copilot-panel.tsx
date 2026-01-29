"use client";

import { useState, useRef, useCallback } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageList } from "./message-list";
import { CopilotSettings } from "./copilot-settings";
import { VoiceVisualizer } from "@/components/voice-visualizer/voice-visualizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Settings, X, Loader2 } from "lucide-react";

export function CopilotPanel() {
  const { messages, settings, addMessage, isConnected, setVisualizerState } = useCopilotContext();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speakText = useCallback(async (text: string) => {
    if (!settings.autoSpeak || !settings.apiKey) return;
    try {
      setVisualizerState({ mode: "speaking", levels: new Array(40).fill(0.5) });
      const res = await fetch("/api/openai/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openai-key": settings.apiKey,
        },
        body: JSON.stringify({ input: text.slice(0, 4096), voice: settings.voice }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => {
          URL.revokeObjectURL(url);
          setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });
        };
        await audio.play();
      } else {
        setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });
      }
    } catch {
      setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });
    }
  }, [settings.autoSpeak, settings.apiKey, settings.voice, setVisualizerState]);

  const sendToChat = useCallback(async (text: string, isVoice = false) => {
    if (!text.trim() || isLoading) return;

    if (!settings.apiKey) {
      addMessage("system", "Veuillez d'abord entrer votre clé API OpenAI dans les paramètres (icône engrenage).");
      return;
    }

    addMessage("user", text.trim(), isVoice);
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
        { role: "user" as const, content: text.trim() },
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
        const reply = data.choices[0].message.content;
        addMessage("assistant", reply);
        if (isVoice || settings.autoSpeak) {
          speakText(reply);
        }
      } else {
        addMessage("system", "Réponse inattendue de l'API.");
      }
    } catch (err) {
      addMessage("system", `Erreur réseau: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, settings.apiKey, settings.autoSpeak, messages, addMessage, speakText]);

  const handleSend = () => {
    sendToChat(input);
    setInput("");
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      return;
    }

    if (!settings.apiKey) {
      addMessage("system", "Veuillez d'abord entrer votre clé API OpenAI dans les paramètres.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });

        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (audioBlob.size < 100) return;

        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          formData.append("language", settings.language);

          const res = await fetch("/api/openai/transcribe", {
            method: "POST",
            headers: { "x-openai-key": settings.apiKey },
            body: formData,
          });

          const data = await res.json();
          if (data.text) {
            await sendToChat(data.text, true);
          } else {
            addMessage("system", data.error?.message || "Transcription échouée.");
          }
        } catch {
          addMessage("system", "Erreur lors de la transcription.");
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setVisualizerState({ mode: "listening", levels: new Array(40).fill(0.3) });
    } catch {
      addMessage("system", "Impossible d'accéder au microphone. Vérifiez les permissions.");
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
              <Button
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                className={`h-9 w-9 shrink-0 ${isRecording ? "" : "border-white/10"}`}
                onClick={toggleRecording}
                disabled={isLoading}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isRecording ? "Écoute en cours..." : settings.apiKey ? "Message au copilote..." : "Configurez la clé API..."}
                className="h-9 border-white/10 bg-transparent text-sm"
                disabled={isLoading || isRecording}
              />
              <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={isLoading || isRecording}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      )}
    </GlassCard>
  );
}

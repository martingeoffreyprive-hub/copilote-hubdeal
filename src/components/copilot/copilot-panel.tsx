"use client";

import { useState, useRef, useCallback } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { useQuoteContext } from "@/contexts/quote-context";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageList } from "./message-list";
import { CopilotSettings } from "./copilot-settings";
import { VoiceVisualizer } from "@/components/voice-visualizer/voice-visualizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Settings, X, Loader2 } from "lucide-react";
import { QUOTE_TOOLS } from "@/lib/copilot-tools";
import { formatCurrency } from "@/lib/calculations";
import { Quote } from "@/types/quote";

function buildQuoteSummary(quote: Quote): string {
  const lines = quote.rows.map((r, i) =>
    `[${i}] ${r.designation || "(vide)"} | ${r.quantity} ${r.unit} x ${r.unitPrice}€ = ${formatCurrency(r.totalHT)} HT (TVA ${r.tvaRate}%)`
  ).join("\n");
  const sections = quote.sections.map((s) => `- ${s.title} (id: ${s.id})`).join("\n");
  return `ÉTAT ACTUEL DU DEVIS (réf: ${quote.reference}):
Client: ${quote.clientName || "(non défini)"}
Adresse: ${quote.clientAddress || "(non défini)"}
Sections:\n${sections || "(aucune)"}
Lignes:\n${lines || "(aucune ligne)"}
Remise: ${quote.globalDiscount}${quote.globalDiscountType === "percent" ? "%" : "€"}`;
}

export function CopilotPanel() {
  const { messages, settings, addMessage, setVisualizerState } = useCopilotContext();
  const { quote, updateRow, deleteRow, addSection, dispatch } = useQuoteContext();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Execute a tool call from OpenAI on the quote
  const executeTool = useCallback((name: string, args: Record<string, unknown>): string => {
    switch (name) {
      case "add_row": {
        const sectionId = (args.sectionId as string) || quote.sections[0]?.id;
        if (!sectionId) return "Erreur: aucune section disponible.";
        const designation = args.designation as string;
        const quantity = args.quantity as number;
        const unit = args.unit as string;
        const unitPrice = args.unitPrice as number;
        const tvaRate = args.tvaRate as number;
        dispatch({
          type: "ADD_ROW_WITH_DATA",
          payload: { sectionId, designation, description: (args.description as string) || "", quantity, unit, unitPrice, tvaRate },
        });
        return `Ligne ajoutée: ${designation} - ${quantity} ${unit} x ${unitPrice}€ (TVA ${tvaRate}%)`;
      }
      case "update_row": {
        const idx = args.rowIndex as number;
        const row = quote.rows[idx];
        if (!row) return `Erreur: ligne ${idx} introuvable (${quote.rows.length} lignes).`;
        if (args.designation !== undefined) updateRow(row.id, "designation", args.designation);
        if (args.quantity !== undefined) updateRow(row.id, "quantity", args.quantity);
        if (args.unit !== undefined) updateRow(row.id, "unit", args.unit);
        if (args.unitPrice !== undefined) updateRow(row.id, "unitPrice", args.unitPrice);
        if (args.tvaRate !== undefined) updateRow(row.id, "tvaRate", args.tvaRate);
        return `Ligne ${idx} mise à jour.`;
      }
      case "delete_row": {
        const idx = args.rowIndex as number;
        const row = quote.rows[idx];
        if (!row) return `Erreur: ligne ${idx} introuvable.`;
        deleteRow(row.id);
        return `Ligne ${idx} (${row.designation}) supprimée.`;
      }
      case "add_section": {
        addSection(args.title as string);
        return `Section "${args.title}" ajoutée.`;
      }
      case "set_client_info": {
        if (args.clientName) dispatch({ type: "UPDATE_FIELD", payload: { field: "clientName", value: args.clientName as string } });
        if (args.clientAddress) dispatch({ type: "UPDATE_FIELD", payload: { field: "clientAddress", value: args.clientAddress as string } });
        if (args.clientEmail) dispatch({ type: "UPDATE_FIELD", payload: { field: "clientEmail", value: args.clientEmail as string } });
        if (args.clientPhone) dispatch({ type: "UPDATE_FIELD", payload: { field: "clientPhone", value: args.clientPhone as string } });
        return "Informations client mises à jour.";
      }
      case "set_discount": {
        dispatch({ type: "SET_DISCOUNT", payload: { value: args.value as number, type: args.type as "percent" | "fixed" } });
        return `Remise de ${args.value}${args.type === "percent" ? "%" : "€"} appliquée.`;
      }
      default:
        return `Fonction inconnue: ${name}`;
    }
  }, [quote, updateRow, deleteRow, addSection, dispatch]);

  const speakText = useCallback(async (text: string) => {
    if (!settings.autoSpeak || !settings.apiKey) return;
    try {
      setVisualizerState({ mode: "speaking", levels: new Array(40).fill(0.5) });
      const res = await fetch("/api/openai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
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
      const systemPrompt = `Tu es un copilote AI pour artisans belges. Tu aides à créer et modifier des devis de construction/rénovation.
Réponds toujours en français, de manière concise.

RÈGLES TVA BELGES:
- 6% : rénovation habitation privée >10 ans
- 12% : logements sociaux
- 21% : neuf, commercial, standard

INSTRUCTIONS:
- Quand l'utilisateur demande d'ajouter un poste/ligne/matériau, utilise la fonction add_row.
- Quand il veut modifier un prix, une quantité, etc., utilise update_row avec le bon rowIndex.
- Quand il veut supprimer, utilise delete_row.
- Quand il donne des infos client, utilise set_client_info.
- Propose des prix réalistes pour le marché belge si l'utilisateur ne précise pas.
- Tu peux ajouter plusieurs lignes d'un coup en appelant add_row plusieurs fois.

${buildQuoteSummary(quote)}`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...messages.filter((m) => m.role !== "system").slice(-20).map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        { role: "user" as const, content: text.trim() },
      ];

      const res = await fetch("/api/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: chatMessages,
          tools: QUOTE_TOOLS,
          max_tokens: 2048,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage("system", data.error?.message || data.error || `Erreur ${res.status}`);
        setIsLoading(false);
        return;
      }

      const choice = data.choices?.[0];
      if (!choice) {
        addMessage("system", "Réponse inattendue de l'API.");
        setIsLoading(false);
        return;
      }

      // Handle tool calls
      if (choice.message?.tool_calls?.length) {
        const toolResults: string[] = [];
        for (const toolCall of choice.message.tool_calls) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = executeTool(toolCall.function.name, args);
          toolResults.push(result);
        }

        // Send tool results back to get a natural language summary
        const followUp = await fetch("/api/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              ...chatMessages,
              choice.message,
              ...choice.message.tool_calls.map((tc: { id: string; function: { name: string } }, i: number) => ({
                role: "tool" as const,
                tool_call_id: tc.id,
                content: toolResults[i],
              })),
            ],
            max_tokens: 512,
          }),
        });

        const followData = await followUp.json();
        const reply = followData.choices?.[0]?.message?.content || toolResults.join("\n");
        addMessage("assistant", reply);
        if (isVoice || settings.autoSpeak) speakText(reply);
      } else if (choice.message?.content) {
        addMessage("assistant", choice.message.content);
        if (isVoice || settings.autoSpeak) speakText(choice.message.content);
      }
    } catch (err) {
      addMessage("system", `Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, settings, messages, quote, addMessage, speakText, executeTool]);

  const handleSend = () => {
    const text = input;
    setInput("");
    sendToChat(text);
  };

  const toggleRecording = async () => {
    if (isRecording) {
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
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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
            setIsLoading(false);
            await sendToChat(data.text, true);
          } else {
            addMessage("system", data.error?.message || "Transcription échouée.");
            setIsLoading(false);
          }
        } catch {
          addMessage("system", "Erreur lors de la transcription.");
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
          <div className={`h-2 w-2 rounded-full ${settings.apiKey ? "bg-emerald-500" : "bg-white/20"}`} />
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

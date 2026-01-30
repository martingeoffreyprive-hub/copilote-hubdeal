"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useCopilotContext } from "@/contexts/copilot-context";
import { useQuoteContext } from "@/contexts/quote-context";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageList } from "./message-list";
import { CopilotSettings } from "./copilot-settings";
import { VoiceVisualizer } from "@/components/voice-visualizer/voice-visualizer";
import { QuoteMiniPreview } from "./quote-mini-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Mic, MicOff, Settings, X, Loader2 } from "lucide-react";
import { QUOTE_TOOLS } from "@/lib/copilot-tools";
import { formatCurrency } from "@/lib/calculations";
import { Quote } from "@/types/quote";

function buildQuoteSummary(q: Quote): string {
  const lines = q.rows.map((r, i) =>
    `[${i}] ${r.designation || "(vide)"} | qté:${r.quantity} ${r.unit} | PU:${r.unitPrice}€ | HT:${formatCurrency(r.totalHT)} | TVA:${r.tvaRate}%`
  ).join("\n");
  const sections = q.sections.map((s) => `- "${s.title}" (id: ${s.id})`).join("\n");
  return `DEVIS ACTUEL (réf: ${q.reference}):
Client: ${q.clientName || "(vide)"} | Adresse: ${q.clientAddress || "(vide)"} | Tél: ${q.clientPhone || "(vide)"} | Email: ${q.clientEmail || "(vide)"}
Sections:\n${sections || "(aucune)"}
${q.rows.length} ligne(s):\n${lines || "(vide)"}
Remise: ${q.globalDiscount}${q.globalDiscountType === "percent" ? "%" : "€"}
Notes: ${q.notes || "(vide)"}`;
}

export function CopilotPanel() {
  const { messages, settings, addMessage, setVisualizerState } = useCopilotContext();
  const quoteCtx = useQuoteContext();
  const [input, setInput] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  // Use refs to avoid stale closures
  const quoteRef = useRef(quoteCtx.quote);
  const messagesRef = useRef(messages);
  const isLoadingRef = useRef(false);

  useEffect(() => { quoteRef.current = quoteCtx.quote; }, [quoteCtx.quote]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  const executeTool = useCallback((name: string, args: Record<string, unknown>): string => {
    const q = quoteRef.current;
    const { updateRow, deleteRow, addSection, dispatch } = quoteCtx;

    switch (name) {
      case "add_row": {
        const sectionId = (args.sectionId as string) || q.sections[0]?.id;
        if (!sectionId) return "Erreur: aucune section.";
        dispatch({
          type: "ADD_ROW_WITH_DATA",
          payload: {
            sectionId,
            designation: (args.designation as string) || "",
            description: (args.description as string) || "",
            quantity: (args.quantity as number) || 1,
            unit: (args.unit as string) || "pce",
            unitPrice: (args.unitPrice as number) || 0,
            tvaRate: (args.tvaRate as number) || 21,
          },
        });
        return `Ligne ajoutée: ${args.designation} - ${args.quantity} ${args.unit} x ${args.unitPrice}€ (TVA ${args.tvaRate}%)`;
      }
      case "update_row": {
        const idx = args.rowIndex as number;
        const row = q.rows[idx];
        if (!row) return `Erreur: ligne ${idx} introuvable (${q.rows.length} lignes au total).`;
        if (args.designation !== undefined) updateRow(row.id, "designation", args.designation);
        if (args.quantity !== undefined) updateRow(row.id, "quantity", args.quantity);
        if (args.unit !== undefined) updateRow(row.id, "unit", args.unit);
        if (args.unitPrice !== undefined) updateRow(row.id, "unitPrice", args.unitPrice);
        if (args.tvaRate !== undefined) updateRow(row.id, "tvaRate", args.tvaRate);
        return `Ligne ${idx} ("${row.designation}") mise à jour.`;
      }
      case "delete_row": {
        const idx = args.rowIndex as number;
        const row = q.rows[idx];
        if (!row) return `Erreur: ligne ${idx} introuvable.`;
        deleteRow(row.id);
        return `Ligne ${idx} ("${row.designation}") supprimée.`;
      }
      case "add_section": {
        addSection(args.title as string);
        return `Section "${args.title}" ajoutée.`;
      }
      case "set_client_info": {
        const { dispatch: d } = quoteCtx;
        if (args.clientName) d({ type: "UPDATE_FIELD", payload: { field: "clientName", value: args.clientName as string } });
        if (args.clientAddress) d({ type: "UPDATE_FIELD", payload: { field: "clientAddress", value: args.clientAddress as string } });
        if (args.clientEmail) d({ type: "UPDATE_FIELD", payload: { field: "clientEmail", value: args.clientEmail as string } });
        if (args.clientPhone) d({ type: "UPDATE_FIELD", payload: { field: "clientPhone", value: args.clientPhone as string } });
        return "Infos client mises à jour.";
      }
      case "set_discount": {
        quoteCtx.dispatch({ type: "SET_DISCOUNT", payload: { value: args.value as number, type: args.type as "percent" | "fixed" } });
        return `Remise ${args.value}${args.type === "percent" ? "%" : "€"} appliquée.`;
      }
      case "set_notes": {
        quoteCtx.dispatch({ type: "UPDATE_FIELD", payload: { field: "notes", value: args.notes as string } });
        return "Notes mises à jour.";
      }
      case "set_project_description": {
        quoteCtx.dispatch({ type: "UPDATE_FIELD", payload: { field: "projectDescription", value: args.description as string } });
        return "Description du projet mise à jour.";
      }
      default:
        return `Fonction inconnue: ${name}`;
    }
  }, [quoteCtx]);

  const speakText = useCallback(async (text: string) => {
    if (!settings.autoSpeak || !settings.apiKey) return;
    const shortText = text.length > 500 ? text.slice(0, 497) + "..." : text;
    try {
      setVisualizerState({ mode: "speaking", levels: new Array(40).fill(0.5) });
      const res = await fetch("/api/openai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
        body: JSON.stringify({ input: shortText, voice: settings.voice, speed: 1.05 }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) }); };
        audio.onerror = () => { URL.revokeObjectURL(url); setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) }); };
        await audio.play();
      } else {
        setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });
      }
    } catch {
      setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });
    }
  }, [settings.autoSpeak, settings.apiKey, settings.voice, setVisualizerState]);

  const sendToChat = useCallback(async (text: string, isVoice = false) => {
    if (!text.trim()) return;
    if (isLoadingRef.current) return;
    if (!settings.apiKey) {
      addMessage("system", "Ajoutez votre clé API OpenAI dans les paramètres (icône engrenage).");
      return;
    }

    addMessage("user", text.trim(), isVoice);
    setIsLoading(true);

    try {
      const currentQuote = quoteRef.current;
      const currentMessages = messagesRef.current;

      const systemPrompt = `Tu es un copilote vocal pour artisans belges. Tu modifies des devis en temps réel.
RÉPONDS EN 1-2 PHRASES MAX. Sois bref et direct.

TVA BELGE: 6% rénovation >10 ans, 12% logement social, 21% standard/neuf.
ACTIONS: utilise TOUJOURS les fonctions quand l'utilisateur demande une modification.
- add_row: ajouter une ligne (poste, matériau, main d'oeuvre...)
- update_row: modifier une ligne existante (par rowIndex, commence à 0)
- delete_row: supprimer une ligne
- add_section: ajouter une section
- set_client_info: info client (nom, adresse, email, téléphone)
- set_discount: remise globale
- set_notes: notes/conditions du devis
- set_project_description: description du projet

Propose des prix réalistes marché belge si non précisé. Tu peux appeler plusieurs fonctions.

${buildQuoteSummary(currentQuote)}`;

      const chatMessages = [
        { role: "system" as const, content: systemPrompt },
        ...currentMessages.filter((m) => m.role !== "system").slice(-15).map((m) => ({
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
          max_tokens: 1024,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addMessage("system", data.error?.message || data.error || `Erreur ${res.status}`);
        return;
      }

      const choice = data.choices?.[0];
      if (!choice) { addMessage("system", "Réponse inattendue."); return; }

      if (choice.message?.tool_calls?.length) {
        const toolResults: string[] = [];
        for (const tc of choice.message.tool_calls) {
          try {
            const args = JSON.parse(tc.function.arguments);
            toolResults.push(executeTool(tc.function.name, args));
          } catch (e) {
            toolResults.push(`Erreur parsing: ${e instanceof Error ? e.message : "inconnue"}`);
          }
        }

        // Get natural language summary
        try {
          const followUp = await fetch("/api/openai", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                ...chatMessages,
                choice.message,
                ...choice.message.tool_calls.map((tc: { id: string }, i: number) => ({
                  role: "tool" as const,
                  tool_call_id: tc.id,
                  content: toolResults[i],
                })),
              ],
              max_tokens: 256,
            }),
          });
          const followData = await followUp.json();
          const reply = followData.choices?.[0]?.message?.content || toolResults.join(" | ");
          addMessage("assistant", reply);
          if (isVoice || settings.autoSpeak) speakText(reply);
        } catch {
          const fallback = toolResults.join(" | ");
          addMessage("assistant", fallback);
          if (isVoice || settings.autoSpeak) speakText(fallback);
        }
      } else if (choice.message?.content) {
        addMessage("assistant", choice.message.content);
        if (isVoice || settings.autoSpeak) speakText(choice.message.content);
      }
    } catch (err) {
      addMessage("system", `Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  }, [settings.apiKey, settings.autoSpeak, addMessage, speakText, executeTool]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendToChat(text);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!settings.apiKey) {
      addMessage("system", "Ajoutez votre clé API OpenAI dans les paramètres.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        setVisualizerState({ mode: "idle", levels: new Array(40).fill(0.1) });

        const audioBlob = new Blob(chunksRef.current, { type: mimeType });
        if (audioBlob.size < 200) return;

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

          if (data.text && data.text.trim()) {
            setIsLoading(false);
            await sendToChat(data.text.trim(), true);
          } else {
            addMessage("system", data.error?.message || "Aucun texte détecté. Réessayez.");
            setIsLoading(false);
          }
        } catch {
          addMessage("system", "Erreur transcription.");
          setIsLoading(false);
        }
      };

      recorder.start(500);
      setIsRecording(true);
      setVisualizerState({ mode: "listening", levels: new Array(40).fill(0.3) });
    } catch {
      addMessage("system", "Microphone inaccessible. Vérifiez les permissions du navigateur.");
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
          <QuoteMiniPreview />
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

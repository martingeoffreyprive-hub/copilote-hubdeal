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
import { validateDiscount } from "@/lib/validation";
import { Quote } from "@/types/quote";

function buildQuoteSummary(q: Quote): string {
  const lines = q.rows.map((r, i) =>
    `[${i}] ${r.designation || "(vide)"} | qté:${r.quantity} ${r.unit} | PU:${r.unitPrice}€ | HT:${formatCurrency(r.totalHT)} | TVA:${r.tvaRate}%`
  ).join("\n");
  const sections = q.sections.map((s, i) => `${String.fromCharCode(65 + i)}. "${s.title}" (id: ${s.id})`).join("\n");
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
  const busyRef = useRef(false);

  useEffect(() => { quoteRef.current = quoteCtx.quote; }, [quoteCtx.quote]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const executeTool = useCallback((name: string, args: Record<string, unknown>, batchSections?: { title: string; id: string }[]): string => {
    const q = quoteRef.current;
    const { updateRow, deleteRow, dispatch } = quoteCtx;

    // Resolve sectionId: try exact ID, then match by title in existing + batch sections
    const resolveSection = (input?: string): string | undefined => {
      if (!input) return q.sections[0]?.id || batchSections?.[0]?.id;
      // Check existing sections by ID
      if (q.sections.find((s) => s.id === input)) return input;
      // Check batch sections by ID
      if (batchSections?.find((s) => s.id === input)) return input;
      // Match by title (case-insensitive)
      const lower = input.toLowerCase();
      const existing = q.sections.find((s) => s.title.toLowerCase() === lower);
      if (existing) return existing.id;
      const batch = batchSections?.find((s) => s.title.toLowerCase() === lower);
      if (batch) return batch.id;
      // Partial match
      const partial = q.sections.find((s) => s.title.toLowerCase().includes(lower));
      if (partial) return partial.id;
      const partialBatch = batchSections?.find((s) => s.title.toLowerCase().includes(lower));
      if (partialBatch) return partialBatch.id;
      // Fallback to last batch section or first existing
      return batchSections?.[batchSections.length - 1]?.id || q.sections[0]?.id;
    };

    // Resolve row by index or designation (fuzzy match)
    const resolveRow = (args: Record<string, unknown>): { row: typeof q.rows[0]; idx: number } | string => {
      if (args.rowIndex !== undefined) {
        const idx = args.rowIndex as number;
        const row = q.rows[idx];
        if (!row) return `Erreur: ligne ${idx} introuvable (${q.rows.length} lignes au total).`;
        return { row, idx };
      }
      if (args.rowDesignation) {
        const search = (args.rowDesignation as string).toLowerCase();
        // Exact match first
        let idx = q.rows.findIndex((r) => r.designation.toLowerCase() === search);
        // Partial match
        if (idx < 0) idx = q.rows.findIndex((r) => r.designation.toLowerCase().includes(search));
        // Reverse partial
        if (idx < 0) idx = q.rows.findIndex((r) => search.includes(r.designation.toLowerCase()) && r.designation.length > 0);
        if (idx < 0) return `Erreur: aucune ligne trouvée pour "${args.rowDesignation}".`;
        return { row: q.rows[idx], idx };
      }
      return "Erreur: rowIndex ou rowDesignation requis.";
    };

    switch (name) {
      case "add_row": {
        const sectionId = resolveSection(args.sectionId as string);
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
        const ht = ((args.quantity as number) || 1) * ((args.unitPrice as number) || 0);
        return `Ligne ajoutée: ${args.designation} - ${args.quantity} ${args.unit} x ${args.unitPrice}€ = ${ht.toFixed(2)}€ HT (TVA ${args.tvaRate}%)`;
      }
      case "update_row": {
        const resolved = resolveRow(args);
        if (typeof resolved === "string") return resolved;
        const { row, idx } = resolved;
        if (args.designation !== undefined) updateRow(row.id, "designation", args.designation);
        if (args.quantity !== undefined) updateRow(row.id, "quantity", args.quantity);
        if (args.unit !== undefined) updateRow(row.id, "unit", args.unit);
        if (args.unitPrice !== undefined) updateRow(row.id, "unitPrice", args.unitPrice);
        if (args.tvaRate !== undefined) updateRow(row.id, "tvaRate", args.tvaRate);
        return `Ligne ${idx} ("${row.designation}") mise à jour.`;
      }
      case "delete_row": {
        const resolved = resolveRow(args);
        if (typeof resolved === "string") return resolved;
        const { row, idx } = resolved;
        deleteRow(row.id);
        return `Ligne ${idx} ("${row.designation}") supprimée.`;
      }
      case "add_section": {
        const newId = crypto.randomUUID();
        dispatch({ type: "ADD_SECTION_WITH_ID", payload: { id: newId, title: (args.title as string) || "Section" } });
        batchSections?.push({ title: (args.title as string) || "Section", id: newId });
        return `Section "${args.title}" ajoutée (id: ${newId}).`;
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
        const discountVal = args.value as number;
        const discountType = args.type as "percent" | "fixed";
        const totalHT = q.rows.reduce((sum, r) => sum + r.totalHT, 0);
        const check = validateDiscount(discountVal, discountType, totalHT);
        if (!check.valid) return `Erreur: ${check.message}`;
        quoteCtx.dispatch({ type: "SET_DISCOUNT", payload: { value: discountVal, type: discountType } });
        return `Remise ${discountVal}${discountType === "percent" ? "%" : "€"} appliquée.`;
      }
      case "set_notes": {
        quoteCtx.dispatch({ type: "UPDATE_FIELD", payload: { field: "notes", value: args.notes as string } });
        return "Notes mises à jour.";
      }
      case "set_project_description": {
        quoteCtx.dispatch({ type: "UPDATE_FIELD", payload: { field: "projectDescription", value: args.description as string } });
        return "Description du projet mise à jour.";
      }
      case "undo": {
        if (!quoteCtx.canUndo) return "Rien à annuler.";
        quoteCtx.undo();
        return "Dernière action annulée.";
      }
      case "redo": {
        if (!quoteCtx.canRedo) return "Rien à rétablir.";
        quoteCtx.redo();
        return "Action rétablie.";
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

  // Core chat function — does NOT manage isLoading itself, caller is responsible
  const processChat = useCallback(async (text: string, isVoice: boolean) => {
    const currentQuote = quoteRef.current;
    const currentMessages = messagesRef.current;

    const systemPrompt = `Tu es un copilote expert pour artisans belges. Tu génères et modifies des devis en temps réel.

WORKFLOW EN 3 ÉTAPES POUR UN NOUVEAU PROJET:
Quand l'utilisateur décrit un NOUVEAU projet ou chantier (description globale avec travaux, dimensions, etc.), tu DOIS suivre ces 3 étapes DANS L'ORDRE. N'appelle AUCUNE fonction avant l'étape 3.

**ÉTAPE 1 — Confirmation du chantier:**
N'appelle AUCUNE fonction. Résume ce que tu as compris du projet:
- Type de travaux
- Dimensions / surfaces calculées
- Spécificités mentionnées (matériaux, style, contraintes)
Termine par: "✅ Ce résumé est correct ? Confirmez ou corrigez."

**ÉTAPE 2 — Validation des sections:**
Quand l'utilisateur confirme l'étape 1 (dit "oui", "ok", "c'est bon", "correct", "confirme", etc.):
N'appelle AUCUNE fonction. Propose la liste des sections prévues, annotées par LETTRES (ordre alphabétique):
A. Carrelage
B. Électricité
C. Plafonnage
D. Préparation sols
etc.
Les sections = catégories de travaux (corps de métier). Exemples: Électricité, Carrelage, Plafonnage, Toiture, Cuisine équipée, Châssis, Plomberie, Démolition, Peinture, Menuiserie, Isolation, Sanitaires, HVAC, Maçonnerie, etc.
Trie les sections par ordre alphabétique et attribue une lettre A, B, C...
Termine par: "📋 Ces sections sont correctes ? Vous pouvez modifier les noms, en ajouter ou en supprimer."

**ÉTAPE 3 — Génération complète:**
Quand l'utilisateur confirme les sections (dit "oui", "ok", "c'est bon", "go", "génère", etc.):
MAINTENANT tu appelles les fonctions. Tu DOIS:
1. Appeler add_section pour CHAQUE section confirmée (= catégorie de travaux), dans l'ORDRE ALPHABÉTIQUE
2. Appeler add_row pour CHAQUE poste dans chaque section. Les lignes servent à:
   - Décrire chaque prestation/poste de travail (main d'œuvre pose, dépose, préparation, finitions...)
   - Lister les matériaux/articles/fournitures nécessaires (carrelage, câbles, prises, enduit...)
   - Chaque ligne a: designation, quantity, unit, unitPrice, tvaRate
   - quantity: calculée à partir des dimensions (ex: 5x8m = 40m²)
   - unit: unité adaptée (m², ml, pce, h, forfait, etc.)
   - unitPrice: prix unitaire réaliste marché belge HTVA
   - tvaRate: 6 pour rénovation >10 ans, 21 pour neuf/standard
3. Appeler set_project_description avec un résumé

IMPORTANT: Si l'utilisateur modifie les noms de sections à l'étape 2, utilise les noms modifiés. Si l'utilisateur ajoute/supprime des sections, adapte la liste en conséquence.

EXCEPTION: Si l'utilisateur demande une action SIMPLE (ajouter UNE ligne, modifier un prix, supprimer, etc.), exécute directement sans workflow en 3 étapes.

CALCUL DES QUANTITÉS:
- "5x8 mètres" → surface = 40 m², périmètre = 26 ml pour plinthes
- "2 prises + 2 interrupteurs" → 2 pce + 2 pce
- Toujours inclure la main d'œuvre (h ou forfait)

PRIX INDICATIFS BELGES (HTVA):
- Dépose carrelage: 12-18€/m² | Pose carrelage sol: 35-50€/m² | Carrelage fourniture: 25-60€/m²
- Préparation/ragréage sol: 15-25€/m² | Plinthes: 8-15€/ml | Joint silicone: 5-10€/ml
- Point électrique (prise/interrupteur): 80-120€/pce | Luminaire pose: 60-100€/pce
- Câblage électrique: 15-25€/ml | Tableau électrique: 250-500€/forfait
- Main d'œuvre générale: 40-55€/h | Évacuation gravats: 150-300€/forfait

DÉCOMPOSITION TYPE:
Pour chaque section: fourniture + main d'œuvre + finitions.

TVA BELGE: 6% rénovation habitation >10 ans, 12% logement social, 21% standard/neuf.

FONCTIONS DISPONIBLES:
- add_section: créer une section (TOUJOURS créer les sections AVANT les lignes)
- add_row: ajouter une ligne avec sectionId, designation, quantity, unit, unitPrice, tvaRate
- update_row: modifier une ligne (par rowIndex ou rowDesignation)
- delete_row: supprimer une ligne. CONFIRME d'abord sauf si l'utilisateur dit explicitement "supprime"/"enlève".
- set_client_info: nom, adresse, email, téléphone du client
- set_discount: remise globale (percent ou fixed)
- set_notes: notes/conditions
- set_project_description: description du chantier
- undo: annuler la dernière action
- redo: rétablir

Tu peux et DOIS appeler PLUSIEURS fonctions en un seul message à l'étape 3.
RÉPONDS ensuite en 1-2 phrases avec le total estimé.

SUGGESTIONS PROACTIVES:
Après génération, suggère en une ligne les améliorations possibles (postes manquants, incohérences TVA, notes absentes).
Ex: "💡 Suggestion: ajouter évacuation gravats et nettoyage chantier ?"

${buildQuoteSummary(currentQuote)}`;

    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...currentMessages.filter((m) => m.role !== "system").slice(-15).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: text },
    ];

    const res = await fetch("/api/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-openai-key": settings.apiKey },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: chatMessages,
        tools: QUOTE_TOOLS,
        max_tokens: 4096,
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
      // Track sections created during this batch so add_row can reference them
      const batchSections: { title: string; id: string }[] = [];
      const toolResults: string[] = [];
      for (const tc of choice.message.tool_calls) {
        try {
          const args = JSON.parse(tc.function.arguments);
          toolResults.push(executeTool(tc.function.name, args, batchSections));
        } catch (e) {
          toolResults.push(`Erreur parsing: ${e instanceof Error ? e.message : "inconnue"}`);
        }
      }

      // Get natural language summary
      let reply = toolResults.join(" | ");
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
        if (followUp.ok) {
          const followData = await followUp.json();
          reply = followData.choices?.[0]?.message?.content || reply;
        }
      } catch { /* use fallback */ }
      addMessage("assistant", reply);
    } else if (choice.message?.content) {
      addMessage("assistant", choice.message.content);
    }
  }, [settings.apiKey, addMessage, executeTool]);

  const sendToChat = useCallback(async (text: string, isVoice = false) => {
    if (!text.trim()) return;
    if (busyRef.current) return;
    if (!settings.apiKey) {
      addMessage("system", "Ajoutez votre clé API OpenAI dans les paramètres (icône engrenage).");
      return;
    }

    busyRef.current = true;
    addMessage("user", text.trim(), isVoice);
    setIsLoading(true);

    try {
      await processChat(text.trim(), isVoice);
    } catch (err) {
      addMessage("system", `Erreur: ${err instanceof Error ? err.message : "inconnue"}`);
    } finally {
      busyRef.current = false;
      setIsLoading(false);
    }
  }, [settings.apiKey, addMessage, processChat]);

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

        // Show loading during transcription + chat
        busyRef.current = true;
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

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            addMessage("system", errData.error?.message || errData.error || `Erreur transcription (${res.status})`);
            return;
          }

          const data = await res.json();

          if (data.text && data.text.trim()) {
            addMessage("user", data.text.trim(), true);
            await processChat(data.text.trim(), true);
          } else {
            addMessage("system", "Aucun texte détecté. Réessayez.");
          }
        } catch {
          addMessage("system", "Erreur transcription.");
        } finally {
          busyRef.current = false;
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

"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuoteTable } from "./quote-table";
import { PdfPreview } from "@/components/pdf/pdf-preview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuoteContext } from "@/contexts/quote-context";
import { GlassCard } from "@/components/ui/glass-card";

export function EditorPanel() {
  const { quote, dispatch } = useQuoteContext();

  const updateField = (field: string, value: string) =>
    dispatch({ type: "UPDATE_FIELD", payload: { field, value } });

  return (
    <div className="flex h-full flex-col gap-4 p-4 overflow-hidden">
      <GlassCard className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Client</Label>
            <Input value={quote.clientName} onChange={(e) => updateField("clientName", e.target.value)} placeholder="Nom du client" className="h-8 mt-1 border-white/10 bg-transparent text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input value={quote.clientEmail} onChange={(e) => updateField("clientEmail", e.target.value)} placeholder="email@example.com" className="h-8 mt-1 border-white/10 bg-transparent text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Téléphone</Label>
            <Input value={quote.clientPhone} onChange={(e) => updateField("clientPhone", e.target.value)} placeholder="+32..." className="h-8 mt-1 border-white/10 bg-transparent text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Référence</Label>
            <Input value={quote.reference} readOnly className="h-8 mt-1 border-white/10 bg-transparent text-sm text-muted-foreground" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Adresse</Label>
          <Textarea value={quote.clientAddress} onChange={(e) => updateField("clientAddress", e.target.value)} placeholder="Adresse du client" className="mt-1 min-h-[60px] border-white/10 bg-transparent text-sm" />
        </div>
      </GlassCard>

      <Tabs defaultValue="editor" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="editor">Editeur</TabsTrigger>
          <TabsTrigger value="pdf">Aperçu PDF</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="flex-1 overflow-hidden mt-2">
          <QuoteTable />
        </TabsContent>
        <TabsContent value="pdf" className="flex-1 overflow-auto mt-2">
          <PdfPreview />
        </TabsContent>
      </Tabs>
    </div>
  );
}

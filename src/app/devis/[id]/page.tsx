"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuoteProvider } from "@/contexts/quote-context";
import { CopilotProvider } from "@/contexts/copilot-context";
import { SplitScreen } from "@/components/layout/split-screen";
import { AutoSaveQuote } from "@/components/auto-save-quote";
import { useQuoteStorage } from "@/hooks/use-quote-storage";
import { Quote } from "@/types/quote";

export default function EditDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { getQuoteById } = useQuoteStorage();
  const [initialQuote, setInitialQuote] = useState<Quote | null | undefined>(undefined);

  useEffect(() => {
    const q = getQuoteById(id);
    if (!q) {
      router.replace("/devis");
      return;
    }
    setInitialQuote(q);
  }, [id, getQuoteById, router]);

  if (initialQuote === undefined) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (initialQuote === null) return null;

  return (
    <QuoteProvider initialQuote={initialQuote}>
      <CopilotProvider>
        <AutoSaveQuote />
        <SplitScreen />
      </CopilotProvider>
    </QuoteProvider>
  );
}

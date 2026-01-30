"use client";

import { QuoteProvider } from "@/contexts/quote-context";
import { CopilotProvider } from "@/contexts/copilot-context";
import { SplitScreen } from "@/components/layout/split-screen";
import { AutoSaveQuote } from "@/components/auto-save-quote";

export default function NouveauDevisPage() {
  return (
    <QuoteProvider>
      <CopilotProvider>
        <AutoSaveQuote />
        <SplitScreen />
      </CopilotProvider>
    </QuoteProvider>
  );
}

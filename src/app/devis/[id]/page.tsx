"use client";

import { QuoteProvider } from "@/contexts/quote-context";
import { CopilotProvider } from "@/contexts/copilot-context";
import { SplitScreen } from "@/components/layout/split-screen";

export default function DevisEditorPage() {
  return (
    <QuoteProvider>
      <CopilotProvider>
        <SplitScreen />
      </CopilotProvider>
    </QuoteProvider>
  );
}

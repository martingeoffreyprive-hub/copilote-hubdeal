"use client";

import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import { useQuoteContext } from "@/contexts/quote-context";

export function TableToolbar() {
  const { quote, addRow, addSection } = useQuoteContext();
  const firstSectionId = quote.sections[0]?.id;

  return (
    <div className="flex items-center gap-2 p-3">
      <Button variant="outline" size="sm" className="border-white/10 text-xs" onClick={() => firstSectionId && addRow(firstSectionId)}>
        <Plus className="mr-1.5 h-3.5 w-3.5" /> Ligne
      </Button>
      <Button variant="outline" size="sm" className="border-white/10 text-xs" onClick={() => addSection()}>
        <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> Section
      </Button>
    </div>
  );
}

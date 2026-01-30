"use client";

import { QuoteSection } from "@/types/quote";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useQuoteContext } from "@/contexts/quote-context";

export function SectionRow({ section }: { section: QuoteSection }) {
  const { updateSection, deleteSection, addRow } = useQuoteContext();

  return (
    <tr className="border-b border-white/10 bg-white/5">
      <td colSpan={8} className="p-2">
        <div className="flex items-center gap-2">
          <Input
            value={section.title}
            onChange={(e) => updateSection(section.id, e.target.value)}
            className="h-8 w-64 border-white/10 bg-transparent text-sm font-semibold"
          />
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addRow(section.id)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => { if (window.confirm(`Supprimer la section "${section.title}" et toutes ses lignes ?`)) deleteSection(section.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

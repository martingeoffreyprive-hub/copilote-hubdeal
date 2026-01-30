"use client";

import { useState } from "react";
import { useQuoteContext } from "@/contexts/quote-context";
import { formatCurrency } from "@/lib/calculations";
import { ChevronDown, ChevronUp } from "lucide-react";

export function QuoteMiniPreview() {
  const { quote, totals } = useQuoteContext();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-white/10 bg-white/[0.03]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-muted-foreground">
          {quote.rows.length} ligne{quote.rows.length !== 1 ? "s" : ""} &middot; HT {formatCurrency(totals.totalHT)} &middot; TTC {formatCurrency(totals.totalTTC)}
        </span>
        {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
      </button>
      {expanded && (
        <div className="max-h-40 overflow-y-auto px-4 pb-2 space-y-1">
          {quote.rows.length === 0 && (
            <p className="text-xs text-muted-foreground italic">Aucune ligne</p>
          )}
          {quote.rows.map((row, i) => (
            <div key={row.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate mr-2">
                <span className="text-white/40">{i + 1}.</span>{" "}
                {row.designation || "(vide)"}
              </span>
              <span className="shrink-0 font-mono">{formatCurrency(row.totalHT)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

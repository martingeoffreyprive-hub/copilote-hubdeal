"use client";

import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2 } from "lucide-react";
import { useQuoteStorage } from "@/hooks/use-quote-storage";
import { formatCurrency } from "@/lib/calculations";
import { calcQuoteTotals } from "@/lib/calculations";

export default function DevisListPage() {
  const { quotes, deleteQuote } = useQuoteStorage();

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Mes Devis</h1>
        <Link href="/devis/nouveau">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Nouveau
          </Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <GlassCard className="p-8 flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Aucun devis</p>
            <p className="text-xs text-muted-foreground">Cr&eacute;ez votre premier devis avec le copilote AI</p>
          </div>
          <Link href="/devis/nouveau">
            <Button size="sm" variant="outline" className="border-white/10">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Cr&eacute;er un devis
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => {
            const totals = calcQuoteTotals(q.rows, q.globalDiscount, q.globalDiscountType);
            return (
              <Link key={q.id} href={`/devis/${q.id}`}>
                <GlassCard className="p-4 space-y-3 hover:bg-white/[0.06] transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold">{q.reference}</p>
                      <p className="text-xs text-muted-foreground">{q.clientName || "Client non d\u00e9fini"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-400"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteQuote(q.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{q.rows.length} ligne{q.rows.length !== 1 ? "s" : ""}</span>
                    <span className="font-mono font-medium text-white/80">{formatCurrency(totals.totalTTC)}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(q.updatedAt).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

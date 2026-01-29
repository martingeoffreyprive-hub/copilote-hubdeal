"use client";

import { useQuoteContext } from "@/contexts/quote-context";
import { formatCurrency } from "@/lib/calculations";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TableFooter() {
  const { quote, totals, dispatch } = useQuoteContext();

  return (
    <div className="border-t border-white/10 p-4 space-y-3">
      {totals.tvaBreakdown.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ventilation TVA</p>
          {totals.tvaBreakdown.map((b) => (
            <div key={b.rate} className="flex justify-between text-sm">
              <span>Base {b.rate}%: {formatCurrency(b.baseHT)}</span>
              <span>TVA: {formatCurrency(b.tvaAmount)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Remise:</span>
        <Input
          type="number"
          value={quote.globalDiscount}
          onChange={(e) => dispatch({ type: "SET_DISCOUNT", payload: { value: parseFloat(e.target.value) || 0, type: quote.globalDiscountType } })}
          className="h-8 w-20 border-white/10 bg-transparent text-sm"
        />
        <Select value={quote.globalDiscountType} onValueChange={(v) => dispatch({ type: "SET_DISCOUNT", payload: { value: quote.globalDiscount, type: v as "percent" | "fixed" } })}>
          <SelectTrigger className="h-8 w-20 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percent">%</SelectItem>
            <SelectItem value="fixed">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between"><span>Total HT</span><span className="font-medium">{formatCurrency(totals.totalHT)}</span></div>
        <div className="flex justify-between"><span>Total TVA</span><span className="font-medium">{formatCurrency(totals.totalTVA)}</span></div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-orange-400"><span>Remise</span><span>-{formatCurrency(totals.discount)}</span></div>
        )}
        <div className="flex justify-between text-base font-bold border-t border-white/10 pt-2">
          <span>Total TTC</span>
          <span>{formatCurrency(totals.totalAfterDiscount)}</span>
        </div>
      </div>
    </div>
  );
}

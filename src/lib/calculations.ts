import { QuoteRow, TVARate, QuoteTotals, TVABreakdown, Quote } from "@/types/quote";

export function calcRowTotalHT(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calcRowTotalTTC(totalHT: number, tvaRate: TVARate): number {
  return Math.round(totalHT * (1 + tvaRate / 100) * 100) / 100;
}

export function calcQuoteTotals(rows: QuoteRow[], globalDiscount: number, globalDiscountType: "percent" | "fixed"): QuoteTotals {
  const tvaMap = new Map<TVARate, { baseHT: number; tvaAmount: number }>();

  for (const row of rows) {
    const existing = tvaMap.get(row.tvaRate) || { baseHT: 0, tvaAmount: 0 };
    existing.baseHT += row.totalHT;
    existing.tvaAmount += row.totalTTC - row.totalHT;
    tvaMap.set(row.tvaRate, existing);
  }

  const tvaBreakdown: TVABreakdown[] = Array.from(tvaMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, data]) => ({
      rate,
      baseHT: Math.round(data.baseHT * 100) / 100,
      tvaAmount: Math.round(data.tvaAmount * 100) / 100,
      totalTTC: Math.round((data.baseHT + data.tvaAmount) * 100) / 100,
    }));

  const totalHT = Math.round(rows.reduce((sum, r) => sum + r.totalHT, 0) * 100) / 100;
  const totalTVA = Math.round(rows.reduce((sum, r) => sum + (r.totalTTC - r.totalHT), 0) * 100) / 100;
  const totalTTC = Math.round((totalHT + totalTVA) * 100) / 100;

  const discount = globalDiscountType === "percent"
    ? Math.round(totalTTC * globalDiscount / 100 * 100) / 100
    : globalDiscount;

  const totalAfterDiscount = Math.round((totalTTC - discount) * 100) / 100;

  return { totalHT, totalTVA, totalTTC, discount, totalAfterDiscount, tvaBreakdown };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR" }).format(amount);
}

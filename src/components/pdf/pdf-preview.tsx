"use client";

import { useQuoteContext } from "@/contexts/quote-context";
import { formatCurrency } from "@/lib/calculations";
import { GlassCard } from "@/components/ui/glass-card";
import { QRCodePayment } from "./qr-code";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function PdfPreview() {
  const { quote, totals } = useQuoteContext();

  const handleDownload = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(20);
    doc.text("DEVIS", 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Référence: ${quote.reference}`, 20, y);
    y += 6;
    doc.text(`Client: ${quote.clientName}`, 20, y);
    y += 6;
    doc.text(`Adresse: ${quote.clientAddress}`, 20, y);
    y += 6;
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString("fr-BE")}`, 20, y);
    y += 12;

    // Table header
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Désignation", 20, y);
    doc.text("Qté", 100, y);
    doc.text("Unité", 115, y);
    doc.text("PU", 135, y);
    doc.text("TVA", 155, y);
    doc.text("Total HT", 170, y);
    y += 6;
    doc.setFont("helvetica", "normal");

    for (const row of quote.rows) {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(row.designation.substring(0, 40), 20, y);
      doc.text(String(row.quantity), 100, y);
      doc.text(row.unit, 115, y);
      doc.text(row.unitPrice.toFixed(2), 135, y);
      doc.text(`${row.tvaRate}%`, 155, y);
      doc.text(row.totalHT.toFixed(2), 170, y);
      y += 5;
    }

    y += 8;
    doc.setFontSize(10);
    doc.text(`Total HT: ${formatCurrency(totals.totalHT)}`, 130, y);
    y += 6;
    doc.text(`Total TVA: ${formatCurrency(totals.totalTVA)}`, 130, y);
    y += 6;
    if (totals.discount > 0) {
      doc.text(`Remise: -${formatCurrency(totals.discount)}`, 130, y);
      y += 6;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`Total TTC: ${formatCurrency(totals.totalAfterDiscount)}`, 130, y);
    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`IBAN: ${quote.iban}`, 20, y);
    y += 5;
    doc.text(`BIC: ${quote.bic}`, 20, y);

    doc.save(`${quote.reference}.pdf`);
  };

  return (
    <GlassCard className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">Aperçu du devis</h3>
        <Button variant="outline" size="sm" className="border-white/10" onClick={handleDownload}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger PDF
        </Button>
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-lg font-bold">DEVIS {quote.reference}</p>
        <p>Client: {quote.clientName || "—"}</p>
        <p>Adresse: {quote.clientAddress || "—"}</p>
        <p>Date: {new Date(quote.createdAt).toLocaleDateString("fr-BE")}</p>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 text-muted-foreground">
              <th className="p-2 text-left">Désignation</th>
              <th className="p-2 text-right">Qté</th>
              <th className="p-2">Unité</th>
              <th className="p-2 text-right">PU</th>
              <th className="p-2 text-right">TVA</th>
              <th className="p-2 text-right">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {quote.rows.map((row) => (
              <tr key={row.id} className="border-t border-white/5">
                <td className="p-2">{row.designation || "—"}</td>
                <td className="p-2 text-right">{row.quantity}</td>
                <td className="p-2 text-center">{row.unit}</td>
                <td className="p-2 text-right">{formatCurrency(row.unitPrice)}</td>
                <td className="p-2 text-right">{row.tvaRate}%</td>
                <td className="p-2 text-right font-medium">{formatCurrency(row.totalHT)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-end">
        <QRCodePayment
          iban={quote.iban}
          bic={quote.bic}
          beneficiary={quote.clientName || "Artisan"}
          amount={totals.totalAfterDiscount}
          reference={quote.reference}
        />
        <div className="space-y-1 text-sm text-right">
          <p>Total HT: {formatCurrency(totals.totalHT)}</p>
          <p>Total TVA: {formatCurrency(totals.totalTVA)}</p>
          {totals.discount > 0 && <p className="text-orange-400">Remise: -{formatCurrency(totals.discount)}</p>}
          <p className="text-base font-bold">Total TTC: {formatCurrency(totals.totalAfterDiscount)}</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>IBAN: {quote.iban} | BIC: {quote.bic}</p>
      </div>
    </GlassCard>
  );
}

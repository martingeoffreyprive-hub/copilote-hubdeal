"use client";

import { useQuoteContext } from "@/contexts/quote-context";
import { formatCurrency } from "@/lib/calculations";
import { GlassCard } from "@/components/ui/glass-card";
import { QRCodePayment } from "./qr-code";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function PdfPreview() {
  const { quote, totals } = useQuoteContext();

  const handleDownload = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("DEVIS", 20, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(quote.reference, 160, y, { align: "right" });
    y += 12;

    // Date & status
    doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString("fr-BE")}`, 20, y);
    y += 6;
    if (quote.projectDescription) {
      doc.text(`Projet: ${quote.projectDescription}`, 20, y);
      y += 8;
    }

    // Client info
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Client", 20, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    if (quote.clientName) { doc.text(quote.clientName, 20, y); y += 5; }
    if (quote.clientAddress) {
      const addrLines = doc.splitTextToSize(quote.clientAddress, 80);
      doc.text(addrLines, 20, y);
      y += addrLines.length * 5;
    }
    if (quote.clientPhone) { doc.text(`Tél: ${quote.clientPhone}`, 20, y); y += 5; }
    if (quote.clientEmail) { doc.text(`Email: ${quote.clientEmail}`, 20, y); y += 5; }
    y += 8;

    // Table header line
    doc.setDrawColor(200);
    doc.line(20, y, 190, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Désignation", 20, y);
    doc.text("Qté", 105, y, { align: "right" });
    doc.text("Unité", 115, y);
    doc.text("PU HTVA", 145, y, { align: "right" });
    doc.text("TVA", 158, y, { align: "right" });
    doc.text("Total HT", 185, y, { align: "right" });
    y += 3;
    doc.line(20, y, 190, y);
    y += 5;
    doc.setFont("helvetica", "normal");

    // Sections & rows
    for (const section of quote.sections) {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.text(section.title, 20, y);
      doc.setFont("helvetica", "normal");
      y += 6;

      const sectionRows = quote.rows.filter((r) => r.sectionId === section.id);
      for (const row of sectionRows) {
        if (y > 270) { doc.addPage(); y = 20; }
        const designation = row.designation.length > 45 ? row.designation.substring(0, 42) + "..." : row.designation;
        doc.text(designation || "—", 22, y);
        doc.text(String(row.quantity), 105, y, { align: "right" });
        doc.text(row.unit, 115, y);
        doc.text(row.unitPrice.toFixed(2) + " €", 145, y, { align: "right" });
        doc.text(row.tvaRate + "%", 158, y, { align: "right" });
        doc.text(row.totalHT.toFixed(2) + " €", 185, y, { align: "right" });
        y += 5;
      }
      y += 3;
    }

    // Totals
    y += 5;
    doc.line(120, y, 190, y);
    y += 6;
    doc.setFontSize(9);

    for (const b of totals.tvaBreakdown) {
      doc.text(`Base ${b.rate}%:`, 120, y);
      doc.text(formatCurrency(b.baseHT), 160, y, { align: "right" });
      doc.text(`TVA: ${formatCurrency(b.tvaAmount)}`, 185, y, { align: "right" });
      y += 5;
    }
    y += 3;

    doc.text("Total HTVA:", 120, y);
    doc.text(formatCurrency(totals.totalHT), 185, y, { align: "right" });
    y += 5;
    doc.text("Total TVA:", 120, y);
    doc.text(formatCurrency(totals.totalTVA), 185, y, { align: "right" });
    y += 5;
    if (totals.discount > 0) {
      doc.text("Remise:", 120, y);
      doc.text("-" + formatCurrency(totals.discount), 185, y, { align: "right" });
      y += 5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL TTC:", 120, y);
    doc.text(formatCurrency(totals.totalAfterDiscount), 185, y, { align: "right" });
    y += 12;

    // Notes
    if (quote.notes) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Notes & Conditions:", 20, y);
      doc.setFont("helvetica", "normal");
      y += 5;
      const noteLines = doc.splitTextToSize(quote.notes, 170);
      if (y + noteLines.length * 4 > 280) { doc.addPage(); y = 20; }
      doc.text(noteLines, 20, y);
      y += noteLines.length * 4 + 8;
    }

    // Payment info
    doc.setFontSize(8);
    doc.text(`IBAN: ${quote.iban}  |  BIC: ${quote.bic}`, 20, y);

    doc.save(`${quote.reference}.pdf`);
  };

  // Group rows by section for preview
  const sectionRows = quote.sections.map((s) => ({
    section: s,
    rows: quote.rows.filter((r) => r.sectionId === s.id),
  }));

  return (
    <GlassCard className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight">DEVIS</h3>
          <p className="text-sm text-muted-foreground font-mono">{quote.reference}</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/10" onClick={handleDownload}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Date</p>
          <p>{new Date(quote.createdAt).toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        {quote.projectDescription && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Projet</p>
            <p>{quote.projectDescription}</p>
          </div>
        )}
      </div>

      {/* Client */}
      {(quote.clientName || quote.clientAddress || quote.clientPhone || quote.clientEmail) && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Client</p>
          {quote.clientName && <p className="font-semibold">{quote.clientName}</p>}
          {quote.clientAddress && <p className="text-muted-foreground whitespace-pre-line">{quote.clientAddress}</p>}
          {quote.clientPhone && <p className="text-muted-foreground">Tél: {quote.clientPhone}</p>}
          {quote.clientEmail && <p className="text-muted-foreground">{quote.clientEmail}</p>}
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Table by sections */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white/5 text-muted-foreground text-[10px] uppercase tracking-wider">
              <th className="p-2 text-left">Désignation</th>
              <th className="p-2 text-right w-14">Qté</th>
              <th className="p-2 text-center w-14">Unité</th>
              <th className="p-2 text-right w-20">PU HTVA</th>
              <th className="p-2 text-right w-12">TVA</th>
              <th className="p-2 text-right w-24">Total HT</th>
            </tr>
          </thead>
          <tbody>
            {sectionRows.map(({ section, rows }) => (
              <tr key={`section-group-${section.id}`}>
                <td colSpan={6} className="p-0">
                  <table className="w-full">
                    <tbody>
                      <tr className="bg-white/[0.03]">
                        <td colSpan={6} className="p-2 text-xs font-semibold text-blue-400">{section.title}</td>
                      </tr>
                      {rows.map((row) => (
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TVA Breakdown */}
      {totals.tvaBreakdown.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="text-muted-foreground uppercase tracking-wider text-[10px]">Ventilation TVA</p>
          {totals.tvaBreakdown.map((b) => (
            <div key={b.rate} className="flex justify-between">
              <span>Base {b.rate}%: {formatCurrency(b.baseHT)}</span>
              <span>TVA: {formatCurrency(b.tvaAmount)}</span>
            </div>
          ))}
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Totals */}
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Total HTVA</span><span>{formatCurrency(totals.totalHT)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Total TVA</span><span>{formatCurrency(totals.totalTVA)}</span></div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-orange-400"><span>Remise</span><span>-{formatCurrency(totals.discount)}</span></div>
        )}
        <Separator className="bg-white/10" />
        <div className="flex justify-between text-lg font-bold pt-1">
          <span>Total TTC</span>
          <span>{formatCurrency(totals.totalAfterDiscount)}</span>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Notes & Conditions</p>
          <p className="text-xs text-muted-foreground whitespace-pre-line">{quote.notes}</p>
        </div>
      )}

      <Separator className="bg-white/10" />

      {/* Payment - QR + IBAN */}
      <div className="flex justify-between items-end">
        <QRCodePayment
          iban={quote.iban}
          bic={quote.bic}
          beneficiary={quote.clientName || "Artisan"}
          amount={totals.totalAfterDiscount}
          reference={quote.reference}
        />
        <div className="text-right text-xs space-y-1">
          <p className="text-muted-foreground">Coordonnées bancaires</p>
          <p className="font-mono">{quote.iban}</p>
          <p className="font-mono text-muted-foreground">{quote.bic}</p>
        </div>
      </div>
    </GlassCard>
  );
}

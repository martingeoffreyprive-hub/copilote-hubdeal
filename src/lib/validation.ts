import { QuoteRow, AuditStatus } from "@/types/quote";

interface AuditResult {
  status: AuditStatus;
  message: string;
}

export function auditRow(row: QuoteRow): AuditResult {
  if (!row.designation.trim()) {
    return { status: "red", message: "Désignation manquante" };
  }
  if (row.quantity <= 0) {
    return { status: "red", message: "Quantité invalide" };
  }
  if (row.unitPrice <= 0) {
    return { status: "red", message: "Prix unitaire invalide" };
  }
  if (row.unitPrice < 1) {
    return { status: "orange", message: "Prix unitaire très bas" };
  }
  if (row.quantity > 10000) {
    return { status: "orange", message: "Quantité très élevée" };
  }
  if (row.totalHT > 100000) {
    return { status: "orange", message: "Montant ligne > 100k€" };
  }
  return { status: "green", message: "OK" };
}

export function auditAllRows(rows: QuoteRow[]): QuoteRow[] {
  return rows.map((row) => {
    const result = auditRow(row);
    return { ...row, auditStatus: result.status, auditMessage: result.message };
  });
}

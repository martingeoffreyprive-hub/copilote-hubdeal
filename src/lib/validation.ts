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
  if (row.unitPrice < 0) {
    return { status: "red", message: "Prix unitaire négatif" };
  }
  if (row.unitPrice === 0) {
    return { status: "orange", message: "Prix unitaire à 0€" };
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
  if (row.totalHT < 0) {
    return { status: "red", message: "Montant négatif" };
  }
  return { status: "green", message: "OK" };
}

export function auditAllRows(rows: QuoteRow[]): QuoteRow[] {
  return rows.map((row) => {
    const result = auditRow(row);
    return { ...row, auditStatus: result.status, auditMessage: result.message };
  });
}

/** Check for duplicate designations within the same section */
export function findDuplicateDesignations(rows: QuoteRow[]): string[] {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  for (const row of rows) {
    const key = `${row.sectionId}::${row.designation.toLowerCase().trim()}`;
    if (!row.designation.trim()) continue;
    const count = (seen.get(key) || 0) + 1;
    seen.set(key, count);
    if (count === 2) duplicates.push(row.designation);
  }
  return duplicates;
}

/** Validate discount: percent max 100, fixed max totalHT */
export function validateDiscount(value: number, type: "percent" | "fixed", totalHT: number): { valid: boolean; message: string } {
  if (value < 0) return { valid: false, message: "La remise ne peut pas être négative." };
  if (type === "percent" && value > 100) return { valid: false, message: "La remise ne peut pas dépasser 100%." };
  if (type === "fixed" && value > totalHT) return { valid: false, message: `La remise (${value}€) dépasse le total HTVA (${totalHT.toFixed(2)}€).` };
  return { valid: true, message: "" };
}

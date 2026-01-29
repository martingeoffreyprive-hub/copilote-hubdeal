export type Unit = "m²" | "m³" | "ml" | "pce" | "h" | "forfait" | "kg" | "l" | "jour";

export type TVARate = 0 | 6 | 12 | 21;

export type AuditStatus = "green" | "orange" | "red";

export interface QuoteRow {
  id: string;
  sectionId: string;
  designation: string;
  description: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  tvaRate: TVARate;
  totalHT: number;
  totalTTC: number;
  auditStatus: AuditStatus;
  auditMessage: string;
}

export interface QuoteSection {
  id: string;
  title: string;
  order: number;
}

export interface Quote {
  id: string;
  reference: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  projectDescription: string;
  sections: QuoteSection[];
  rows: QuoteRow[];
  globalDiscount: number;
  globalDiscountType: "percent" | "fixed";
  iban: string;
  bic: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "sent" | "accepted" | "rejected";
}

export interface TVABreakdown {
  rate: TVARate;
  baseHT: number;
  tvaAmount: number;
  totalTTC: number;
}

export interface QuoteTotals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  discount: number;
  totalAfterDiscount: number;
  tvaBreakdown: TVABreakdown[];
}

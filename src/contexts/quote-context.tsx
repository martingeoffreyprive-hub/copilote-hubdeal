"use client";

import React, { createContext, useContext, useReducer, useCallback, useMemo } from "react";
import { Quote, QuoteRow, QuoteSection, TVARate, Unit, QuoteTotals } from "@/types/quote";
import { calcRowTotalHT, calcRowTotalTTC, calcQuoteTotals } from "@/lib/calculations";
import { auditRow } from "@/lib/validation";
import { v4 as uuid } from "uuid";

type Action =
  | { type: "SET_QUOTE"; payload: Quote }
  | { type: "ADD_ROW"; payload: { sectionId: string } }
  | { type: "UPDATE_ROW"; payload: { id: string; field: string; value: unknown } }
  | { type: "DELETE_ROW"; payload: string }
  | { type: "DUPLICATE_ROW"; payload: string }
  | { type: "MOVE_ROW"; payload: { id: string; direction: "up" | "down" } }
  | { type: "ADD_SECTION"; payload?: { title: string } }
  | { type: "UPDATE_SECTION"; payload: { id: string; title: string } }
  | { type: "DELETE_SECTION"; payload: string }
  | { type: "SET_DISCOUNT"; payload: { value: number; type: "percent" | "fixed" } }
  | { type: "UPDATE_FIELD"; payload: { field: string; value: string } }
  | { type: "ADD_ROW_WITH_DATA"; payload: { sectionId: string; designation: string; description: string; quantity: number; unit: string; unitPrice: number; tvaRate: number } };

function createEmptyRow(sectionId: string): QuoteRow {
  return {
    id: uuid(),
    sectionId,
    designation: "",
    description: "",
    quantity: 1,
    unit: "pce" as Unit,
    unitPrice: 0,
    tvaRate: 21 as TVARate,
    totalHT: 0,
    totalTTC: 0,
    auditStatus: "orange",
    auditMessage: "Prix unitaire invalide",
  };
}

function recalcRow(row: QuoteRow): QuoteRow {
  const totalHT = calcRowTotalHT(row.quantity, row.unitPrice);
  const totalTTC = calcRowTotalTTC(totalHT, row.tvaRate);
  const updated = { ...row, totalHT, totalTTC };
  const audit = auditRow(updated);
  return { ...updated, auditStatus: audit.status, auditMessage: audit.message };
}

function createDefaultQuote(): Quote {
  const sectionId = uuid();
  return {
    id: uuid(),
    reference: `DEV-${Date.now().toString(36).toUpperCase()}`,
    clientName: "",
    clientAddress: "",
    clientEmail: "",
    clientPhone: "",
    projectDescription: "",
    sections: [{ id: sectionId, title: "Section 1", order: 0 }],
    rows: [createEmptyRow(sectionId)],
    globalDiscount: 0,
    globalDiscountType: "percent",
    iban: "BE68 5390 0754 7034",
    bic: "TRIOBEBB",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
  };
}

function quoteReducer(state: Quote, action: Action): Quote {
  const updated = { ...state, updatedAt: new Date().toISOString() };

  switch (action.type) {
    case "SET_QUOTE":
      return action.payload;

    case "ADD_ROW": {
      const newRow = createEmptyRow(action.payload.sectionId);
      return { ...updated, rows: [...updated.rows, newRow] };
    }

    case "UPDATE_ROW": {
      const { id, field, value } = action.payload;
      const rows = updated.rows.map((r) => {
        if (r.id !== id) return r;
        const changed = { ...r, [field]: value };
        return recalcRow(changed);
      });
      return { ...updated, rows };
    }

    case "DELETE_ROW":
      return { ...updated, rows: updated.rows.filter((r) => r.id !== action.payload) };

    case "DUPLICATE_ROW": {
      const source = updated.rows.find((r) => r.id === action.payload);
      if (!source) return state;
      const idx = updated.rows.indexOf(source);
      const dup = { ...source, id: uuid() };
      const rows = [...updated.rows];
      rows.splice(idx + 1, 0, dup);
      return { ...updated, rows };
    }

    case "MOVE_ROW": {
      const { id, direction } = action.payload;
      const rows = [...updated.rows];
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return state;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= rows.length) return state;
      [rows[idx], rows[swapIdx]] = [rows[swapIdx], rows[idx]];
      return { ...updated, rows };
    }

    case "ADD_SECTION": {
      const newSection: QuoteSection = {
        id: uuid(),
        title: action.payload?.title || `Section ${updated.sections.length + 1}`,
        order: updated.sections.length,
      };
      return { ...updated, sections: [...updated.sections, newSection] };
    }

    case "UPDATE_SECTION": {
      const sections = updated.sections.map((s) =>
        s.id === action.payload.id ? { ...s, title: action.payload.title } : s
      );
      return { ...updated, sections };
    }

    case "DELETE_SECTION": {
      const sections = updated.sections.filter((s) => s.id !== action.payload);
      const rows = updated.rows.filter((r) => r.sectionId !== action.payload);
      return { ...updated, sections, rows };
    }

    case "SET_DISCOUNT":
      return { ...updated, globalDiscount: action.payload.value, globalDiscountType: action.payload.type };

    case "UPDATE_FIELD":
      return { ...updated, [action.payload.field]: action.payload.value };

    case "ADD_ROW_WITH_DATA": {
      const { sectionId, designation, description, quantity, unit, unitPrice, tvaRate } = action.payload;
      const row: QuoteRow = {
        id: uuid(),
        sectionId,
        designation,
        description,
        quantity,
        unit: unit as Unit,
        unitPrice,
        tvaRate: tvaRate as TVARate,
        totalHT: 0,
        totalTTC: 0,
        auditStatus: "green",
        auditMessage: "OK",
      };
      return { ...updated, rows: [...updated.rows, recalcRow(row)] };
    }

    default:
      return state;
  }
}

interface QuoteContextValue {
  quote: Quote;
  totals: QuoteTotals;
  dispatch: React.Dispatch<Action>;
  addRow: (sectionId: string) => void;
  updateRow: (id: string, field: string, value: unknown) => void;
  deleteRow: (id: string) => void;
  duplicateRow: (id: string) => void;
  moveRow: (id: string, direction: "up" | "down") => void;
  addSection: (title?: string) => void;
  updateSection: (id: string, title: string) => void;
  deleteSection: (id: string) => void;
}

const QuoteContext = createContext<QuoteContextValue | null>(null);

export function QuoteProvider({ children, initialQuote }: { children: React.ReactNode; initialQuote?: Quote }) {
  const [quote, dispatch] = useReducer(quoteReducer, initialQuote || createDefaultQuote());

  const totals = useMemo(
    () => calcQuoteTotals(quote.rows, quote.globalDiscount, quote.globalDiscountType),
    [quote.rows, quote.globalDiscount, quote.globalDiscountType]
  );

  const addRow = useCallback((sectionId: string) => dispatch({ type: "ADD_ROW", payload: { sectionId } }), []);
  const updateRow = useCallback((id: string, field: string, value: unknown) => dispatch({ type: "UPDATE_ROW", payload: { id, field, value } }), []);
  const deleteRow = useCallback((id: string) => dispatch({ type: "DELETE_ROW", payload: id }), []);
  const duplicateRow = useCallback((id: string) => dispatch({ type: "DUPLICATE_ROW", payload: id }), []);
  const moveRow = useCallback((id: string, direction: "up" | "down") => dispatch({ type: "MOVE_ROW", payload: { id, direction } }), []);
  const addSection = useCallback((title?: string) => dispatch({ type: "ADD_SECTION", payload: title ? { title } : undefined }), []);
  const updateSection = useCallback((id: string, title: string) => dispatch({ type: "UPDATE_SECTION", payload: { id, title } }), []);
  const deleteSection = useCallback((id: string) => dispatch({ type: "DELETE_SECTION", payload: id }), []);

  return (
    <QuoteContext.Provider value={{ quote, totals, dispatch, addRow, updateRow, deleteRow, duplicateRow, moveRow, addSection, updateSection, deleteSection }}>
      {children}
    </QuoteContext.Provider>
  );
}

export function useQuoteContext() {
  const ctx = useContext(QuoteContext);
  if (!ctx) throw new Error("useQuoteContext must be used within QuoteProvider");
  return ctx;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { Quote } from "@/types/quote";

const STORAGE_KEY = "hubdeal-quotes";

function loadQuotes(): Quote[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Quote[]) : [];
  } catch {
    return [];
  }
}

function persistQuotes(quotes: Quote[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

export function useQuoteStorage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    setQuotes(loadQuotes());
  }, []);

  const saveQuote = useCallback((quote: Quote) => {
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === quote.id);
      const next = idx >= 0 ? prev.map((q, i) => (i === idx ? quote : q)) : [...prev, quote];
      persistQuotes(next);
      return next;
    });
  }, []);

  const deleteQuote = useCallback((id: string) => {
    setQuotes((prev) => {
      const next = prev.filter((q) => q.id !== id);
      persistQuotes(next);
      return next;
    });
  }, []);

  const getQuoteById = useCallback((id: string): Quote | undefined => {
    return loadQuotes().find((q) => q.id === id);
  }, []);

  return { quotes, saveQuote, deleteQuote, getQuoteById };
}

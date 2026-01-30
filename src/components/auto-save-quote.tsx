"use client";

import { useEffect } from "react";
import { useQuoteContext } from "@/contexts/quote-context";
import { useQuoteStorage } from "@/hooks/use-quote-storage";

export function AutoSaveQuote() {
  const { quote } = useQuoteContext();
  const { saveQuote } = useQuoteStorage();

  useEffect(() => {
    saveQuote(quote);
  }, [quote, saveQuote]);

  return null;
}

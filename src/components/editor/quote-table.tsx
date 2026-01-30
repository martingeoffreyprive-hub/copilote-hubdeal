"use client";

import React from "react";
import { useQuoteContext } from "@/contexts/quote-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GlassCard } from "@/components/ui/glass-card";
import { TableToolbar } from "./table-toolbar";
import { SectionRow } from "./section-row";
import { TableRow } from "./table-row";
import { TableFooter } from "./table-footer";

export function QuoteTable() {
  const { quote } = useQuoteContext();

  return (
    <GlassCard className="flex flex-col h-full overflow-hidden">
      <TableToolbar />
      <ScrollArea className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-muted-foreground uppercase tracking-wider">
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left">Désignation</th>
              <th className="p-2 w-20 text-right">Qté</th>
              <th className="p-2 w-24 text-left">Unité</th>
              <th className="p-2 w-24 text-right">PU</th>
              <th className="p-2 w-20 text-left">TVA</th>
              <th className="p-2 w-28 text-right">Total HT</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {quote.sections.map((section) => {
              const sectionRows = quote.rows.filter((r) => r.sectionId === section.id);
              return (
                <React.Fragment key={section.id}>
                  <SectionRow section={section} />
                  {sectionRows.map((row) => (
                    <TableRow key={row.id} row={row} />
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>
      <TableFooter />
    </GlassCard>
  );
}

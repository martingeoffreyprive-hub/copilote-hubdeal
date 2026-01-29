"use client";

import { QuoteRow } from "@/types/quote";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { UNIT_OPTIONS, TVA_RATES } from "@/lib/constants";
import { formatCurrency } from "@/lib/calculations";
import { AuditIndicator } from "./audit-indicator";
import { useQuoteContext } from "@/contexts/quote-context";

export function TableRow({ row }: { row: QuoteRow }) {
  const { updateRow, deleteRow, duplicateRow, moveRow } = useQuoteContext();

  return (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
      <td className="p-1.5 w-8">
        <AuditIndicator status={row.auditStatus} message={row.auditMessage} />
      </td>
      <td className="p-1.5">
        <Input
          value={row.designation}
          onChange={(e) => updateRow(row.id, "designation", e.target.value)}
          placeholder="Désignation"
          className="h-8 border-white/10 bg-transparent text-sm"
        />
      </td>
      <td className="p-1.5 w-20">
        <Input
          type="number"
          value={row.quantity}
          onChange={(e) => updateRow(row.id, "quantity", parseFloat(e.target.value) || 0)}
          className="h-8 border-white/10 bg-transparent text-sm text-right"
        />
      </td>
      <td className="p-1.5 w-24">
        <Select value={row.unit} onValueChange={(v) => updateRow(row.id, "unit", v)}>
          <SelectTrigger className="h-8 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-1.5 w-24">
        <Input
          type="number"
          value={row.unitPrice}
          onChange={(e) => updateRow(row.id, "unitPrice", parseFloat(e.target.value) || 0)}
          className="h-8 border-white/10 bg-transparent text-sm text-right"
        />
      </td>
      <td className="p-1.5 w-20">
        <Select value={String(row.tvaRate)} onValueChange={(v) => updateRow(row.id, "tvaRate", parseInt(v))}>
          <SelectTrigger className="h-8 border-white/10 bg-transparent text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TVA_RATES.map((t) => (
              <SelectItem key={t.value} value={String(t.value)}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="p-1.5 w-28 text-right text-sm font-medium">
        {formatCurrency(row.totalHT)}
      </td>
      <td className="p-1.5 w-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => duplicateRow(row.id)}>
              <Copy className="mr-2 h-3.5 w-3.5" /> Dupliquer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => moveRow(row.id, "up")}>
              <ArrowUp className="mr-2 h-3.5 w-3.5" /> Monter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => moveRow(row.id, "down")}>
              <ArrowDown className="mr-2 h-3.5 w-3.5" /> Descendre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => deleteRow(row.id)} className="text-red-400">
              <Trash2 className="mr-2 h-3.5 w-3.5" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

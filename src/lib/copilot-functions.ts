/**
 * Copilot function calling handlers.
 * Maps OpenAI function calls to quote dispatch actions.
 */
import { v4 as uuid } from "uuid";
import { QuoteRow, Unit, TVARate } from "@/types/quote";
import { calcRowTotalHT, calcRowTotalTTC } from "./calculations";
import { auditRow } from "./validation";

interface FunctionCallArgs {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function handleCopilotFunction(
  name: string,
  args: FunctionCallArgs,
  dispatch: React.Dispatch<{ type: string; payload: unknown }>
): string {
  switch (name) {
    case "addRow": {
      const sectionId = args.sectionId || "";
      const row: QuoteRow = {
        id: uuid(),
        sectionId,
        designation: args.designation || "",
        description: args.description || "",
        quantity: args.quantity || 1,
        unit: (args.unit || "pce") as Unit,
        unitPrice: args.unitPrice || 0,
        tvaRate: (args.tvaRate || 21) as TVARate,
        totalHT: 0,
        totalTTC: 0,
        auditStatus: "green",
        auditMessage: "OK",
      };
      row.totalHT = calcRowTotalHT(row.quantity, row.unitPrice);
      row.totalTTC = calcRowTotalTTC(row.totalHT, row.tvaRate);
      const audit = auditRow(row);
      row.auditStatus = audit.status;
      row.auditMessage = audit.message;

      dispatch({ type: "ADD_ROW", payload: { sectionId } });
      return `Ligne "${row.designation}" ajoutée: ${row.quantity} ${row.unit} x ${row.unitPrice}€ = ${row.totalHT}€ HT`;
    }

    case "updateRow": {
      dispatch({ type: "UPDATE_ROW", payload: { id: args.rowId, field: args.field, value: args.value } });
      return `Ligne mise à jour: ${args.field} = ${args.value}`;
    }

    case "deleteRow": {
      dispatch({ type: "DELETE_ROW", payload: args.rowId });
      return "Ligne supprimée";
    }

    default:
      return `Fonction inconnue: ${name}`;
  }
}

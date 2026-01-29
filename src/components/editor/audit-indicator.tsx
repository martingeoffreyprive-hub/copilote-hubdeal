"use client";

import { AuditStatus } from "@/types/quote";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const colors: Record<AuditStatus, string> = {
  green: "bg-emerald-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

export function AuditIndicator({ status, message }: { status: AuditStatus; message: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-block h-3 w-3 rounded-full ${colors[status]}`} />
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

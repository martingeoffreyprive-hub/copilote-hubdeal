"use client";

import QRCode from "react-qr-code";
import { generateEPCQRData } from "@/lib/iban-qr";

interface QRCodePaymentProps {
  iban: string;
  bic: string;
  beneficiary: string;
  amount: number;
  reference: string;
}

export function QRCodePayment({ iban, bic, beneficiary, amount, reference }: QRCodePaymentProps) {
  const data = generateEPCQRData({ iban, bic, beneficiary, amount, reference });

  return (
    <div className="flex flex-col items-center gap-2">
      <QRCode value={data} size={120} bgColor="transparent" fgColor="white" level="M" />
      <p className="text-xs text-muted-foreground">Scanner pour payer</p>
    </div>
  );
}

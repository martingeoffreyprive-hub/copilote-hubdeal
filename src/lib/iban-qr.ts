/**
 * Generate EPC QR Code data string for Belgian IBAN payments.
 * Format: EPC069-12 (European Payments Council Quick Response Code)
 */
export function generateEPCQRData({
  iban,
  bic,
  beneficiary,
  amount,
  reference,
}: {
  iban: string;
  bic: string;
  beneficiary: string;
  amount: number;
  reference: string;
}): string {
  const cleanIBAN = iban.replace(/\s/g, "");
  const lines = [
    "BCD",           // Service Tag
    "002",           // Version
    "1",             // Character set (UTF-8)
    "SCT",           // Identification
    bic,             // BIC
    beneficiary,     // Beneficiary name
    cleanIBAN,       // IBAN
    `EUR${amount.toFixed(2)}`, // Amount
    "",              // Purpose
    reference,       // Remittance reference
    "",              // Remittance text
    "",              // Information
  ];
  return lines.join("\n");
}

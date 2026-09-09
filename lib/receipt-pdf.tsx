import { pdf } from "@react-pdf/renderer";
import { ReceiptPDF } from "@/components/pos/receipt-pdf";
import type { Transaction } from "@/lib/types";

export async function generateReceiptUrl(
  transaction: Transaction,
  storeName: string,
  storeInfo: string,
): Promise<string> {
  const blob = await pdf(
    <ReceiptPDF
      transaction={transaction}
      storeName={storeName}
      storeInfo={storeInfo}
    />,
  ).toBlob();
  return URL.createObjectURL(blob);
}

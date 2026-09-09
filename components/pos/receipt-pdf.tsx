import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { orderTypeLabels, paymentMethodLabels } from "@/lib/dummy-data";
import type { Transaction } from "@/lib/types";

const styles = StyleSheet.create({
  page: {
    padding: 24,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
  },
  center: { textAlign: "center" },
  storeName: { fontSize: 13, fontWeight: "bold" },
  storeInfo: { fontSize: 9, color: "#475569", marginTop: 2 },
  dashed: {
    borderBottomWidth: 1,
    borderBottomStyle: "dashed",
    borderBottomColor: "#94a3b8",
    marginVertical: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowText: { fontSize: 9, color: "#475569" },
  rowValue: { fontSize: 9, fontWeight: "bold" },
  itemName: { fontSize: 9, fontWeight: "bold" },
  itemDetail: { fontSize: 8, color: "#64748b", marginTop: 1 },
  subtotalText: { fontSize: 9, color: "#475569" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  totalLabel: { fontSize: 10, fontWeight: "bold" },
  totalValue: { fontSize: 10, fontWeight: "bold" },
  footer: { fontSize: 8, color: "#64748b", textAlign: "center", marginTop: 16 },
});

export function ReceiptPDF({
  transaction,
  storeName,
  storeInfo,
}: {
  transaction: Transaction;
  storeName: string;
  storeInfo: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.storeInfo}>{storeInfo}</Text>
        </View>
        <View style={styles.dashed} />
        <View style={styles.row}>
          <Text style={styles.rowText}>No. Struk</Text>
          <Text style={styles.rowValue}>{transaction.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Tanggal</Text>
          <Text style={styles.rowValue}>{formatDateTime(transaction.createdAt)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Kasir</Text>
          <Text style={styles.rowValue}>{transaction.cashier}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>Tipe Order</Text>
          <Text style={styles.rowValue}>{orderTypeLabels[transaction.orderType]}</Text>
        </View>
        <View style={styles.dashed} />
        {transaction.items.map((it, i) => (
          <View key={i} style={{ marginBottom: 4 }}>
            <Text style={styles.itemName}>{it.productName}</Text>
            {it.options.length > 0 ? (
              <Text style={styles.itemDetail}>
                {it.options.map((o) => o.optionName).join(", ")}
              </Text>
            ) : null}
            <View style={styles.row}>
              <Text style={styles.itemDetail}>
                {it.quantity} × {formatRupiah(it.unitPrice)}
              </Text>
              <Text style={styles.rowValue}>{formatRupiah(it.subtotal)}</Text>
            </View>
          </View>
        ))}
        <View style={styles.dashed} />
        <View style={styles.row}>
          <Text style={styles.subtotalText}>Subtotal</Text>
          <Text style={styles.rowValue}>{formatRupiah(transaction.subtotal)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.subtotalText}>Pajak</Text>
          <Text style={styles.rowValue}>{formatRupiah(transaction.taxAmount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatRupiah(transaction.total)}</Text>
        </View>
        <View style={styles.dashed} />
        <View style={styles.row}>
          <Text style={styles.rowText}>Pembayaran</Text>
          <Text style={styles.rowValue}>{paymentMethodLabels[transaction.payment.method]}</Text>
        </View>
        {transaction.payment.method === "CASH" ? (
          <>
            <View style={styles.row}>
              <Text style={styles.rowText}>Uang Diterima</Text>
              <Text style={styles.rowValue}>{formatRupiah(transaction.payment.amountPaid)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowText}>Kembalian</Text>
              <Text style={styles.rowValue}>{formatRupiah(transaction.payment.change)}</Text>
            </View>
          </>
        ) : null}
        {transaction.payment.method === "BANK_TRANSFER" ? (
          <View style={styles.row}>
            <Text style={styles.rowText}>Bank</Text>
            <Text style={styles.rowValue}>{transaction.payment.bankName}</Text>
          </View>
        ) : null}
        <Text style={styles.footer}>Terima kasih atas kunjungan Anda.</Text>
      </Page>
    </Document>
  );
}

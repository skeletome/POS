import type { ProductDiscount, Voucher } from "@/lib/types";

export interface PricingItem {
  id: string;
  productId: string;
  unitPrice: number;
  quantity: number;
}

export interface PricingResult {
  baseSubtotal: number;
  productDiscount: number;
  voucherDiscount: number;
  totalDiscount: number;
  taxable: number;
  taxAmount: number;
  total: number;
  itemDiscounts: Record<string, number>;
}

export function todayIso(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function isDiscountActive(d: ProductDiscount, today?: string): boolean {
  if (!d.active) return false;
  const t = today ?? todayIso();
  if (d.startDate && t < d.startDate) return false;
  if (d.endDate && t > d.endDate) return false;
  return true;
}

export function lineDiscountAmount(d: ProductDiscount, lineSubtotal: number): number {
  if (d.discountType === "PERCENT") {
    return Math.round((lineSubtotal * d.discountValue) / 100);
  }
  return Math.min(d.discountValue, lineSubtotal);
}

export function discountedUnitPrice(unitPrice: number, d: ProductDiscount): number {
  if (d.discountType === "PERCENT") {
    return Math.max(unitPrice - Math.round((unitPrice * d.discountValue) / 100), 0);
  }
  return Math.max(unitPrice - d.discountValue, 0);
}

export function totalItemDiscount(
  productId: string,
  lineSubtotal: number,
  discounts: ProductDiscount[],
  today?: string,
): number {
  let best = 0;
  for (const d of discounts) {
    if (!isDiscountActive(d, today)) continue;
    if (!d.productIds.includes(productId)) continue;
    const amount = lineDiscountAmount(d, lineSubtotal);
    if (amount > best) best = amount;
  }
  return best;
}

export function bestProductDiscount(
  productId: string,
  unitPrice: number,
  discounts: ProductDiscount[],
  today?: string,
): ProductDiscount | null {
  let best: ProductDiscount | null = null;
  let bestPrice = unitPrice;
  for (const d of discounts) {
    if (!isDiscountActive(d, today)) continue;
    if (!d.productIds.includes(productId)) continue;
    const price = discountedUnitPrice(unitPrice, d);
    if (price < bestPrice) {
      bestPrice = price;
      best = d;
    }
  }
  return best;
}

export function computePricing(
  items: PricingItem[],
  discounts: ProductDiscount[],
  voucher: Voucher | null,
  taxRate: number,
  today?: string,
): PricingResult {
  let baseSubtotal = 0;
  let productDiscount = 0;
  const itemDiscounts: Record<string, number> = {};
  for (const it of items) {
    const line = it.unitPrice * it.quantity;
    baseSubtotal += line;
    const amount = totalItemDiscount(it.productId, line, discounts, today);
    itemDiscounts[it.id] = amount;
    productDiscount += amount;
  }

  let voucherDiscount = 0;
  if (voucher) {
    if (voucher.discountType === "PERCENT") {
      voucherDiscount = Math.round((baseSubtotal * voucher.discountValue) / 100);
      if (voucher.maxDiscount) voucherDiscount = Math.min(voucherDiscount, voucher.maxDiscount);
    } else {
      voucherDiscount = Math.min(voucher.discountValue, baseSubtotal);
    }
  }

  const totalDiscount = productDiscount + voucherDiscount;
  const taxable = Math.max(baseSubtotal - totalDiscount, 0);
  const taxAmount = Math.round(taxable * taxRate);
  const total = taxable + taxAmount;

  return { baseSubtotal, productDiscount, voucherDiscount, totalDiscount, taxable, taxAmount, total, itemDiscounts };
}

export function validateVoucher(v: Voucher, baseSubtotal: number, today?: string): string | null {
  const t = today ?? todayIso();
  if (!v.active) return "Voucher tidak aktif";
  if (v.validFrom && t < v.validFrom) return "Voucher belum berlaku";
  if (v.validUntil && t > v.validUntil) return "Voucher sudah kedaluwarsa";
  if (v.usageLimit != null && v.usedCount >= v.usageLimit) return "Voucher sudah habis dipakai";
  if (v.minSubtotal != null && baseSubtotal < v.minSubtotal) {
    return "Belum mencapai minimum pembelian untuk voucher ini";
  }
  return null;
}
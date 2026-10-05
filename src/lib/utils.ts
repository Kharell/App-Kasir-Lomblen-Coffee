import type { CartTotals, MenuCategory } from "@/types";

/** Format Rupiah tanpa desimal: 15000 -> "Rp15.000" */
export function formatIDR(value: number): string {
  return `Rp${Math.round(value).toLocaleString("id-ID")}`;
}

/** Format tanggal Indonesia untuk struk & laporan. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export const TAX_RATE = 0.1; // 10% PPN
export const SERVICE_CHARGE_RATE = 0.05; // 5% service charge kedai
export const DISCOUNT_RATE = 0.05; // diskon member 5%

/**
 * Satu-satunya sumber perhitungan total.
 * Dipakai identik di client (pratinjau) dan server (penyimpanan),
 * supaya total di struk tidak pernah meleset.
 */
export function calculateTotals(
  subtotal: number,
  options: { discountRate?: number } = {}
): CartTotals {
  const safeSubtotal = Math.max(0, Math.round(subtotal));
  const discount = Math.round(safeSubtotal * (options.discountRate ?? 0));
  const taxable = safeSubtotal - discount;
  const tax = Math.round(taxable * TAX_RATE);
  const serviceCharge = Math.round(taxable * SERVICE_CHARGE_RATE);
  return {
    subtotal: safeSubtotal,
    discount,
    tax,
    serviceCharge,
    total: safeSubtotal - discount + tax + serviceCharge,
  };
}

/** Nomor invoice harian: INV-20260101-0007 */
export function generateInvoiceNo(date: Date, sequence: number): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-${String(sequence).padStart(4, "0")}`;
}

/** Pecahan uang tunai yang camouflage-friendly untuk koin Rp500/200/100. */
export function suggestCashAmounts(total: number): number[] {
  const suggestions = new Set<number>([total]);
  const steps = [1000, 5000, 10000, 20000, 50000, 100000];
  for (const step of steps) {
    const rounded = Math.ceil(total / step) * step;
    if (rounded >= total) suggestions.add(rounded);
  }
  return [...suggestions].sort((a, b) => a - b).slice(0, 6);
}

export const CATEGORY_ICON: Record<MenuCategory, string> = {
  kopi: "☕",
  "non-kopi": "🍵",
  ringan: "🥐",
  berat: "🍚",
};

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
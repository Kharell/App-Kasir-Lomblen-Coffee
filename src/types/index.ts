/**
 * Definisi domain global aplikasi Lomblen Cofe.
 * Dipakai bersama oleh client component, server component, dan API route.
 */

/** 4 level akses operasional kedai kopi. */
export type Role = "cashier" | "manager" | "admin" | "waiter";

export const ROLES: Role[] = ["cashier", "manager", "admin", "waiter"];

export const ROLE_LABEL: Record<Role, string> = {
  cashier: "Kasir",
  manager: "Manajer",
  admin: "Admin",
  waiter: "Pelayan",
};

/** Kapabilitas tiap role — sumber kebenaran tunggal untuk otorisasi. */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Input pesanan + proses pembayaran + cetak struk
  cashier: ["order:create", "payment:process", "receipt:print"],
  // Operasional + void + laporan shift
  manager: [
    "order:create",
    "payment:process",
    "receipt:print",
    "order:void",
    "report:view",
    "shift:close",
  ],
  // Akses penuh
  admin: [
    "order:create",
    "payment:process",
    "receipt:print",
    "order:void",
    "report:view",
    "shift:close",
    "menu:manage",
    "user:manage",
    "finance:view",
  ],
  // Hanya input pesanan meja, tanpa pembayaran
  waiter: ["order:create"],
};

export type Permission =
  | "order:create"
  | "order:void"
  | "payment:process"
  | "receipt:print"
  | "report:view"
  | "finance:view"
  | "shift:close"
  | "menu:manage"
  | "user:manage";

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  shiftId?: string;
}

export type MenuCategory = "kopi" | "non-kopi" | "ringan" | "berat";

export const CATEGORY_LABEL: Record<MenuCategory, string> = {
  kopi: "Kopi",
  "non-kopi": "Non-Kopi",
  ringan: "Makanan Ringan",
  berat: "Makanan Berat",
};

export interface MenuItem {
  _id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description?: string;
  imageUrl?: string;
  isAvailable: boolean;
  preparationMinutes?: number;
}

export interface CartLine {
  menuId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

export interface CartTotals {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

export type PaymentMethod = "cash" | "qris" | "ewallet" | "va";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Tunai",
  qris: "QRIS",
  ewallet: "E-Wallet",
  va: "Virtual Account",
};

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type OrderStatus = "open" | "paid" | "void";

export interface Transaction {
  _id: string;
  invoiceNo: string;
  customerName?: string;
  tableNo?: string;
  lines: CartLine[];
  totals: CartTotals;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  paidAmount?: number;
  changeAmount?: number;
  cashierId: string;
  cashierName: string;
  note?: string;
  createdAt: string;
  paidAt?: string;
}

export interface CartSummary {
  itemCount: number;
  totalQty: number;
  totals: CartTotals;
}

export interface ReportSummary {
  date: string;
  transactionCount: number;
  grossRevenue: number;
  discountTotal: number;
  netRevenue: number;
  averageTicket: number;
  voidCount: number;
  byMethod: Record<PaymentMethod, { count: number; total: number }>;
  topItems: { name: string; qty: number; revenue: number }[];
}

export interface ApiError {
  error: string;
  details?: Record<string, string>;
}
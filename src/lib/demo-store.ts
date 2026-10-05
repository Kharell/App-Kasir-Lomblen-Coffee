import { randomUUID } from "node:crypto";
import { SEED_MENU, SEED_USERS } from "@/lib/seed-data";
import { calculateTotals, generateInvoiceNo } from "@/lib/utils";
import type { CartLine, MenuItem, ReportSummary, Role, Transaction } from "@/types";

/**
 * Store in-memory untuk mode demo (tanpa MongoDB).
 *
 * Catatan penting: di mode dev Next.js melakukan hot-reload modul, sehingga
 * instance modul bisa ter-reset. Data disimpan di `globalThis` agar
 * tetap bertahan selama server hidup (cukup untuk demo & preview).
 */
/** Akun pada store demo (password plaintext murni untuk keperluan demo lokal). */
export interface DemoUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  password: string;
  isActive: boolean;
}

interface DemoStore {
  users: DemoUser[];
  menu: MenuItem[];
  transactions: Transaction[];
}

const g = globalThis as unknown as { __lomblenDemoStore?: DemoStore };

function createStore(): DemoStore {
  return {
    users: SEED_USERS.map((u) => ({ ...u, id: randomUUID(), isActive: true })),
    menu: SEED_MENU.map((m, i) => ({ ...m, _id: `menu-${i + 1}` })),
    transactions: [],
  };
}

export function getDemoStore(): DemoStore {
  if (!g.__lomblenDemoStore) g.__lomblenDemoStore = createStore();
  return g.__lomblenDemoStore;
}

/** Bangun ringkasan laporan dari daftar transaksi (dipakai mode demo). */
export function buildReport(transactions: Transaction[], dateKey: string): ReportSummary {
  const dayTx = transactions.filter(
    (t) => t.status !== "void" && new Date(t.createdAt).toDateString() === dateKey
  );
  const voidTx = transactions.filter(
    (t) => t.status === "void" && new Date(t.createdAt).toDateString() === dateKey
  );

  const byMethod = { cash: { count: 0, total: 0 }, qris: { count: 0, total: 0 }, ewallet: { count: 0, total: 0 }, va: { count: 0, total: 0 } };
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();

  for (const t of dayTx) {
    byMethod[t.paymentMethod].count += 1;
    byMethod[t.paymentMethod].total += t.totals.total;
    for (const line of t.lines) {
      const prev = itemMap.get(line.name) ?? { name: line.name, qty: 0, revenue: 0 };
      prev.qty += line.qty;
      prev.revenue += line.qty * line.price;
      itemMap.set(line.name, prev);
    }
  }

  const grossRevenue = dayTx.reduce((s, t) => s + t.totals.subtotal, 0);
  const discountTotal = dayTx.reduce((s, t) => s + t.totals.discount, 0);
  const netRevenue = dayTx.reduce((s, t) => s + t.totals.total, 0);

  return {
    date: new Date().toDateString(),
    transactionCount: dayTx.length,
    grossRevenue,
    discountTotal,
    netRevenue,
    averageTicket: dayTx.length ? Math.round(netRevenue / dayTx.length) : 0,
    voidCount: voidTx.length,
    byMethod,
    topItems: [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 8),
  };
}

export function nextInvoiceNo(transactions: Transaction[]): string {
  const today = new Date().toDateString();
  const todayCount = transactions.filter(
    (t) => new Date(t.createdAt).toDateString() === today
  ).length;
  return generateInvoiceNo(new Date(), todayCount + 1);
}

export { calculateTotals, SEED_MENU, SEED_USERS };
export type { CartLine };
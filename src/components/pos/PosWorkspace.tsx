"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CartPanel } from "@/components/pos/CartPanel";
import { CategoryTabs } from "@/components/pos/CategoryTabs";
import { MenuCard } from "@/components/pos/MenuCard";
import { PaymentModal } from "@/components/pos/PaymentModal";
import { ReceiptModal } from "@/components/pos/ReceiptModal";
import { Button } from "@/components/ui/Button";
import { calculateTotals, formatIDR } from "@/lib/utils";
import {
  hasPermission,
  ROLE_LABEL,
  type CartLine,
  type MenuCategory,
  type MenuItem,
  type PaymentMethod,
  type SessionUser,
  type Transaction,
} from "@/types";

/**
 * Workspace POS (perasaan Single Page Application).
 * Semua interaksi di client tanpa reload halaman:
 * - Tablet/Desktop: dua kolom, keranjang sticky di kanan
 * - Mobile: grid penuh + keranjang sebagai bottom sheet
 */
export function PosWorkspace({ user }: { user: SessionUser }) {
  const router = useRouter();

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState("");

  const [category, setCategory] = useState<MenuCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [receipt, setReceipt] = useState<Transaction | null>(null);

  const canPay = hasPermission(user.role, "payment:process");

  // Ambil katalog menu sekali saat halaman dimuat.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/menu?available=true", { cache: "no-store" });
        if (!res.ok) throw new Error("Gagal memuat menu.");
        const data = await res.json();
        if (!cancelled) setMenu(data.items as MenuItem[]);
      } catch (err) {
        if (!cancelled)
          setMenuError(err instanceof Error ? err.message : "Gagal memuat menu.");
      } finally {
        if (!cancelled) setLoadingMenu(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addItem = useCallback((item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((l) => l.menuId === item._id);
      if (found) {
        return prev.map((l) =>
          l.menuId === item._id ? { ...l, qty: Math.min(99, l.qty + 1) } : l
        );
      }
      return [...prev, { menuId: item._id, name: item.name, price: item.price, qty: 1 }];
    });
  }, []);

  const changeQty = useCallback((menuId: string, qty: number) => {
    setCart((prev) =>
      qty <= 0
        ? prev.filter((l) => l.menuId !== menuId)
        : prev.map((l) => (l.menuId === menuId ? { ...l, qty: Math.min(99, qty) } : l))
    );
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return menu.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [menu, category, search]);

  const counts = useMemo(() => {
    const base: Record<string, number> = { all: menu.length };
    for (const m of menu) base[m.category] = (base[m.category] ?? 0) + 1;
    return base;
  }, [menu]);

  const cartQty = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);
  const totals = useMemo(
    () => calculateTotals(cart.reduce((s, l) => s + l.price * l.qty, 0)),
    [cart]
  );

  async function handleConfirmPayment(input: {
    paymentMethod: PaymentMethod;
    paidAmount?: number;
    customerName?: string;
    tableNo?: string;
    discountRate?: number;
  }) {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: cart, ...input }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Pembayaran gagal.");

    setReceipt(data.transaction as Transaction);
    setCart([]);
    setSheetOpen(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const cartProps = {
    lines: cart,
    totals,
    totalQty: cartQty,
    onQtyChange: changeQty,
    onClear: () => setCart([]),
    onCheckout: () => (canPay ? setPayOpen(true) : setSheetOpen(true)),
    canPay,
    reason: canPay
      ? undefined
      : `Peran ${ROLE_LABEL[user.role]} hanya dapat input pesanan. Pembayaran dilakukan kasir.`,
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-100">
      <header className="z-20 shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-espresso-800 text-lg font-bold text-white">
            L
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-zinc-900">Lomblen Cofe</h1>
            <p className="truncate text-xs text-zinc-500">
              {user.name} - {ROLE_LABEL[user.role]}
            </p>
          </div>

          {user.role !== "waiter" && (
            <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari menu..."
              aria-label="Cari menu"
              className="h-touch w-full rounded-lg border border-zinc-300 bg-white pl-9 pr-3 text-base placeholder:text-zinc-400 focus:border-espresso-600 focus:outline-none focus:ring-1 focus:ring-espresso-600"
            />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1">
        <section aria-label="Daftar menu" className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-zinc-200 bg-white px-3 py-2">
            <CategoryTabs active={category} onChange={setCategory} counts={counts} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 lg:pb-3">
            {loadingMenu ? (
              <p className="py-16 text-center text-sm text-zinc-500">Memuat menu...</p>
            ) : menuError ? (
              <div className="m-3 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-sm font-medium text-red-800">{menuError}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => location.reload()}
                >
                  Muat ulang
                </Button>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-zinc-500">
                Tidak ada menu yang cocok.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((item) => (
                  <MenuCard
                    key={item._id}
                    item={item}
                    qty={cart.find((l) => l.menuId === item._id)?.qty ?? 0}
                    onAdd={addItem}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="hidden w-[360px] shrink-0 border-l border-zinc-200 lg:block xl:w-[400px]">
          <div className="sticky top-0 h-dvh">
            <CartPanel {...cartProps} />
          </div>
        </aside>
      </main>

      {canPay && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white p-2 lg:hidden">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex h-14 w-full items-center justify-between rounded-lg bg-espresso-800 px-4 text-white active:bg-espresso-900"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              Lihat Pesanan
              {cartQty > 0 && (
                <span className="money flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-espresso-800">
                  {cartQty}
                </span>
              )}
            </span>
            <span className="money text-base font-bold">{formatIDR(totals.total)}</span>
          </button>
        </div>
      )}

      {/* Mobile: keranjang sebagai bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 animate-fade-in bg-zinc-900/50"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-[85dvh] animate-slide-up overflow-hidden rounded-t-2xl bg-white">
            <div className="flex justify-center pt-2" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-zinc-300" />
            </div>
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="absolute right-2 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100"
              aria-label="Tutup keranjang"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="h-[calc(100%-40px)] pt-8">
              <CartPanel {...cartProps} onCheckout={() => setPayOpen(true)} />
            </div>
          </div>
        </div>
      )}

      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        lines={cart}
        onConfirm={handleConfirmPayment}
      />

      <ReceiptModal
        transaction={receipt}
        onClose={() => setReceipt(null)}
        onPrint={() => {
          // Browser membuka dialog cetak; printer Bluetooth thermal
          // dikonfigurasi sebagai printer bawaan di perangkat kasir.
          setTimeout(() => window.print(), 150);
        }}
      />
    </div>
  );
}
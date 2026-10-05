"use client";

import { Button } from "@/components/ui/Button";
import { formatIDR } from "@/lib/utils";
import type { CartLine, CartTotals } from "@/types";

export interface CartPanelProps {
  lines: CartLine[];
  totals: CartTotals;
  totalQty: number;
  onQtyChange: (menuId: string, qty: number) => void;
  onClear: () => void;
  onCheckout: () => void;
  canPay: boolean;
  disabled?: boolean;
  reason?: string;
}

/**
 * Panel keranjang. Dipakai ulang untuk dua layout:
 * - Desktop/tablet: kolom kanan sticky
 * - Mobile: di dalam bottom sheet
 */
export function CartPanel({
  lines,
  totals,
  totalQty,
  onQtyChange,
  onClear,
  onCheckout,
  canPay,
  disabled = false,
  reason,
}: CartPanelProps) {
  const empty = lines.length === 0;

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-900">
          Pesanan
          {!empty && (
            <span className="money ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600">
              {totalQty}
            </span>
          )}
        </h2>
        {!empty && (
          <button
            type="button"
            onClick={onClear}
            className="h-touch rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 active:bg-red-100"
          >
            Kosongkan
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {empty ? (
          <EmptyCart />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {lines.map((line) => (
              <CartLineRow
                key={line.menuId}
                line={line}
                onQtyChange={onQtyChange}
              />
            ))}
          </ul>
        )}
      </div>

      <CartSummary
        totals={totals}
        canPay={canPay}
        disabled={disabled || empty}
        onCheckout={onCheckout}
        reason={reason}
      />
    </div>
  );
}

function CartLineRow({
  line,
  onQtyChange,
}: {
  line: CartLine;
  onQtyChange: (menuId: string, qty: number) => void;
}) {
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{line.name}</p>
          <p className="money mt-0.5 text-xs text-zinc-500">
            {formatIDR(line.price)} x {line.qty} ={" "}
            <span className="font-semibold text-zinc-700">
              {formatIDR(line.price * line.qty)}
            </span>
          </p>
          {line.note && (
            <p className="mt-1 text-xs italic text-zinc-500">"{line.note}"</p>
          )}
        </div>
      </div>

      {/* Kontrol kuantitas: tombol 44px agar akurat di layar sentuh */}
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQtyChange(line.menuId, line.qty - 1)}
          aria-label={`Kurangi ${line.name}`}
          className="money flex h-touch w-touch items-center justify-center rounded-lg border border-zinc-300 bg-white text-lg font-semibold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
        >
          −
        </button>
        <span className="money w-10 text-center text-base font-bold text-zinc-900">
          {line.qty}
        </span>
        <button
          type="button"
          onClick={() => onQtyChange(line.menuId, line.qty + 1)}
          aria-label={`Tambah ${line.name}`}
          className="money flex h-touch w-touch items-center justify-center rounded-lg border border-zinc-300 bg-white text-lg font-semibold text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100"
        >
          +
        </button>
      </div>
    </li>
  );
}

function CartSummary({
  totals,
  canPay,
  disabled,
  onCheckout,
  reason,
}: {
  totals: CartTotals;
  canPay: boolean;
  disabled: boolean;
  onCheckout: () => void;
  reason?: string;
}) {
  return (
    <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 px-4 py-3">
      <dl className="space-y-1.5 text-sm">
        <Row label="Subtotal" value={formatIDR(totals.subtotal)} />
        {totals.discount > 0 && (
          <Row
            label="Diskon member"
            value={`- ${formatIDR(totals.discount)}`}
            tone="success"
          />
        )}
        <Row label="PPN 10%" value={formatIDR(totals.tax)} />
        <Row label="Service 5%" value={formatIDR(totals.serviceCharge)} />
        <div className="flex items-baseline justify-between border-t border-zinc-300 pt-2">
          <dt className="text-sm font-semibold text-zinc-700">Total</dt>
          <dd className="money text-xl font-bold text-espresso-900">
            {formatIDR(totals.total)}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        {canPay ? (
          <Button size="xl" fullWidth disabled={disabled} onClick={onCheckout}>
            Bayar Sekarang
          </Button>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {reason ??
              "Peran Anda tidak memiliki hak pembayaran. Minta kasir untuk menyelesaikan."}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success";
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-zinc-600">{label}</dt>
      <dd
        className={`money font-medium ${
          tone === "success" ? "text-emerald-700" : "text-zinc-800"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div
        aria-hidden="true"
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl"
      >
        🧾
      </div>
      <p className="text-sm font-medium text-zinc-700">Keranjang masih kosong</p>
      <p className="mt-1 text-sm text-zinc-500">
        Pilih menu untuk mulai mencatat pesanan.
      </p>
    </div>
  );
}
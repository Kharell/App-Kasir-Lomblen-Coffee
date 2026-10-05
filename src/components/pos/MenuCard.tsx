"use client";

import { cn, formatIDR } from "@/lib/utils";
import type { MenuItem } from "@/types";

export interface MenuCardProps {
  item: MenuItem;
  qty: number;
  onAdd: (item: MenuItem) => void;
  onLongPress?: (item: MenuItem) => void;
}

/**
 * Kartu menu satu item.
 * Seluruh area kartu adalah tombol -> target sentuh jauh lebih besar
 * dari 44x44px, sehingga cepat diklik kasir.
 */
export function MenuCard({ item, qty, onAdd, onLongPress }: MenuCardProps) {
  const disabled = !item.isAvailable;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onAdd(item)}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress?.(item);
      }}
      aria-label={`Tambah ${item.name} ke keranjang`}
      className={cn(
        "group relative flex min-h-[120px] w-full flex-col justify-between rounded-xl border bg-white p-3 text-left",
        "transition-colors duration-100",
        disabled
          ? "cursor-not-allowed border-zinc-200 bg-zinc-50 opacity-60"
          : "border-zinc-200 hover:border-espresso-400 hover:bg-espresso-50/40 active:bg-espresso-100 active:border-espresso-600"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900">
            {item.name}
          </h3>
          {qty > 0 && (
            <span
              aria-label={`${qty} di keranjang`}
              className="money flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md bg-espresso-800 px-1.5 text-xs font-bold text-white"
            >
              {qty}
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {item.description}
          </p>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="money text-sm font-bold text-espresso-800">
          {formatIDR(item.price)}
        </span>
        {disabled ? (
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
            Stok Habis
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-espresso-800 text-lg font-bold leading-none text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            +
          </span>
        )}
      </div>
    </button>
  );
}
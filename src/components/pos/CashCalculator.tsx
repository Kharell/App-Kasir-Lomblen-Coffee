"use client";

import { formatIDR, suggestCashAmounts } from "@/lib/utils";

/**
 * Kalkulator kembalian tunai.
 * Termasuk keypad numerik (lebih cepat daripada keyboard tablet)
 * dan tombol nominal uang siap pakai.
 */
export function CashCalculator({
  total,
  paidAmount,
  onChange,
  change,
  insufficient,
}: {
  total: number;
  paidAmount: string;
  onChange: (v: string) => void;
  change: number;
  insufficient: boolean;
}) {
  const suggestions = suggestCashAmounts(total);
  const digits = (paidAmount || "0").replace(/\D/g, "");

  function press(key: string) {
    if (key === "back") {
      onChange(digits.slice(0, -1));
      return;
    }
    if (key === "clear") {
      onChange("");
      return;
    }
    const next = (digits + key).replace(/^0+/, "");
    onChange(next.slice(0, 9));
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-300 bg-zinc-50 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-zinc-600">Total tagihan</span>
        <span className="money text-lg font-bold text-zinc-900">{formatIDR(total)}</span>
      </div>

      {/* Display uang diterima */}
      <div
        className={`rounded-lg border-2 bg-white px-3 py-2 ${
          insufficient ? "border-red-400" : "border-zinc-300"
        }`}
      >
        <span className="text-xs text-zinc-500">Uang diterima</span>
        <div className="money text-2xl font-bold text-zinc-900">
          {formatIDR(Number(paidAmount) || 0)}
        </div>
      </div>

      <div
        className={`flex items-baseline justify-between rounded-lg px-3 py-2 ${
          insufficient ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        <span className="text-sm font-medium text-zinc-700">Kembalian</span>
        <span
          className={`money text-xl font-bold ${
            insufficient ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {insufficient ? "Kurang" : formatIDR(change)}
        </span>
      </div>

      {/* Nominal siap pilih */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(String(s))}
            className={`money h-touch rounded-lg border px-3 text-sm font-semibold transition-colors ${
              Number(digits) === s
                ? "border-espresso-800 bg-espresso-800 text-white"
                : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"
            }`}
          >
            {formatIDR(s)}
          </button>
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => press(k)}
            className="money h-touch rounded-lg border border-zinc-300 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
          >
            {k}
          </button>
        ))}
        <button
          type="button"
          onClick={() => press("clear")}
          className="h-touch rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 active:bg-red-100"
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={() => press("0")}
          className="money h-touch rounded-lg border border-zinc-300 bg-white text-lg font-semibold text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => press("back")}
          aria-label="Hapus satu digit"
          className="h-touch rounded-lg border border-zinc-300 bg-white text-lg font-semibold text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
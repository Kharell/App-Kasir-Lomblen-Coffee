"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { PAYMENT_LABEL, type Transaction } from "@/types";

/** Daftar transaksi terbaru + aksi void (Manajer/Admin). */
export function TransactionList({ canVoid }: { canVoid: boolean }) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voidTarget, setVoidTarget] = useState<Transaction | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/transactions?limit=50", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat transaksi.");
      setItems(data.transactions as Transaction[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat transaksi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleVoid() {
    if (!voidTarget || reason.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/transactions/${voidTarget._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal membatalkan pesanan.");
      setVoidTarget(null);
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan pesanan.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-zinc-500">Memuat transaksi...</p>;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-zinc-900">Transaksi Terbaru</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500 shadow-panel">
          Belum ada transaksi. Lakukan penjualan di halaman Kasir.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">Invoice</th>
                  <th className="px-3 py-2">Waktu</th>
                  <th className="px-3 py-2">Kasir</th>
                  <th className="px-3 py-2">Metode</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2">Status</th>
                  {canVoid && <th className="px-3 py-2" />}
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t._id} className="border-t border-zinc-100">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-zinc-900">
                      {t.invoiceNo}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-700">{t.cashierName}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
                      {PAYMENT_LABEL[t.paymentMethod]}
                    </td>
                    <td className="money whitespace-nowrap px-3 py-2 text-right font-semibold text-zinc-900">
                      {formatIDR(t.totals.total)}
                    </td>
                    <td className="px-3 py-2">
                      {t.status === "void" ? (
                        <Badge tone="danger">Void</Badge>
                      ) : t.paymentMethod === "cash" ? (
                        <Badge tone="success">Lunas</Badge>
                      ) : (
                        <Badge tone="info">Dibayar</Badge>
                      )}
                    </td>
                    {canVoid && (
                      <td className="px-3 py-2 text-right">
                        {t.status !== "void" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setVoidTarget(t);
                              setReason("");
                            }}
                          >
                            Void
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <VoidModal
        target={voidTarget}
        reason={reason}
        setReason={setReason}
        busy={busy}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoid}
      />
    </div>
  );
}
function VoidModal({
  target,
  reason,
  setReason,
  busy,
  onClose,
  onConfirm,
}: {
  target: Transaction | null;
  reason: string;
  setReason: (v: string) => void;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={Boolean(target)}
      onClose={onClose}
      title="Batalkan Pesanan"
      description={target?.invoiceNo}
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            Batal
          </Button>
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            loading={busy}
            disabled={reason.trim().length < 3}
            onClick={onConfirm}
          >
            Void Pesanan
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-zinc-600">
        Pembatalan akan mengeluarkan transaksi dari laporan penjualan. Alasan wajib diisi untuk
        jejak audit.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        maxLength={200}
        placeholder="Contoh: pelanggan salah pilih menu"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base focus:border-espresso-600 focus:outline-none focus:ring-1 focus:ring-espresso-600"
      />
    </Modal>
  );
}
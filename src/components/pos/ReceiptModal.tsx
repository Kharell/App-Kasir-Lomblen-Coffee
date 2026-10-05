"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime, formatIDR } from "@/lib/utils";
import { PAYMENT_LABEL, type Transaction } from "@/types";

/**
 * Struk penjualan.
 *
 * Cetak menggunakan CSS `@media print` (lihat globals.css) yang hanya
 * menampilkan elemen #struk-area. Format 58mm mengikuti printer thermal.
 * Kolom stay-aligned memakai `tabular-nums`.
 */
export function ReceiptModal({
  transaction,
  onClose,
  onPrint,
}: {
  transaction: Transaction | null;
  onClose: () => void;
  onPrint: () => void;
}) {
  if (!transaction) return null;
  const t = transaction;

  return (
    <Modal
      open
      onClose={onClose}
      title="Transaksi Berhasil"
      description={`${t.invoiceNo} - ${formatDateTime(t.createdAt)}`}
      sheetOnMobile
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Selesai
          </Button>
          <Button size="lg" onClick={onPrint} className="flex-1">
            Cetak Struk
          </Button>
        </div>
      }
    >
      <div
        id="struk-area"
        className="mx-auto max-w-xs rounded-lg bg-white p-4 font-mono text-[12px] leading-relaxed text-zinc-900"
      >
        <header className="mb-3 border-b border-dashed border-zinc-400 pb-2 text-center">
          <p className="text-base font-bold tracking-wide">LOMBLEN COFE</p>
          <p className="text-[11px]">Jl. Senopati No. 88, Jakarta</p>
          <p className="text-[11px]">Telp: (021) 555-0134</p>
        </header>

        <div className="mb-2 flex justify-between text-[11px]">
          <span>No. Invoice</span>
          <span className="font-semibold">{t.invoiceNo}</span>
        </div>
        <div className="mb-2 flex justify-between text-[11px]">
          <span>Tanggal</span>
          <span>{formatDateTime(t.createdAt)}</span>
        </div>
        <div className="mb-2 flex justify-between text-[11px]">
          <span>Kasir</span>
          <span>{t.cashierName}</span>
        </div>
        {t.tableNo && (
          <div className="mb-2 flex justify-between text-[11px]">
            <span>Meja</span>
            <span>{t.tableNo}</span>
          </div>
        )}

        <div className="my-2 border-t border-dashed border-zinc-400" />

        <table className="w-full">
          <tbody>
            {t.lines.map((line, i) => (
              <tr key={`${line.menuId}-${i}`}>
                <td className="align-top py-0.5 pr-2">
                  {line.name}
                  <span className="block text-[10px] text-zinc-600">
                    {line.qty} x {formatIDR(line.price)}
                  </span>
                  {line.note && (
                    <span className="block text-[10px] italic text-zinc-600">
                      * {line.note}
                    </span>
                  )}
                </td>
                <td className="align-top whitespace-nowrap py-0.5 text-right font-semibold">
                  {formatIDR(line.price * line.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-zinc-400" />

        <div className="space-y-0.5">
          <Row label="Subtotal" value={formatIDR(t.totals.subtotal)} />
          {t.totals.discount > 0 && (
            <Row label="Diskon" value={`-${formatIDR(t.totals.discount)}`} />
          )}
          <Row label="PPN 10%" value={formatIDR(t.totals.tax)} />
          <Row label="Service 5%" value={formatIDR(t.totals.serviceCharge)} />
        </div>

        <div className="mt-1 flex justify-between border-t border-zinc-800 py-1 text-sm font-bold">
          <span>TOTAL</span>
          <span>{formatIDR(t.totals.total)}</span>
        </div>

        <div className="space-y-0.5 border-t border-dashed border-zinc-400 pt-2">
          <Row label="Bayar" value={PAYMENT_LABEL[t.paymentMethod]} />
          {t.paymentMethod === "cash" && t.paidAmount != null && (
            <>
              <Row label="Tunai" value={formatIDR(t.paidAmount)} />
              <Row label="Kembali" value={formatIDR(t.changeAmount ?? 0)} />
            </>
          )}
        </div>

        <footer className="mt-3 border-t border-dashed border-zinc-400 pt-2 text-center text-[10px]">
          <p>Terima kasih telah benchmarking Lomblen Cofe</p>
          <p>Barang yang sudah dibeli tidak dapat ditukar</p>
        </footer>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CashCalculator } from "@/components/pos/CashCalculator";
import { formatIDR } from "@/lib/utils";
import { PAYMENT_LABEL, type CartLine, type PaymentMethod } from "@/types";

const METHODS: { id: PaymentMethod; icon: string; desc: string }[] = [
  { id: "cash", icon: "💵", desc: "Kembalian otomatis" },
  { id: "qris", icon: "📱", desc: "Scan QRIS statis" },
  { id: "ewallet", icon: "📲", desc: "GoPay, OVO, DANA" },
  { id: "va", icon: "🏦", desc: "BCA, BNI, Mandiri, BRI" },
];

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  lines: CartLine[];
  onConfirm: (input: {
    paymentMethod: PaymentMethod;
    paidAmount?: number;
    customerName?: string;
    tableNo?: string;
    discountRate?: number;
  }) => Promise<void>;
}

/** Modal pembayaran omnichannel: tunai + digital. */
export function PaymentModal({
  open,
  onClose,
  lines,
  onConfirm,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tableNo, setTableNo] = useState("");
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const discountRate = isMember ? 0.05 : 0;

  // Pratinjau total. Server menghitung ulang saat submit sebagai sumber kebenaran.
  const effective = useMemo(() => {
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const discount = Math.round(subtotal * discountRate);
    const taxable = subtotal - discount;
    const tax = Math.round(taxable * 0.1);
    const serviceCharge = Math.round(taxable * 0.05);
    return { subtotal, discount, tax, serviceCharge, total: taxable + tax + serviceCharge };
  }, [lines, discountRate]);

  const cash = Number(paidAmount) || 0;
  const change = Math.max(0, cash - effective.total);
  const insufficient = method === "cash" && cash > 0 && cash < effective.total;

  function resetAndClose() {
    setMethod("cash");
    setPaidAmount("");
    setCustomerName("");
    setTableNo("");
    setIsMember(false);
    setError("");
    onClose();
  }

  async function handleConfirm() {
    setError("");
    if (method === "cash" && cash < effective.total) {
      setError("Uang diterima masih kurang dari total belanja.");
      return;
    }
    setLoading(true);
    try {
      await onConfirm({
        paymentMethod: method,
        paidAmount: method === "cash" ? cash : undefined,
        customerName: customerName || undefined,
        tableNo: tableNo || undefined,
        discountRate,
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pembayaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={resetAndClose}
      title="Pembayaran"
      description={`${lines.length} item - Total ${formatIDR(effective.total)}`}
      sheetOnMobile
      footer={
        <div className="flex gap-2">
          <Button variant="secondary" size="lg" onClick={resetAndClose} className="flex-1">
            Batal
          </Button>
          <Button
            size="lg"
            className="flex-[2]"
            loading={loading}
            disabled={insufficient || (method === "cash" && cash === 0)}
            onClick={handleConfirm}
          >
            {method === "cash" && cash > 0
              ? `Terima ${formatIDR(cash)}`
              : `Bayar ${formatIDR(effective.total)}`}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-zinc-700">Metode</h3>
          <div className="grid grid-cols-2 gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                aria-pressed={method === m.id}
                className={`flex min-h-touch flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors ${
                  method === m.id
                    ? "border-espresso-800 bg-espresso-50 ring-1 ring-espresso-800"
                    : "border-zinc-300 bg-white hover:bg-zinc-50"
                }`}
              >
                <span className="text-lg" aria-hidden="true">
                  {m.icon}
                </span>
                <span className="text-sm font-semibold text-zinc-900">
                  {PAYMENT_LABEL[m.id]}
                </span>
                <span className="text-[11px] leading-tight text-zinc-500">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {method === "cash" ? (
          <CashCalculator
            total={effective.total}
            paidAmount={paidAmount}
            onChange={setPaidAmount}
            change={change}
            insufficient={insufficient}
          />
        ) : (
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
            <p className="font-semibold">
              Pembayaran {PAYMENT_LABEL[method]} sebesar {formatIDR(effective.total)}
            </p>
            <p className="mt-1 text-sky-800">
              Kode QR atau nomor virtual account dibuat setelah pesanan dikonfirmasi, lalu
              diteruskan ke pelanggan.
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nama pelanggan"
            placeholder="Opsional"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            maxLength={60}
          />
          <Input
            label="No. meja"
            placeholder="Contoh: A-01"
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        <label className="flex min-h-touch cursor-pointer items-center gap-3 rounded-lg border border-zinc-300 px-3">
          <input
            type="checkbox"
            checked={isMember}
            onChange={(e) => setIsMember(e.target.checked)}
            className="h-5 w-5 rounded border-zinc-300 text-espresso-800 focus:ring-espresso-600"
          />
          <span className="text-sm text-zinc-800">
            Pelanggan member{" "}
            <span className="font-medium text-emerald-700">(diskon 5%)</span>
          </span>
        </label>

        {discountRate > 0 && (
          <p className="money -mt-2 text-right text-sm text-emerald-700">
            Hemat {formatIDR(effective.discount)}
          </p>
        )}
      </div>
    </Modal>
  );
}
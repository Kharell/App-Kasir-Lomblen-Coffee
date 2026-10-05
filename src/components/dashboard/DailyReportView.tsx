"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDate, formatIDR } from "@/lib/utils";
import { PAYMENT_LABEL, type PaymentMethod, type ReportSummary } from "@/types";

/** Laporan penjualan harian: KPI, rincian, metode bayar, menu terlaris. */
export function DailyReportView() {
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/daily", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat laporan.");
      setReport(data.report as ReportSummary);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-16 text-center text-sm text-zinc-500">Memuat laporan...</p>;

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!report) return null;

  const methods = Object.entries(report.byMethod) as [
    PaymentMethod,
    { count: number; total: number },
  ][];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-zinc-900">Laporan Penjualan</h2>
        <p className="text-sm text-zinc-600">{formatDate(report.date)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Omzet Bersih" value={formatIDR(report.netRevenue)} emphasis />
        <StatCard label="Transaksi" value={String(report.transactionCount)} />
        <StatCard label="Rata-rata Transaksi" value={formatIDR(report.averageTicket)} />
        <StatCard
          label="Pesanan Dibatalkan"
          value={String(report.voidCount)}
          tone={report.voidCount > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-panel">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Rincian Pendapatan</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Penjualan Kotor" value={formatIDR(report.grossRevenue)} />
            <Row
              label="Diskon"
              value={`-${formatIDR(report.discountTotal)}`}
              tone="success"
            />
            <div className="border-t border-zinc-200 pt-2">
              <Row label="Omzet Bersih" value={formatIDR(report.netRevenue)} bold />
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-panel">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">Metode Pembayaran</h3>
          <ul className="space-y-2">
            {methods.map(([method, data]) => (
              <li key={method} className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">{PAYMENT_LABEL[method]}</span>
                <span className="money text-zinc-900">
                  {data.count} x &middot; {formatIDR(data.total)}
                </span>
              </li>
            ))}
            {report.transactionCount === 0 && (
              <li className="text-sm text-zinc-500">Belum ada transaksi hari ini.</li>
            )}
          </ul>
        </section>
      </div>

      <TopItemsSection report={report} />
    </div>
  );
}

function TopItemsSection({ report }: { report: ReportSummary }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-panel">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">Menu Terlaris</h3>
      {report.topItems.length === 0 ? (
        <p className="text-sm text-zinc-500">Belum ada penjualan hari ini.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-2">Menu</th>
                <th className="py-2 pr-2 text-right">Qty</th>
                <th className="py-2 text-right">Pendapatan</th>
              </tr>
            </thead>
            <tbody>
              {report.topItems.map((item, i) => (
                <tr key={item.name} className="border-b border-zinc-100 last:border-0">
                  <td className="py-2 pr-2 text-zinc-400">{i + 1}</td>
                  <td className="py-2 pr-2 font-medium text-zinc-900">{item.name}</td>
                  <td className="money py-2 pr-2 text-right text-zinc-700">{item.qty}</td>
                  <td className="money py-2 text-right font-semibold text-zinc-900">
                    {formatIDR(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatCard({
  label,
  value,
  emphasis,
  tone = "neutral",
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "neutral" | "danger";
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-panel ${
        emphasis ? "border-espresso-200 bg-espresso-50" : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p
        className={`money mt-1 text-xl font-bold ${
          tone === "danger" ? "text-red-700" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  tone,
  bold,
}: {
  label: string;
  value: string;
  tone?: "success";
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={bold ? "font-semibold text-zinc-800" : "text-zinc-600"}>{label}</dt>
      <dd
        className={`money ${bold ? "text-base font-bold" : "font-medium"} ${
          tone === "success" ? "text-emerald-700" : "text-zinc-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DailyReportView } from "@/components/dashboard/DailyReportView";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { MenuManager } from "@/components/dashboard/MenuManager";
import { UserManager } from "@/components/dashboard/UserManager";
import { ROLE_LABEL, hasPermission, type SessionUser } from "@/types";

type Tab = "laporan" | "transaksi" | "menu" | "karyawan";

const TABS: { id: Tab; label: string; permission: "report:view" | "menu:manage" | "user:manage" }[] = [
  { id: "laporan", label: "Laporan Harian", permission: "report:view" },
  { id: "transaksi", label: "Transaksi", permission: "report:view" },
  { id: "menu", label: "Manajemen Menu", permission: "menu:manage" },
  { id: "karyawan", label: "Karyawan", permission: "user:manage" },
];

/** Panel kontrol untuk Manajer & Admin. */
export function DashboardShell({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("laporan");

  const availableTabs = TABS.filter((t) => hasPermission(user.role, t.permission));

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-dvh bg-zinc-100">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-espresso-800 font-bold text-white">
            L
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-bold text-zinc-900">Dashboard Lomblen Cofe</h1>
            <p className="truncate text-xs text-zinc-500">
              {user.name} - {ROLE_LABEL[user.role]}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push("/kasir")}>
            Kasir
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            Keluar
          </Button>
        </div>

        <nav className="no-scrollbar mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2">
          {availableTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={`h-touch shrink-0 rounded-lg px-4 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-espresso-800 text-white"
                  : "text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        {tab === "laporan" && <DailyReportView />}
        {tab === "transaksi" && (
          <TransactionList canVoid={hasPermission(user.role, "order:void")} />
        )}
        {tab === "menu" && <MenuManager />}
        {tab === "karyawan" && <UserManager currentUserId={user.id} />}
      </main>
    </div>
  );
}
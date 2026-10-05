"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ROLE_LABEL, type Role } from "@/types";

interface DemoAccount {
  username: string;
  role: Role;
  name: string;
}

const ROLE_ICON: Record<Role, string> = {
  admin: "👑",
  manager: "👔",
  cashier: "🧑‍🍳",
  waiter: "📝",
};

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<DemoAccount[]>([]);

  // Ambil daftar akun demo untuk expedite proses login saat evaluate.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/login");
        const data = await res.json();
        setAccounts(data.demoAccounts ?? []);
      } catch {
        // tidak kritis: form tetap bisa dipakai manual
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login gagal.");
        return;
      }

      // Redirect sesuai peran, tanpa full reload -> transisi instan (SPA).
      const role: Role = data.user.role;
      const target = role === "waiter" || role === "cashier" ? "/kasir" : "/dashboard";
      router.push(target);
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  function quickFill(acc: DemoAccount) {
    setUsername(acc.username);
    setPassword("lomblen123");
    setError("");
  }

  return (
    <main className="flex min-h-dvh flex-col bg-zinc-100">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-espresso-800 text-2xl font-bold text-white">
              L
            </div>
            <h1 className="text-xl font-bold text-zinc-900">Lomblen Cofe</h1>
            <p className="mt-1 text-sm text-zinc-600">Aplikasi Kasir &mdash; masuk untuk melanjutkan</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-panel">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="contoh: kasir"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Minimal 1 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Masuk
            </Button>
          </form>

          {/* Pemilih peran cepat (akun demo) */}
          {accounts.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
                Masuk cepat sebagai
              </p>
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => quickFill(acc)}
                    className="flex min-h-touch flex-col items-start gap-0.5 rounded-lg border border-zinc-300 bg-white p-3 text-left transition-colors hover:border-espresso-400 hover:bg-espresso-50/50 active:bg-espresso-100"
                  >
                    <span aria-hidden="true" className="text-base">
                      {ROLE_ICON[acc.role]}
                    </span>
                    <span className="text-sm font-semibold text-zinc-900">
                      {ROLE_LABEL[acc.role]}
                    </span>
                    <span className="text-xs text-zinc-500">{acc.username}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-xs text-zinc-500">
                Password demo: <code className="font-mono font-semibold">lomblen123</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
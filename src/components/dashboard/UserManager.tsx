"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { ROLE_LABEL, ROLES, type Role } from "@/types";

interface Employee {
  _id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
}

const EMPTY = { name: "", username: "", password: "", role: "cashier" as Role };

/** Manajemen karyawan: tambah akun, aktif/nonaktifkan. */
export function UserManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat karyawan.");
      setUsers(data.users as Employee[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat karyawan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah karyawan.");
      setOpen(false);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah karyawan.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(user: Employee) {
    try {
      const res = await fetch(`/api/users/${user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengubah status.");
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? (data.user as Employee) : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-zinc-500">Memuat karyawan...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">Karyawan</h2>
        <Button onClick={() => setOpen(true)}>Tambah Karyawan</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-panel">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50">
              <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Peran</th>
                <th className="px-3 py-2">Login Terakhir</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">{u.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-600">{u.username}</td>
                  <td className="px-3 py-2">
                    <Badge tone={u.role === "admin" ? "warning" : "neutral"}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                    {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "-"}
                  </td>
                  <td className="px-3 py-2">
                    {u.isActive ? (
                      <Badge tone="success">Aktif</Badge>
                    ) : (
                      <Badge tone="danger">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={u._id === currentUserId}
                      title={
                        u._id === currentUserId
                          ? "Tidak dapat menonaktifkan akun sendiri"
                          : undefined
                      }
                      onClick={() => handleToggle(u)}
                    >
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Tambah Karyawan"
        description="Akun baru dapat langsung digunakan untuk login."
        sheetOnMobile
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" form="user-form" size="lg" className="flex-1" loading={busy}>
              Simpan
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Nama lengkap"
            required
            minLength={3}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Rina Kurnia"
          />
          <Input
            label="Username"
            required
            minLength={3}
            autoCapitalize="none"
            spellCheck={false}
            value={form.username}
            onChange={(e) =>
              setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })
            }
            hint="3-24 karakter: huruf kecil, angka, titik, strip"
          />
          <Input
            label="Password"
            required
            minLength={8}
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="Minimal 8 karakter"
          />
          <div>
            <label htmlFor="user-role" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Peran
            </label>
            <select
              id="user-role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              className="h-touch w-full rounded-lg border border-zinc-300 bg-white px-3 text-base focus:border-espresso-600 focus:outline-none focus:ring-1 focus:ring-espresso-600"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
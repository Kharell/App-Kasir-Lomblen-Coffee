"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatIDR } from "@/lib/utils";
import { CATEGORY_LABEL, type MenuCategory, type MenuItem } from "@/types";

const EMPTY_FORM = {
  name: "",
  price: "",
  category: "kopi" as MenuCategory,
  description: "",
};

/** Manajemen menu: tambah item baru & toggle ketersediaan stok. */
export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/menu", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat menu.");
      setItems(data.items as MenuItem[]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat menu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggle(item: MenuItem) {
    try {
      const res = await fetch(`/api/menu/${item._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengubah status.");
      setItems((prev) =>
        prev.map((m) => (m._id === item._id ? (data.item as MenuItem) : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal menambah menu.");
      setFormOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah menu.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="py-16 text-center text-sm text-zinc-500">Memuat menu...</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-900">Manajemen Menu</h2>
        <Button onClick={() => setFormOpen(true)}>Tambah Menu</Button>
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
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2 text-right">Harga</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <tr key={m._id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 font-medium text-zinc-900">{m.name}</td>
                  <td className="px-3 py-2 text-zinc-600">{CATEGORY_LABEL[m.category]}</td>
                  <td className="money px-3 py-2 text-right font-semibold text-zinc-900">
                    {formatIDR(m.price)}
                  </td>
                  <td className="px-3 py-2">
                    {m.isAvailable ? (
                      <Badge tone="success">Tersedia</Badge>
                    ) : (
                      <Badge tone="danger">Stok Habis</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="secondary" onClick={() => handleToggle(m)}>
                      {m.isAvailable ? "Tandai Habis" : "Aktifkan"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Tambah Menu Baru"
        sheetOnMobile
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setFormOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" form="menu-form" size="lg" className="flex-1" loading={busy}>
              Simpan
            </Button>
          </div>
        }
      >
        <form id="menu-form" onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Nama menu"
            required
            minLength={3}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Latte Hazelnut"
          />
          <Input
            label="Harga"
            required
            type="number"
            min={1}
            step={500}
            inputMode="numeric"
            prefix={<span className="text-sm">Rp</span>}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="28000"
          />
          <div>
            <label htmlFor="menu-category" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Kategori
            </label>
            <select
              id="menu-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}
              className="h-touch w-full rounded-lg border border-zinc-300 bg-white px-3 text-base focus:border-espresso-600 focus:outline-none focus:ring-1 focus:ring-espresso-600"
            >
              {(Object.keys(CATEGORY_LABEL) as MenuCategory[]).map((key) => (
                <option key={key} value={key}>
                  {CATEGORY_LABEL[key]}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Deskripsi"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={120}
            placeholder="Opsional"
          />
        </form>
      </Modal>
    </div>
  );
}
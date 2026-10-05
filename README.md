# Lomblen Cofe — Aplikasi Kasir (POS)

Aplikasi Point of Sale berbasis web untuk kedai kopi **Lomblen Cofe**.
Dibangun dengan Next.js (App Router), TypeScript, Tailwind CSS, dan MongoDB (Mongoose).

---

## 🚀 Menjalankan Aplikasi

```bash
npm install     # pasang dependensi
npm run dev     # jalankan server pengembangan
```

Buka **http://localhost:3000**

### 🔑 Akun Demo

| Peran | Username | Password | Halaman |
|---|---|---|---|
| Admin / Owner | `admin` | `lomblen123` | Dashboard |
| Manajer | `manager` | `lomblen123` | Dashboard |
| Kasir | `kasir` | `lomblen123` | Kasir |
| Pelayan | `pelayan` | `lomblen123` | Kasir (tanpa pembayaran) |

> Halaman login menyediakan tombol **masuk cepat** untuk mengisi otomatis akun di atas.

### 💾 Mode Demo vs Mode Database

Aplikasi **dapat langsung dijalankan tanpa MongoDB**. Bila `MONGODB_URI` tidak diisi,
data disimpan di memori server (in-memory) selama proses berjalan.

Untuk memakai MongoDB sungguhan:

```bash
cp .env.example .env.local      # lalu isi MONGODB_URI & JWT_SECRET
npm run seed                    # isi 28 menu + 4 akun pengguna
npm run dev
```

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm start` | Menjalankan hasil build |
| `npm run seed` | Seed data awal ke MongoDB |
| `npm run typecheck` | Cek tipe TypeScript |

---

## 🧭 Fitur

**Halaman Kasir (`/kasir`)**
- Grid 28 menu dalam 4 kategori (Kopi, Non-Kopi, Makanan Ringan, Makanan Berat)
- Keranjang real-time dengan kalkulasi PPN 10% + service charge 5%
- Pencarian menu & filter kategori
- Pembayaran: **Tunai** (keypad + kalkulator kembalian otomatis), **QRIS**, **E-Wallet**, **Virtual Account**
- Diskon member 5%, catatan nama pelanggan & nomor meja
- Cetak struk format thermal 58 mm
- Layout adaptif: dua kolom di tablet/desktop, bottom sheet di mobile

**Dashboard Manajer/Admin (`/dashboard`)**
- Laporan harian: omzet, jumlah transaksi, rata-rata, pesanan dibatalkan
- Rincian per metode pembayaran dan menu terlaris
- Daftar transaksi + fitur **void** dengan alasan (audit)
- Manajemen menu (tambah item, tandai stok habis) — khusus Admin
- Manajemen karyawan (tambah/nonaktifkan akun) — khusus Admin

---

## 🔐 Peran & Hak Akses

| Kapabilitas | Pelayan | Kasir | Manajer | Admin |
|---|:---:|:---:|:---:|:---:|
| Input pesanan | ✅ | ✅ | ✅ | ✅ |
| Proses pembayaran | ❌ | ✅ | ✅ | ✅ |
| Cetak struk | ❌ | ✅ | ✅ | ✅ |
| Void pesanan | ❌ | ❌ | ✅ | ✅ |
| Lihat laporan | ❌ | ❌ | ✅ | ✅ |
| Manajemen menu | ❌ | ❌ | ❌ | ✅ |
| Manajemen karyawan | ❌ | ❌ | ❌ | ✅ |

Matriks izin adalah sumber kebenaran tunggal di `src/types/index.ts`
(`ROLE_PERMISSIONS`) dan ditegakkan berlapis:

1. **Middleware** (`src/middleware.ts`) — redirect cepat di tepi
2. **Server Component** — validasi ulang sebelum render halaman
3. **API Route** (`requireAuth(req, permission)`) — otorisasi sesungguhnya

> Menyembunyikan UI bukan keamanan. Otorisasi selalu ditegakkan di server.

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout,session}/route.ts
│   │   ├── menu/route.ts, menu/[id]/route.ts
│   │   ├── transactions/route.ts, transactions/[id]/route.ts
│   │   ├── reports/daily/route.ts
│   │   └── users/route.ts, users/[id]/route.ts
│   ├── dashboard/page.tsx        # Panel Manajer & Admin
│   ├── kasir/page.tsx            # Halaman POS
│   ├── layout.tsx
│   ├── page.tsx                  # Login / pemilihan peran
│   └── globals.css
├── components/
│   ├── auth/LoginForm.tsx
│   ├── pos/                      # MenuCard, CartPanel, PaymentModal, ReceiptModal
│   ├── dashboard/                # DailyReportView, TransactionList, MenuManager, UserManager
│   └── ui/                       # Button, Input, Modal, Badge
├── lib/
│   ├── auth.ts                   # bcrypt + guard API (Node runtime)
│   ├── session.ts                # JWT murni (aman untuk Edge/middleware)
│   ├── db.ts                     # Koneksi MongoDB + fallback
│   ├── demo-store.ts             # Store in-memory mode demo
│   ├── seed-data.ts              # Data awal 28 menu + 4 akun
│   ├── utils.ts                  # Format Rupiah, kalkulasi total, invoice
│   └── repository/               # Lapisan akses data (menu, transaction, user)
├── models/                       # Skema Mongoose (Menu, User, Transaction)
├── middleware.ts                 # Route protection + redirect per peran
└── types/index.ts                # Domain types + matriks izin
```

---

## 🔒 Catatan Keamanan

- **Password di-hash bcrypt** (cost 12) saat memakai MongoDB.
- **Total dihitung ulang di server** pada `POST /api/transactions` — nilai uang dari client tidak pernah dipercaya.
- **JWT disimpan di cookie httpOnly** dengan `SameSite=Lax` (mitigasi XSS & CSRF).
- **Header keamanan** (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) di `next.config.ts`.
- **Perbandingan password timing-safe** untuk mencegah timing attack.
- **Void wajib disertai alasan** minimal 3 karakter untuk jejak audit.
- **Admin tidak dapat menonaktifkan akunnya sendiri** (mencegah terkunci).

### ⚠️ Sebelum dipakai produksi

1. Ganti `JWT_SECRET` dengan random string minimal 32 karakter.
2. Ganti password seluruh akun demo.
3. Isi `MONGODB_URI` dan jalankan `npm run seed`.
4. Gunakan HTTPS (`NODE_ENV=production` mengaktifkan flag `Secure` pada cookie).
5. Integrasikan payment gateway (Midtrans/Xendit) untuk QRIS/E-Wallet/VA sungguhan.

---

## 🎨 Design System

- **Latar netral** (putih/zinc-100) dengan teks gelap agar kontras tinggi.
- **Satu warna aksen**: espresso (cokelat kopi, `#2b1a11`–`#8f5f40`) untuk CTA penting.
- **Target sentuh minimum 44×44 px** pada semua tombol aksi (kategori, qty, bayar).
- Tanpa gradient/glow dekoratif; elevasi hanya untuk memisahkan lapisan (sticky, modal).
- Angka uang memakai `font-mono tabular-nums` agar kolom lurus saat nilai berubah.

---

## 🧮 Skrip Perhitungan

`calculateTotals()` di `src/lib/utils.ts` adalah **satu-satunya sumber kebenaran**:

```
subtotal    = Σ (harga × qty)
discount    = subtotal × 5%   (jika member)
taxable     = subtotal - discount
PPN 10%     = taxable × 0.10
service 5%  = taxable × 0.05
TOTAL       = taxable + PPN + service
```

Fungsi yang sama dipakai di client (pratinjau) dan server (penyimpanan),
sehingga total di struk tidak pernah meleset.

---

## 🧭 Navigasi Otomatis

Setelah login pengguna diarahkan sesuai perannya:

- `admin`, `manager` → `/dashboard`
- `cashier`, `waiter` → `/kasir`

Middleware mencegah akses silang: kasir yang membuka `/dashboard` akan
diarahkan kembali ke `/kasir`, dan sebaliknya.


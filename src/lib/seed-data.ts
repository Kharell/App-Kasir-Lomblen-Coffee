import type { MenuCategory, MenuItem } from "@/types";

/**
 * Katalog awal 28 item (MVP: Kopi, Non-Kopi, Ringan, Berat).
 * Dipakai oleh seeder MongoDB maupun mode demo in-memory,
 * sehingga aplikasi tetap bisa dicoba tanpa database.
 */
export const SEED_MENU: (Omit<MenuItem, "_id"> & { category: MenuCategory })[] = [
  // ---- Kopi (10) ----
  { name: "Espresso", category: "kopi", price: 18000, description: "Single shot, intense dan pekat", isAvailable: true, preparationMinutes: 3 },
  { name: "Americano", category: "kopi", price: 22000, description: "Espresso dengan air panas", isAvailable: true, preparationMinutes: 3 },
  { name: "Caffe Latte", category: "kopi", price: 28000, description: "Espresso dengan susu steamed", isAvailable: true, preparationMinutes: 4 },
  { name: "Cappuccino", category: "kopi", price: 28000, description: "Espresso, susu, dan busa 1:1:1", isAvailable: true, preparationMinutes: 4 },
  { name: "Cafe Mocha", category: "kopi", price: 32000, description: "Espresso, cokelat, dan susu", isAvailable: true, preparationMinutes: 5 },
  { name: "Americano Dingin", category: "kopi", price: 24000, description: "Cold brew dengan air dingin", isAvailable: true, preparationMinutes: 2 },
  { name: "Kopi Susu Gula Aren", category: "kopi", price: 26000, description: "Signature Lomblen Cofe", isAvailable: true, preparationMinutes: 5 },
  { name: "V60 Pour Over", category: "kopi", price: 34000, description: "Single origin manual brew", isAvailable: true, preparationMinutes: 7 },
  { name: "Espresso Doppio", category: "kopi", price: 24000, description: "Double shot concentrate", isAvailable: true, preparationMinutes: 3 },
  { name: "Kopi Tubruk", category: "kopi", price: 15000, description: "Kopi panangan khas Indonesia", isAvailable: true, preparationMinutes: 4 },

  // ---- Non-Kopi (7) ----
  { name: "Matcha Latte", category: "non-kopi", price: 30000, description: "Matcha premium dengan susu", isAvailable: true, preparationMinutes: 4 },
  { name: "Chai Latte", category: "non-kopi", price: 28000, description: "Teh India rempah dengan susu", isAvailable: true, preparationMinutes: 4 },
  { name: "Cokelat Panas", category: "non-kopi", price: 25000, description: "Cokelat Belgian", isAvailable: true, preparationMinutes: 4 },
  { name: "Teh Tarik", category: "non-kopi", price: 20000, description: "Teh pull dengan susu kental manis", isAvailable: true, preparationMinutes: 3 },
  { name: "Matcha Frappe", category: "non-kopi", price: 32000, description: "Blended matcha dingin", isAvailable: true, preparationMinutes: 5 },
  { name: "Lemon Tea", category: "non-kopi", price: 18000, description: "Teh lemon segar", isAvailable: true, preparationMinutes: 3 },
  { name: "Air Mineral", category: "non-kopi", price: 8000, description: "Air botol dingin", isAvailable: true, preparationMinutes: 1 },

  // ---- Makanan Ringan (6) ----
  { name: "Croissant Mentega", category: "ringan", price: 22000, description: "Baked fresh setiap pagi", isAvailable: true, preparationMinutes: 3 },
  { name: "Sandwich Ayam", category: "ringan", price: 32000, description: "Roti lapis dengan ayam panggang dan selada", isAvailable: true, preparationMinutes: 8 },
  { name: "Donut Gula Melai", category: "ringan", price: 18000, description: "5 pcs per box", isAvailable: true, preparationMinutes: 2 },
  { name: "Cookies", category: "ringan", price: 15000, description: "2 pcs cokelat chip", isAvailable: true, preparationMinutes: 2 },
  { name: "Kentang Goreng", category: "ringan", price: 25000, description: "Kentang goreng dengan saus sambal", isAvailable: true, preparationMinutes: 6 },
  { name: "Roti Bakar", category: "ringan", price: 20000, description: "Roti, margarin, dan cokelat", isAvailable: true, preparationMinutes: 5 },

  // ---- Makanan Berat (5) ----
  { name: "Nasi Goreng", category: "berat", price: 35000, description: "Nasi, telur, ayam, dan acar", isAvailable: true, preparationMinutes: 10 },
  { name: "Mie Goreng", category: "berat", price: 32000, description: "Mie, ayam, sayur, dan telur", isAvailable: true, preparationMinutes: 10 },
  { name: "Ayam Bakar", category: "berat", price: 42000, description: "Setengah ayam dengan nasi dan lalapan", isAvailable: true, preparationMinutes: 18 },
  { name: "Soto Ayam", category: "berat", price: 33000, description: "Soto bening dengan nasi", isAvailable: true, preparationMinutes: 12 },
  { name: "Lontong Sayur", category: "berat", price: 30000, description: "Lontong, sayur, dan santan", isAvailable: true, preparationMinutes: 10 },
];

/** Akun demo untuk 4 role. Password semuanya "lomblen123" (WAJIB diganti di produksi). */
export const SEED_USERS: {
  name: string;
  username: string;
  password: string;
  role: "admin" | "manager" | "cashier" | "waiter";
}[] = [
  { name: "Budi Santoso", username: "admin", password: "lomblen123", role: "admin" },
  { name: "Siti Rahma", username: "manager", password: "lomblen123", role: "manager" },
  { name: "Andi Pratama", username: "kasir", password: "lomblen123", role: "cashier" },
  { name: "Dewi Lestari", username: "pelayan", password: "lomblen123", role: "waiter" },
];
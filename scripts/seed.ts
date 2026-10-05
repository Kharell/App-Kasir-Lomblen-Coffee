/**
 * Script seeder database: `npm run seed`
 *
 * Mengisi koleksi Menu dan User di MongoDB dengan data awal.
 * Aman dijalankan berulang kali: data yang sudah ada dilewati.
 *
 * Prasyarat: MONGODB_URI harus diisi di .env.local.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { SEED_MENU, SEED_USERS } from "../src/lib/seed-data";
import { MenuModel } from "../src/models/Menu";
import { UserModel } from "../src/models/User";
import { hashPassword } from "../src/lib/auth";

const URI = process.env.MONGODB_URI?.trim();

async function main() {
  if (!URI) {
    console.error(
      "[seed] MONGODB_URI belum diatur di .env.local.\n" +
        "Contoh: MONGODB_URI=mongodb://127.0.0.1:27017/lomblen-cofe\n" +
        "Tidak perlu menjalankan seed bila memakai mode demo (in-memory)."
    );
    process.exit(1);
  }

  await mongoose.connect(URI, { serverSelectionTimeoutMS: 8000 });
  console.log(`[seed] Terhubung ke ${URI.replace(/\/\/[^@]*@/, "//***@")}`);

  // ---- Menu ----
  const menuCount = await MenuModel.countDocuments();
  if (menuCount === 0) {
    await MenuModel.insertMany(SEED_MENU);
    console.log(`[seed] ${SEED_MENU.length} item menu dibuat.`);
  } else {
    console.log(`[seed] Menu sudah ada (${menuCount} item), dilewati.`);
  }

  // ---- User ----
  let created = 0;
  for (const u of SEED_USERS) {
    const exists = await UserModel.exists({ username: u.username });
    if (exists) continue;
    await UserModel.create({
      name: u.name,
      username: u.username,
      role: u.role,
      passwordHash: await hashPassword(u.password),
      isActive: true,
    });
    created += 1;
  }
  console.log(
    created > 0
      ? `[seed] ${created} akun pengguna dibuat (password: lomblen123 - WAJIB diganti).`
      : "[seed] Akun pengguna sudah ada, dilewati."
  );

  await mongoose.disconnect();
  console.log("[seed] Selesai.");
}

main().catch((err) => {
  console.error("[seed] Gagal:", err.message);
  process.exit(1);
});

import mongoose from "mongoose";

/**
 * Koneksi MongoDB dengan cache global (pola resmi Next.js) supaya
 * Fast Refresh di mode dev tidak membuka koneksi baru setiap render.
 */
const MONGODB_URI = process.env.MONGODB_URI?.trim();

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Disimpan di globalThis agar tidak hilang saat modul di-reload dev.
const globalForMongoose = globalThis as unknown as {
  __lomblenMongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.__lomblenMongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.__lomblenMongoose = cache;

/** Mode demo: MongoDB tidak dikonfigurasi -> aplikasi tetap jalan dengan data in-memory. */
export function isDatabaseEnabled(): boolean {
  return Boolean(MONGODB_URI);
}

export async function connectDB(): Promise<typeof mongoose | null> {
  if (!MONGODB_URI) return null;
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 4000,
      })
      .catch((err) => {
        console.warn(
          "[db] Gagal terhubung ke MongoDB, beralih ke mode demo in-memory:",
          err.message
        );
        cache.promise = null;
        return null as unknown as typeof mongoose;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

/**
 * Dipakai API route: coba DB, kalau gagal otomatis pakai store in-memory.
 *
 * Catatan: kedua callback boleh mengembalikan tipe berbeda. Parameter
 * generik `T` diambil dari cabang database; cabang fallback boleh
 * mengembalikan subtype atau bentuk lain yang tetap kompatibel di sisi pemanggil.
 */
export async function withDatabase<T>(
  runner: () => Promise<T>,
  fallback: () => Promise<unknown>
): Promise<T> {
  const conn = await connectDB();
  if (!conn) return (await fallback()) as T;
  try {
    return await runner();
  } catch (err) {
    console.warn("[db] Query gagal, memakai fallback in-memory:", err);
    return (await fallback()) as T;
  }
}
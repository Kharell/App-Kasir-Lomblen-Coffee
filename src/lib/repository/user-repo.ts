import { connectDB, withDatabase } from "@/lib/db";
import { getDemoStore, type DemoUser } from "@/lib/demo-store";
import { hashPassword } from "@/lib/auth";
import { UserModel } from "@/models/User";
import { SEED_USERS } from "@/lib/seed-data";
import type { Role } from "@/types";

/** Repository User: autentikasi, daftar karyawan, seed akun awal. */

export interface PublicUser {
  _id: string;
  name: string;
  username: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface FoundUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  /** Hash bcrypt bila tersimpan di MongoDB, plaintext bila mode demo. */
  passwordHash: string;
  isActive: boolean;
  /** Menentukan hash mana yang harus dipakai saat verifikasi password. */
  isHashed: boolean;
}

/**
 * Cari user berdasarkan username.
 * Mengembalikan `isHashed=false` bila data berasal dari store in-memory,
 * sehingga pemanggil tahu kapan harus memakai perbandingan plaintext.
 */
export async function findUserByUsername(
  username: string
): Promise<FoundUser | null> {
  return withDatabase(
    async () => {
      const doc = await UserModel.findOne({ username: username.toLowerCase() }).lean();
      if (!doc) return null;
      return {
        id: String(doc._id),
        name: String(doc.name),
        username: String(doc.username),
        role: doc.role as Role,
        passwordHash: String(doc.passwordHash),
        isActive: Boolean(doc.isActive),
        isHashed: true,
      };
    },
    async () => {
      const user = getDemoStore().users.find((u) => u.username === username.toLowerCase());
      return user
        ? {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            // Mode demo: plaintext lokal, tanpa hashing.
            passwordHash: user.password,
            isActive: user.isActive,
            isHashed: false,
          }
        : null;
    }
  );
}

export async function listUsers(): Promise<PublicUser[]> {
  return withDatabase(
    async () => {
      const docs = await UserModel.find({}).sort({ name: 1 }).lean();
      return docs.map((d) => ({
        _id: String(d._id),
        name: String(d.name),
        username: String(d.username),
        role: d.role as Role,
        isActive: Boolean(d.isActive),
        lastLoginAt: d.lastLoginAt ? new Date(d.lastLoginAt).toISOString() : undefined,
      }));
    },
    async () =>
      getDemoStore().users.map((u) => ({
        _id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: undefined,
      }))
  );
}

export async function createUser(input: {
  name: string;
  username: string;
  password: string;
  role: Role;
}): Promise<PublicUser> {
  const passwordHash = await hashPassword(input.password);

  return withDatabase(
    async () => {
      const doc = await UserModel.create({ ...input, passwordHash });
      return {
        _id: String(doc._id),
        name: doc.name,
        username: doc.username,
        role: doc.role as Role,
        isActive: doc.isActive,
      };
    },
    async () => {
      const store = getDemoStore();
      const created: DemoUser = {
        id: `user-${Date.now()}`,
        name: input.name,
        username: input.username.toLowerCase(),
        role: input.role,
        isActive: true,
        // Mode demo: kredensial disimpan lokal tanpa hashing.
        // Jangan pernah meniru pola ini saat MongoDB aktif.
        password: input.password,
      };
      store.users.push(created);
      return {
        _id: created.id,
        name: created.name,
        username: created.username,
        role: created.role,
        isActive: true,
      };
    }
  );
}

export async function setUserActive(
  id: string,
  isActive: boolean
): Promise<PublicUser | null> {
  return withDatabase(
    async () => {
      const doc = await UserModel.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
      if (!doc) return null;
      return {
        _id: String(doc._id),
        name: String(doc.name),
        username: String(doc.username),
        role: doc.role as Role,
        isActive: Boolean(doc.isActive),
      };
    },
    async () => {
      const store = getDemoStore();
      const user = store.users.find((u) => u.id === id);
      if (!user) return null;
      user.isActive = isActive;
      return {
        _id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        isActive,
      };
    }
  );
}

export async function markLogin(id: string): Promise<void> {
  await withDatabase(
    async () => {
      await UserModel.findByIdAndUpdate(id, { lastLoginAt: new Date() });
    },
    async () => {
      /* mode demo: tidak perlu menyimpan waktu login */
    }
  );
}

/** Seed 4 akun demo (admin, manager, kasir, pelayan). */
export async function ensureUsersSeeded(): Promise<void> {
  const conn = await connectDB();
  if (!conn) return;
  try {
    const count = await UserModel.estimatedDocumentCount();
    if (count === 0) {
      await UserModel.insertMany(
        await Promise.all(
          SEED_USERS.map(async (u) => ({
            name: u.name,
            username: u.username,
            role: u.role,
            passwordHash: await hashPassword(u.password),
            isActive: true,
          }))
        )
      );
      console.log(`[seed] ${SEED_USERS.length} akun pengguna dibuat.`);
    }
  } catch (err) {
    console.warn("[seed] gagal seed user:", err);
  }
}
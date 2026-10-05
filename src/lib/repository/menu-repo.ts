import { connectDB, withDatabase } from "@/lib/db";
import { getDemoStore } from "@/lib/demo-store";
import { MenuModel } from "@/models/Menu";
import type { MenuCategory, MenuItem } from "@/types";

/**
 * Repository Menu: satu-satunya jalan akses data menu.
 * Otomatis memakai MongoDB bila tersedia, else jatuh ke store in-memory.
 */

function normalize(doc: Record<string, unknown>): MenuItem {
  return {
    _id: String(doc._id),
    name: String(doc.name),
    category: doc.category as MenuCategory,
    price: Number(doc.price),
    description: doc.description ? String(doc.description) : undefined,
    imageUrl: doc.imageUrl ? String(doc.imageUrl) : undefined,
    isAvailable: Boolean(doc.isAvailable ?? true),
    preparationMinutes: Number(doc.preparationMinutes ?? 5),
  };
}

export async function listMenu(options?: {
  category?: MenuCategory;
  onlyAvailable?: boolean;
}): Promise<MenuItem[]> {
  const { category, onlyAvailable } = options ?? {};

  return withDatabase(
    async () => {
      const filter: Record<string, unknown> = {};
      if (category) filter.category = category;
      if (onlyAvailable) filter.isAvailable = true;
      const docs = await MenuModel.find(filter)
        .sort({ category: 1, name: 1 })
        .lean();
      return docs.map((d) => normalize(d as unknown as Record<string, unknown>));
    },
    async () => {
      const { menu } = getDemoStore();
      return menu
        .filter((m) => (category ? m.category === category : true))
        .filter((m) => (onlyAvailable ? m.isAvailable : true))
        .sort((a, b) =>
          a.category === b.category
            ? a.name.localeCompare(b.name, "id")
            : a.category.localeCompare(b.category)
        )
        .map((m) => ({ ...m }));
    }
  );
}

/** Seed 28 item awal bila koleksi masih kosong. */
export async function ensureMenuSeeded(): Promise<void> {
  const conn = await connectDB();
  if (!conn) return;
  try {
    const count = await MenuModel.estimatedDocumentCount();
    if (count === 0) {
      const { SEED_MENU } = await import("@/lib/seed-data");
      await MenuModel.insertMany(SEED_MENU);
      console.log(`[seed] ${SEED_MENU.length} item menu dibuat.`);
    }
  } catch (err) {
    console.warn("[seed] gagal seed menu:", err);
  }
}

export async function createMenu(
  input: Omit<MenuItem, "_id">
): Promise<MenuItem> {
  return withDatabase(
    async () => {
      const doc = await MenuModel.create(input);
      return normalize(doc.toObject() as unknown as Record<string, unknown>);
    },
    async () => {
      const { menu } = getDemoStore();
      const created: MenuItem = { ...input, _id: `menu-${Date.now()}` };
      menu.push(created);
      return { ...created };
    }
  );
}

export async function updateMenu(
  id: string,
  input: Partial<Omit<MenuItem, "_id">>
): Promise<MenuItem | null> {
  return withDatabase(
    async () => {
      const doc = await MenuModel.findByIdAndUpdate(id, input, {
        new: true,
        runValidators: true,
      }).lean();
      return doc ? normalize(doc as unknown as Record<string, unknown>) : null;
    },
    async () => {
      const { menu } = getDemoStore();
      const idx = menu.findIndex((m) => m._id === id);
      if (idx === -1) return null;
      menu[idx] = { ...menu[idx], ...input };
      return { ...menu[idx] };
    }
  );
}

/** Toggle stok/menu tersedia — aksi tercepat untuk kasir. */
export async function toggleMenuAvailability(
  id: string
): Promise<MenuItem | null> {
  return withDatabase(
    async () => {
      const doc = await MenuModel.findById(id).lean();
      if (!doc) return null;
      const doc2 = await MenuModel.findByIdAndUpdate(
        id,
        { isAvailable: !doc.isAvailable },
        { new: true }
      ).lean();
      return doc2 ? normalize(doc2 as unknown as Record<string, unknown>) : null;
    },
    async () => {
      const { menu } = getDemoStore();
      const item = menu.find((m) => m._id === id);
      if (!item) return null;
      item.isAvailable = !item.isAvailable;
      return { ...item };
    }
  );
}
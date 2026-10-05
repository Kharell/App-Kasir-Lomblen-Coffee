import { NextResponse, type NextRequest } from "next/server";
import { createMenu, ensureMenuSeeded, listMenu } from "@/lib/repository/menu-repo";
import { requireAuth } from "@/lib/auth";
import { CATEGORY_LABEL, type MenuCategory, type MenuItem } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/menu?category=kopi&available=true */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "order:create");
  if ("error" in auth) return auth.error;

  await ensureMenuSeeded();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as MenuCategory | null;
  const onlyAvailable = searchParams.get("available") === "true";

  const items = await listMenu({
    category: category ?? undefined,
    onlyAvailable,
  });

  return NextResponse.json({ items, categories: CATEGORY_LABEL });
}

const VALID_CATEGORIES: MenuCategory[] = ["kopi", "non-kopi", "ringan", "berat"];

/** POST /api/menu — hanya Admin (menu:manage). */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "menu:manage");
  if ("error" in auth) return auth.error;

  let body: Partial<MenuItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const price = Number(body.price);
  const category = body.category as MenuCategory;

  const errors: Record<string, string> = {};
  if (name.length < 3) errors.name = "Nama minimal 3 karakter.";
  if (!Number.isFinite(price) || price <= 0)
    errors.price = "Harga harus lebih dari 0.";
  if (!VALID_CATEGORIES.includes(category))
    errors.category = "Kategori tidak valid.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Data menu tidak valid.", details: errors },
      { status: 422 }
    );
  }

  const created = await createMenu({
    name,
    price: Math.round(price),
    category,
    description: body.description?.trim(),
    imageUrl: body.imageUrl?.trim(),
    isAvailable: body.isAvailable ?? true,
    preparationMinutes: body.preparationMinutes ?? 5,
  });

  return NextResponse.json({ item: created }, { status: 201 });
}
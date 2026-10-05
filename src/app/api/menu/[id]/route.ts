import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateMenu, toggleMenuAvailability } from "@/lib/repository/menu-repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/menu/[id] — ubah data menu (Admin). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req, "menu:manage");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim().length >= 3)
    payload.name = body.name.trim();
  if (typeof body.price === "number" && body.price > 0)
    payload.price = Math.round(body.price);
  if (typeof body.description === "string") payload.description = body.description.trim();
  if (typeof body.isAvailable === "boolean") payload.isAvailable = body.isAvailable;
  if (typeof body.preparationMinutes === "number") payload.preparationMinutes = body.preparationMinutes;

  const updated = await updateMenu(id, payload);
  if (!updated) {
    return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}

/**
 * POST /api/menu/[id]/toggle — stok habis / tersedia lagi.
 * Membolehkan kasir & manajer demi operasional cepat.
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req, "order:create");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const updated = await toggleMenuAvailability(id);
  if (!updated) {
    return NextResponse.json({ error: "Menu tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ item: updated });
}
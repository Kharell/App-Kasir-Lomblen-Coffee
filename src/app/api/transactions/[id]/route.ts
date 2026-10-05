import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { voidTransaction } from "@/lib/repository/transaction-repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/transactions/[id] — void / pembatalan pesanan.
 * Hanya Manajer & Admin (order:void). Alasan wajib diisi untuk jejak audit.
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req, "order:void");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (reason.length < 3) {
    return NextResponse.json(
      { error: "Alasan pembatalan wajib diisi (minimal 3 karakter)." },
      { status: 422 }
    );
  }

  const result = await voidTransaction(id, reason);
  if (!result) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ transaction: result });
}
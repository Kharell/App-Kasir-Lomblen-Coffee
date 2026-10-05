import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/repository/transaction-repo";
import { calculateTotals } from "@/lib/utils";
import type { CartLine, PaymentMethod } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_METHODS: PaymentMethod[] = ["cash", "qris", "ewallet", "va"];

/** GET /api/transactions?limit=20 — riwayat shift aktif. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "order:create");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? 20) || 20, 100);
  const transactions = await listTransactions({ limit });
  return NextResponse.json({ transactions });
}

/**
 * POST /api/transactions — proses pembayaran.
 *
 * PENTING: total dihitung ulang di server memakai `calculateTotals`.
 * Nilai dari client tidak pernah dipercaya untuk nilai uang.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "payment:process");
  if ("error" in auth) return auth.error;
  const { session } = auth;

  let body: {
    lines?: CartLine[];
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    discountRate?: number;
    customerName?: string;
    tableNo?: string;
    note?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const lines = (body.lines ?? []).filter((l) => l && Number(l.qty) > 0);

  if (lines.length === 0) {
    return NextResponse.json(
      { error: "Keranjang masih kosong." },
      { status: 422 }
    );
  }

  if (!body.paymentMethod || !VALID_METHODS.includes(body.paymentMethod)) {
    return NextResponse.json(
      { error: "Metode pembayaran tidak valid." },
      { status: 422 }
    );
  }

  const sanitizedLines: CartLine[] = lines.map((l) => ({
    menuId: String(l.menuId),
    name: String(l.name).slice(0, 80),
    price: Math.max(0, Math.round(Number(l.price))),
    qty: Math.max(1, Math.min(99, Math.round(Number(l.qty)))),
    note: l.note ? String(l.note).slice(0, 120) : undefined,
  }));

  // Total dihitung server-side (tidak memakai totals dari client).
  const subtotal = sanitizedLines.reduce((sum, l) => sum + l.price * l.qty, 0);
  const totals = calculateTotals(subtotal, { discountRate: body.discountRate ?? 0 });

  let paidAmount: number | undefined;
  let changeAmount: number | undefined;

  if (body.paymentMethod === "cash") {
    paidAmount = Math.max(0, Math.round(Number(body.paidAmount) || 0));
    if (paidAmount < totals.total) {
      return NextResponse.json(
        {
          error: `Uang diterima (${paidAmount}) kurang dari total (${totals.total}).`,
        },
        { status: 422 }
      );
    }
    changeAmount = paidAmount - totals.total;
  }

  const transaction = await createTransaction({
    lines: sanitizedLines,
    totals,
    paymentMethod: body.paymentMethod,
    paymentStatus: "paid",
    status: "paid",
    paidAmount,
    changeAmount,
    cashierId: session.id,
    cashierName: session.name,
    customerName: body.customerName?.trim().slice(0, 60),
    tableNo: body.tableNo?.trim().slice(0, 10),
    note: body.note?.trim().slice(0, 200),
  });

  return NextResponse.json({ transaction }, { status: 201 });
}
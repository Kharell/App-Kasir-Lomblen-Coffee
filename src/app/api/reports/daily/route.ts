import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDailyReport } from "@/lib/repository/transaction-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/reports/daily?date=2026-01-10 — laporan penjualan harian. */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "report:view");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;
  const report = await getDailyReport(date);
  return NextResponse.json({ report });
}
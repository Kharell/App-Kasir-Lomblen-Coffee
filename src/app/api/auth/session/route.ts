import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseEnabled } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/auth/session — cek sesi aktif untuk client component. */
export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    user: session,
    databaseEnabled: isDatabaseEnabled(),
  });
}
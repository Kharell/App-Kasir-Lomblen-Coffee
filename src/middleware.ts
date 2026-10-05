import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { hasPermission, type Permission } from "@/types";

/**
 * Route protection tingkat edge.
 * - /kasir  -> semua role yang punya izin order:create
 * - /dashboard -> hanya manajer & admin (report:view)
 *
 * Catatan: otorisasi sesungguhnya tetap ditegakkan ulang di setiap API route.
 * Middleware hanya lapisan pertama untuk UX, bukan pengganti otorisasi server.
 */
const PROTECTED: { prefix: string; permission: Permission }[] = [
  { prefix: "/kasir", permission: "order:create" },
  { prefix: "/dashboard", permission: "report:view" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Belum login -> ke halaman login, simpan tujuan untuk redirect balik.
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Sudah login tapi role tidak berhak -> tolak ke dashboard yang sesuai.
  if (!hasPermission(session.role, rule.permission)) {
    const url = req.nextUrl.clone();
    const fallback = session.role === "waiter" ? "/kasir" : "/dashboard";
    url.pathname = fallback;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/kasir/:path*", "/dashboard/:path*"],
};
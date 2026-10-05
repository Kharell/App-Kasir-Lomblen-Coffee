import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/session";
import { hasPermission, type Permission, type SessionUser } from "@/types";

/**
 * Auth helper sisi server (Node.js Runtime).
 * Fungsi JWT murni ada di `@/lib/session` agar bisa dipakai middleware (Edge).
 */
export { SESSION_COOKIE, createSessionToken, verifySessionToken };

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Baca session pada Route Handler / Server Component. */
export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Guard untuk API route.
 * Mengembalikan session bila valid, atau Response 401/403 siap kirim.
 */
export async function requireAuth(
  req: NextRequest,
  permission?: Permission
): Promise<{ session: SessionUser } | { error: NextResponse }> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Sesi tidak valid atau sudah berakhir. Silakan login kembali." },
        { status: 401 }
      ),
    };
  }

  if (permission && !hasPermission(session.role, permission)) {
    return {
      error: NextResponse.json(
        { error: `Akses ditolak. Fitur ini tidak tersedia untuk peran ${session.role}.` },
        { status: 403 }
      ),
    };
  }

  return { session };
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, // tidak bisa dibaca JavaScript -> mitigasi XSS
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // proteksi CSRF pada navigasi lintas situs
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam = satu shift
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
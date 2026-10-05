import { SignJWT, jwtVerify } from "jose";
import type { Role, SessionUser } from "@/types";

/**
 * Utilitas JWT murni tanpa dependensi Node.js.
 *
 * Dipisah dari auth.ts karena `middleware.ts` berjalan di Edge Runtime,
 * yang tidak mendukung `bcryptjs`. Middleware hanya butuh verifikasi token.
 */

export const SESSION_COOKIE = "lomblen_cofe_session";

/**
 * Secret JWT. Di produksi WAJIB diubah lewat env `JWT_SECRET`.
 * Fallback di sini hanya agar mode demo bisa jalan tanpa konfigurasi.
 */
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET?.trim() ||
    "lomblen-cofe-demo-secret-key-min-32-chars!!"
);

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    name: user.name,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("lomblen-cofe")
    .setExpirationTime(process.env.JWT_EXPIRES_IN || "8h")
    .sign(SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { issuer: "lomblen-cofe" });
    if (!payload.sub || typeof payload.role !== "string") return null;
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      username: String(payload.username ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
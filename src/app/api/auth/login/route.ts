import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { findUserByUsername, markLogin } from "@/lib/repository/user-repo";
import { ROLES, type Role } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Perbandingan string dengan waktu tetap (mitigasi timing attack). */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifikasi password sesuai cara penyimpanan datanya:
 * - `isHashed` true  -> password tersimpan sebagai hash bcrypt (MongoDB).
 * - `isHashed` false -> mode demo in-memory, dibandingkan timing-safe.
 *
 * Catatan: password plaintext hanya dipakai pada store in-memory mode demo.
 * Data di MongoDB selalu disimpan sebagai hash bcrypt.
 */
async function checkPassword(
  plain: string,
  stored: string,
  isHashed: boolean
): Promise<boolean> {
  if (isHashed) return verifyPassword(plain, stored);
  return safeEqual(plain, stored);
}

/**
 * POST /api/auth/login
 * Body: { username, password }
 *
 * Catatan keamanan:
 * - Password dibandingkan dengan fungsi timing-safe.
 * - Pesan error sengaja generik agar tidak membocorkan username mana yang terdaftar.
 */
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  const user = await findUserByUsername(username);

  if (!user) {
    // Tetap lakukan perbandingan agar waktu respons tidak membocorkan
    // apakah username tersebut terdaftar.
    await checkPassword(password, "timing-equalizer", false);
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 }
    );
  }

  if (!(await checkPassword(password, user.passwordHash, user.isHashed))) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 }
    );
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "Akun ini telah dinonaktifkan. Hubungi Admin." },
      { status: 403 }
    );
  }

  const session = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };

  await markLogin(user.id);

  const token = await createSessionToken(session);
  const res = NextResponse.json({ user: session });
  setSessionCookie(res, token);
  return res;
}

/** GET /api/auth/login — daftar akun demo untuk halaman login (mode demo saja). */
export async function GET() {
  const { SEED_USERS } = await import("@/lib/seed-data");
  return NextResponse.json({
    demoAccounts: SEED_USERS.map((u) => ({
      username: u.username,
      role: u.role as Role,
      name: u.name,
    })),
    validRoles: ROLES,
  });
}
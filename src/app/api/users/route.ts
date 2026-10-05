import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createUser, listUsers, setUserActive } from "@/lib/repository/user-repo";
import { ROLES, type Role } from "@/types";

export const runtime = "nodejs";

/** GET /api/users — daftar karyawan (Admin). */
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, "user:manage");
  if ("error" in auth) return auth.error;

  const users = await listUsers();
  return NextResponse.json({ users });
}

/** POST /api/users — tambah karyawan (Admin). */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, "user:manage");
  if ("error" in auth) return auth.error;

  let body: { name?: string; username?: string; password?: string; role?: Role };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format JSON tidak valid." }, { status: 400 });
  }

  const errors: Record<string, string> = {};
  const name = body.name?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const role = body.role;

  if (name.length < 3) errors.name = "Nama minimal 3 karakter.";
  if (!/^[a-z0-9._-]{3,24}$/.test(username))
    errors.username = "Username 3-24 karakter: huruf kecil, angka, titik, strip, underscore.";
  if (password.length < 8) errors.password = "Password minimal 8 karakter.";
  if (!role || !ROLES.includes(role)) errors.role = "Peran tidak valid.";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Data karyawan tidak valid.", details: errors },
      { status: 422 }
    );
  }

  const existing = await listUsers();
  if (existing.some((u) => u.username === username)) {
    return NextResponse.json(
      { error: `Username "${username}" sudah dipakai.` },
      { status: 409 }
    );
  }

  const user = await createUser({ name, username, password, role: role as Role });
  return NextResponse.json({ user }, { status: 201 });
}
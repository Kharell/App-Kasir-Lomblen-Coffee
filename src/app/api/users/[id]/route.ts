import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { setUserActive } from "@/lib/repository/user-repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/users/[id] — aktif/nonaktifkan akun (Admin). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireAuth(req, "user:manage");
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json(
      { error: "Field isActive (boolean) wajib diisi." },
      { status: 422 }
    );
  }

  // Admin tidak boleh menonaktifkan akunnya sendiri (mencegah terkunci).
  if (id === auth.session.id && body.isActive === false) {
    return NextResponse.json(
      { error: "Anda tidak dapat menonaktifkan akun sendiri." },
      { status: 422 }
    );
  }

  const updated = await setUserActive(id, body.isActive);
  if (!updated) {
    return NextResponse.json({ error: "Karyawan tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ user: updated });
}
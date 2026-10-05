import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { PosWorkspace } from "@/components/pos/PosWorkspace";
import { hasPermission } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Halaman POS. Middleware sudah menjaga rute ini,
 * validasi ulang di server tetap dilakukan (defense in depth).
 */
export default async function KasirPage() {
  const session = await getSession();

  if (!session) redirect("/");
  if (!hasPermission(session.role, "order:create")) redirect("/dashboard");

  return <PosWorkspace user={session} />;
}
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { hasPermission } from "@/types";

export const dynamic = "force-dynamic";

/** Panel Manajer & Admin: laporan shift, void pesanan, manajemen menu & karyawan. */
export default async function DashboardPage() {
  const session = await getSession();

  if (!session) redirect("/");
  if (!hasPermission(session.role, "report:view")) redirect("/kasir");

  return <DashboardShell user={session} />;
}
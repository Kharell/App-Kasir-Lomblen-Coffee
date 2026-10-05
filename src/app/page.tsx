import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/types";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

/** Halaman login / pemilihan peran. Sudah login -> langsung ke beranda perannya. */
export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect(hasPermission(session.role, "report:view") ? "/dashboard" : "/kasir");
  }

  return <LoginForm />;
}
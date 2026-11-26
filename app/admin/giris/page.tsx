import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function GirisPage() {
  if (await isValidToken((await cookies()).get(ADMIN_COOKIE)?.value)) redirect("/admin");
  return <LoginForm />;
}

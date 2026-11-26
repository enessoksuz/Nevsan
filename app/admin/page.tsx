import { AdminApp } from "@/components/AdminApp";
import { readContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const content = await readContent();
  return <AdminApp initial={content} />;
}

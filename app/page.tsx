import { cookies } from "next/headers";
import { HomePage } from "@/components/HomePage";
import { readContent } from "@/lib/content";
import { resolveLocale } from "@/lib/content-shared";

export const dynamic = "force-dynamic";

export default async function Page() {
  const content = await readContent();
  const locale = resolveLocale(content, (await cookies()).get("lang")?.value);
  return <HomePage content={content} locale={locale} />;
}

import { NextResponse } from "next/server";
import { readContent } from "@/lib/content";
import { requestOrigin } from "@/lib/origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const lang = String(form.get("lang") || "");
  const content = await readContent();
  const known = content.locales.some((locale) => locale.code === lang);
  const origin = requestOrigin(request);
  const back = new URL("/", origin);
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.origin === origin) {
        back.pathname = ref.pathname;
        back.search = ref.search;
      }
    } catch {
      /* keep home */
    }
  }

  const response = NextResponse.redirect(back, 303);
  if (known) {
    response.cookies.set("lang", lang, {
      path: "/",
      sameSite: "lax",
      secure: origin.startsWith("https:"),
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
    });
  }
  return response;
}

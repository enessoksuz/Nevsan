import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";
import { requestOrigin } from "@/lib/origin";

function isProtected(pathname: string) {
  if (pathname === "/admin/giris" || pathname === "/api/admin/login" || pathname === "/api/admin/logout") {
    return false;
  }
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin/");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isProtected(pathname) && !(await isValidToken(request.cookies.get(ADMIN_COOKIE)?.value))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
    }
    const url = new URL("/admin/giris", requestOrigin(request));
    return NextResponse.redirect(url);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)$).*)"],
};

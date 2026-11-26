import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cookieOptions } from "@/lib/auth";
import { requestOrigin } from "@/lib/origin";

export async function POST(request: Request) {
  const origin = requestOrigin(request);
  const response = NextResponse.redirect(new URL("/admin/giris", origin), 303);
  response.cookies.set(ADMIN_COOKIE, "", {
    ...cookieOptions(origin.startsWith("https:")),
    maxAge: 0,
  });
  return response;
}

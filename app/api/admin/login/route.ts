import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cookieOptions, passwordOk, signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Yönetici şifresi sunucuda tanımlı değil." }, { status: 500 });
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!(await passwordOk(password))) {
    return NextResponse.json({ error: "Şifre hatalı." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await signToken(), cookieOptions(new URL(request.url).protocol === "https:"));
  return response;
}

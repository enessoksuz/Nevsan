import { NextResponse } from "next/server";
import { readContent, saveContent } from "@/lib/content";

export const runtime = "nodejs";

export async function GET() {
  const content = await readContent();
  return NextResponse.json({ content }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  try {
    const content = await saveContent(body);
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Kayıt sırasında bir sorun oldu." }, { status: 500 });
  }
}

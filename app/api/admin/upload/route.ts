import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { NextResponse } from "next/server";
import { removeUpload, updateContent, uploadsDir } from "@/lib/content";
import type { SiteContent } from "@/lib/types";

export const runtime = "nodejs";

function stillUsed(content: SiteContent, src: string) {
  return Boolean(src) && (content.logo === src || content.hero.image === src || content.gallery.some((item) => item.src === src));
}

async function toWebp(file: File, maxEdge: number) {
  if (file.size > 12 * 1024 * 1024) {
    return { error: "Dosya 12 MB sınırını aşıyor.", status: 413 as const };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const output = await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { output };
  } catch {
    return { error: "Bu dosya görsel olarak açılamadı. JPG, PNG veya WEBP yükleyin.", status: 400 as const };
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const kind = form.get("kind");
  const file = form.get("file");
  if (!(file instanceof File) || (kind !== "hero" && kind !== "gallery" && kind !== "logo")) {
    return NextResponse.json({ error: "Dosya seçin." }, { status: 400 });
  }

  const converted = await toWebp(file, kind === "logo" ? 800 : 2400);
  if ("error" in converted) {
    return NextResponse.json({ error: converted.error }, { status: converted.status });
  }

  await mkdir(uploadsDir(), { recursive: true });
  const name = `${randomUUID()}.webp`;
  const src = `/uploads/${name}`;
  await writeFile(path.join(uploadsDir(), name), converted.output);

  try {
    let previous = "";
    const itemId = randomUUID().replace(/-/g, "").slice(0, 16);
    const content = await updateContent((current) => {
      if (kind === "logo") {
        previous = current.logo;
        return { ...current, logo: src };
      }
      if (kind === "hero") {
        previous = current.hero.image;
        return { ...current, hero: { ...current.hero, image: src } };
      }
      return {
        ...current,
        gallery: [...current.gallery, { id: itemId, src, alt: {} }],
      };
    });

    if ((kind === "hero" || kind === "logo") && previous && previous !== src && !stillUsed(content, previous)) {
      await removeUpload(previous);
    }

    const item = content.gallery.find((entry) => entry.src === src) ?? null;
    return NextResponse.json({ src, item });
  } catch {
    await removeUpload(src);
    return NextResponse.json({ error: "Görsel kaydedilemedi." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: { hero?: boolean; logo?: boolean; id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const hero = Boolean(body?.hero);
  const logo = Boolean(body?.logo);
  const id = typeof body?.id === "string" ? body.id : "";
  let removed = "";
  const content = await updateContent((current) => {
    if (logo) {
      removed = current.logo;
      return { ...current, logo: "" };
    }
    if (hero) {
      removed = current.hero.image;
      return { ...current, hero: { ...current.hero, image: "" } };
    }
    const item = current.gallery.find((entry) => entry.id === id);
    if (!item) return current;
    removed = item.src;
    return { ...current, gallery: current.gallery.filter((entry) => entry.id !== id) };
  });

  if (removed && !stillUsed(content, removed)) {
    await removeUpload(removed);
  }
  return NextResponse.json({ ok: true });
}

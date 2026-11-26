import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises";
import path from "path";
import { defaultContent, normalize } from "./content-shared";
import type { SiteContent } from "./types";

const file = path.join(process.cwd(), "data", "site.json");

export function uploadsDir() {
  return path.join(process.cwd(), "public", "uploads");
}

export function absFromPublicSrc(src: string) {
  const name = src.startsWith("/uploads/") ? src.slice("/uploads/".length) : "";
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return null;
  return path.join(uploadsDir(), name);
}

export async function readContent(): Promise<SiteContent> {
  try {
    const raw = await readFile(file, "utf8");
    return normalize(JSON.parse(raw));
  } catch {
    return normalize(defaultContent);
  }
}

async function writeAtomic(data: SiteContent) {
  const dir = path.dirname(file);
  await mkdir(dir, { recursive: true });
  const tmp = path.join(dir, `.site-${process.pid}-${Date.now()}.tmp`);
  await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await rename(tmp, file);
}

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function saveContent(input: unknown) {
  return enqueue(async () => {
    const data = normalize(input);
    await writeAtomic(data);
    return data;
  });
}

export function updateContent(mutator: (current: SiteContent) => SiteContent) {
  return enqueue(async () => {
    const current = await readContent();
    const data = normalize(mutator(current));
    await writeAtomic(data);
    return data;
  });
}

export async function removeUpload(src: string) {
  const abs = absFromPublicSrc(src);
  if (!abs) return;
  await unlink(abs).catch(() => undefined);
}

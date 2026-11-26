import type { GalleryItem, LabelKey, Locale, Localized, SiteContent } from "./types";

export const labelKeys = [
  "products",
  "contact",
  "address",
  "email",
  "phone",
  "legalName",
  "taxOffice",
  "taxNumber",
  "galleryEmpty",
  "close",
  "previous",
  "next",
  "skip",
  "admin",
] as const satisfies readonly LabelKey[];

const uploadPath = /^\/uploads\/[A-Za-z0-9._-]+$/;

export const defaultContent: SiteContent = {
  defaultLocale: "tr",
  locales: [
    { code: "tr", label: "Türkçe", dir: "ltr" },
    { code: "en", label: "English", dir: "ltr" },
  ],
  contact: {
    address: "Fatih Mah. 9008 Sk. B2 Blok No: 103/3H\nAkyazı / Sakarya",
    email: "info@nevsanambalaj.com",
    phone: "",
  },
  company: {
    legalName: "NEVSAN AMBALAJ İMALAT SANAYİ VE TİCARET LİMİTED ŞİRKETİ",
    taxOffice: "Akyazı",
    taxNumber: "6312101723",
  },
  logo: "",
  hero: {
    image: "",
    title: {
      tr: "Ürününüz için doğru ambalaj.",
      en: "The right pack for your product.",
    },
    text: {
      tr: "Koli, kutu, poşet ve koruyucu film. Ölçüyü ve baskıyı birlikte belirleriz.",
      en: "Cartons, boxes, bags and protective film. We set the size and the print with you.",
    },
    alt: { tr: "", en: "" },
  },
  labels: {
    products: { tr: "Ürünler", en: "Products" },
    contact: { tr: "İletişim", en: "Contact" },
    address: { tr: "Adres", en: "Address" },
    email: { tr: "E-posta", en: "Email" },
    phone: { tr: "Telefon", en: "Phone" },
    legalName: { tr: "Ticaret ünvanı", en: "Legal name" },
    taxOffice: { tr: "Vergi dairesi", en: "Tax office" },
    taxNumber: { tr: "Vergi kimlik no", en: "Tax ID" },
    galleryEmpty: { tr: "Henüz görsel yok.", en: "No photos yet." },
    close: { tr: "Kapat", en: "Close" },
    previous: { tr: "Önceki", en: "Previous" },
    next: { tr: "Sonraki", en: "Next" },
    skip: { tr: "İçeriğe geç", en: "Skip to content" },
    admin: { tr: "Yönetim", en: "Admin" },
  },
  gallery: [],
};

function clip(value: unknown, max: number) {
  return (typeof value === "string" ? value : "").replace(/\u0000/g, "").slice(0, max);
}

function locMap(value: unknown, codes: string[], max: number): Localized {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const out: Localized = {};
  for (const code of codes) out[code] = clip(source[code], max);
  return out;
}

function parseLocales(value: unknown): Locale[] {
  if (!Array.isArray(value)) return defaultContent.locales.map((locale) => ({ ...locale }));
  const out: Locale[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const code = clip(record.code, 8).toLowerCase().trim();
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code) || seen.has(code)) continue;
    seen.add(code);
    out.push({
      code,
      label: clip(record.label, 40).trim() || code.toUpperCase(),
      dir: record.dir === "rtl" ? "rtl" : "ltr",
    });
    if (out.length >= 12) break;
  }
  return out.length > 0 ? out : defaultContent.locales.map((locale) => ({ ...locale }));
}

function imagePath(value: unknown) {
  return typeof value === "string" && uploadPath.test(value) ? value : "";
}

function parseGallery(value: unknown, codes: string[]): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  const out: GalleryItem[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const src = imagePath(record.src);
    if (!src) continue;
    let id = clip(record.id, 40);
    if (!/^[A-Za-z0-9_-]{4,40}$/.test(id) || seen.has(id)) {
      id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    }
    seen.add(id);
    out.push({ id, src, alt: locMap(record.alt, codes, 180) });
    if (out.length >= 48) break;
  }
  return out;
}

export function normalize(input: unknown): SiteContent {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const locales = parseLocales(source.locales);
  const codes = locales.map((locale) => locale.code);
  const requested = clip(source.defaultLocale, 8).toLowerCase();
  const defaultLocale = codes.includes(requested) ? requested : codes[0];
  const contact = source.contact && typeof source.contact === "object" ? (source.contact as Record<string, unknown>) : {};
  const company = source.company && typeof source.company === "object" ? (source.company as Record<string, unknown>) : {};
  const hero = source.hero && typeof source.hero === "object" ? (source.hero as Record<string, unknown>) : {};
  const labelsIn = source.labels && typeof source.labels === "object" ? (source.labels as Record<string, unknown>) : {};
  const labels = {} as SiteContent["labels"];
  for (const key of labelKeys) labels[key] = locMap(labelsIn[key], codes, key === "galleryEmpty" ? 180 : 80);

  return {
    defaultLocale,
    locales,
    contact: {
      address: clip(contact.address, 400),
      email: clip(contact.email, 120).trim(),
      phone: clip(contact.phone, 40).trim(),
    },
    company: {
      legalName: clip(company.legalName, 180).trim(),
      taxOffice: clip(company.taxOffice, 80).trim(),
      taxNumber: clip(company.taxNumber, 20).trim(),
    },
    logo: imagePath(source.logo),
    hero: {
      image: imagePath(hero.image),
      title: locMap(hero.title, codes, 180),
      text: locMap(hero.text, codes, 600),
      alt: locMap(hero.alt, codes, 180),
    },
    labels,
    gallery: parseGallery(source.gallery, codes),
  };
}

export function tx(map: Localized | undefined, code: string, fallbackCode: string) {
  const own = map?.[code]?.trim();
  if (own) return own;
  const fallback = map?.[fallbackCode]?.trim();
  if (fallback) return fallback;
  for (const value of Object.values(map || {})) {
    if (value?.trim()) return value.trim();
  }
  return "";
}

export function resolveLocale(content: SiteContent, code: string | undefined): Locale {
  return (
    content.locales.find((locale) => locale.code === code) ||
    content.locales.find((locale) => locale.code === content.defaultLocale) ||
    content.locales[0]
  );
}

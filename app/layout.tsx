import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { cookies, headers } from "next/headers";
import { readContent } from "@/lib/content";
import { resolveLocale } from "@/lib/content-shared";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nevsan Ambalaj",
    template: "%s · Nevsan Ambalaj",
  },
  description: "Koli, kutu, poşet ve koruyucu film.",
};

export const viewport: Viewport = {
  themeColor: "#0c2c5c",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get("x-pathname") ?? "/";
  let lang = "tr";
  let dir: "ltr" | "rtl" = "ltr";
  if (!pathname.startsWith("/admin")) {
    const content = await readContent();
    const locale = resolveLocale(content, (await cookies()).get("lang")?.value);
    lang = locale.code;
    dir = locale.dir;
  }

  return (
    <html lang={lang} dir={dir} className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

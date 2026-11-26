"use client";

import { FormEvent, useEffect, useState } from "react";
import type { Direction, GalleryItem, Locale, SiteContent } from "@/lib/types";

const labelFields: { key: keyof SiteContent["labels"]; name: string }[] = [
  { key: "products", name: "Ürünler başlığı" },
  { key: "contact", name: "İletişim başlığı" },
  { key: "address", name: "Adres etiketi" },
  { key: "email", name: "E-posta etiketi" },
  { key: "phone", name: "Telefon etiketi" },
  { key: "legalName", name: "Ticaret ünvanı etiketi" },
  { key: "taxOffice", name: "Vergi dairesi etiketi" },
  { key: "taxNumber", name: "Vergi no etiketi" },
  { key: "galleryEmpty", name: "Galeri boşken" },
  { key: "previous", name: "Önceki" },
  { key: "next", name: "Sonraki" },
  { key: "close", name: "Kapat" },
  { key: "skip", name: "İçeriğe geç" },
  { key: "admin", name: "Yönetim bağlantısı" },
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function AdminApp({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [active, setActive] = useState(initial.defaultLocale);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftCode, setDraftCode] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftDir, setDraftDir] = useState<Direction>("ltr");
  const dirty = JSON.stringify(content) !== JSON.stringify(saved);
  const locale = content.locales.find((item) => item.code === active) ?? content.locales[0];

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function patchLocale(code: string, patch: Partial<Locale>) {
    setContent((current) => ({
      ...current,
      locales: current.locales.map((item) => (item.code === code ? { ...item, ...patch } : item)),
    }));
  }

  function addLocale() {
    const code = draftCode.toLowerCase().trim();
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code)) {
      setStatus("Dil kodu iki harf olmalı. Örnek: de, ar, ru.");
      return;
    }
    if (content.locales.some((item) => item.code === code)) {
      setStatus("Bu dil zaten var.");
      return;
    }
    const label = draftLabel.trim() || code.toUpperCase();
    setContent((current) => ({
      ...current,
      locales: [...current.locales, { code, label, dir: draftDir }],
    }));
    setActive(code);
    setDraftCode("");
    setDraftLabel("");
    setDraftDir("ltr");
    setStatus("Dil eklendi. Metinleri yazıp kaydedin. Boş kalanlar varsayılan dilde görünür.");
  }

  function removeLocale(code: string) {
    if (content.locales.length <= 1) return;
    const locales = content.locales.filter((item) => item.code !== code);
    setContent((current) => ({
      ...current,
      locales,
      defaultLocale: current.defaultLocale === code ? locales[0].code : current.defaultLocale,
    }));
    if (active === code) setActive(locales[0].code);
  }

  async function upload(kind: "hero" | "gallery" | "logo", file: File) {
    setUploading(true);
    setStatus("");
    try {
      const body = new FormData();
      body.set("kind", kind);
      body.set("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.href = "/admin/giris";
        return;
      }
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Yüklenemedi.");
      if (kind === "gallery") {
        const item = data.item as GalleryItem;
        setContent((current) => ({ ...current, gallery: [...current.gallery, item] }));
        setSaved((current) => ({ ...current, gallery: [...current.gallery, clone(item)] }));
        return;
      }
      const src = String(data.src || "");
      if (kind === "logo") {
        setContent((current) => ({ ...current, logo: src }));
        setSaved((current) => ({ ...current, logo: src }));
        return;
      }
      setContent((current) => ({ ...current, hero: { ...current.hero, image: src } }));
      setSaved((current) => ({ ...current, hero: { ...current.hero, image: src } }));
    } finally {
      setUploading(false);
    }
  }

  async function removeHero() {
    const response = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero: true }),
    });
    if (response.status === 401) {
      window.location.href = "/admin/giris";
      return;
    }
    if (!response.ok) {
      setStatus("Ana görsel silinemedi.");
      return;
    }
    setContent((current) => ({ ...current, hero: { ...current.hero, image: "" } }));
    setSaved((current) => ({ ...current, hero: { ...current.hero, image: "" } }));
  }

  async function removeLogo() {
    const response = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logo: true }),
    });
    if (response.status === 401) {
      window.location.href = "/admin/giris";
      return;
    }
    if (!response.ok) {
      setStatus("Logo silinemedi.");
      return;
    }
    setContent((current) => ({ ...current, logo: "" }));
    setSaved((current) => ({ ...current, logo: "" }));
  }

  async function removeGallery(id: string) {
    const response = await fetch("/api/admin/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.status === 401) {
      window.location.href = "/admin/giris";
      return;
    }
    if (!response.ok) {
      setStatus("Görsel silinemedi.");
      return;
    }
    setContent((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== id) }));
    setSaved((current) => ({ ...current, gallery: current.gallery.filter((item) => item.id !== id) }));
  }

  function move(id: string, direction: -1 | 1) {
    setContent((current) => {
      const index = current.gallery.findIndex((item) => item.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= current.gallery.length) return current;
      const gallery = current.gallery.slice();
      const [item] = gallery.splice(index, 1);
      gallery.splice(next, 0, item);
      return { ...current, gallery };
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        window.location.href = "/admin/giris";
        return;
      }
      if (!response.ok || !data.content) {
        throw new Error(typeof data.error === "string" ? data.error : "Kaydedilemedi.");
      }
      setContent(data.content);
      setSaved(data.content);
      setActive((current) =>
        data.content.locales.some((item: Locale) => item.code === current) ? current : data.content.defaultLocale,
      );
      setStatus("Kaydedildi.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <header className="admin-top">
        <div className="wrap admin-top-inner">
          <div>
            <p className="eyebrow">Nevsan Ambalaj</p>
            <strong>Yönetim</strong>
          </div>
          <div className="admin-top-actions">
            <a className="btn btn-ghost" href="/" target="_blank" rel="noreferrer">
              Siteyi aç
            </a>
            <form action="/api/admin/logout" method="post">
              <button className="btn btn-ghost" type="submit">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </header>
      <form className="wrap admin-form" onSubmit={onSubmit}>
        <section className="admin-section">
          <h2>Logo</h2>
          <p className="hint">Üst menüde görünür. Şeffaf arka planlı PNG kullanabilirsiniz. Logo yokken Nevsan yazısı durur.</p>
          <div className="hero-admin">
            <div className={content.logo ? "logo-preview has-image" : "logo-preview"}>
              {content.logo ? <img src={content.logo} alt="" /> : <span>Henüz logo yok</span>}
            </div>
            <div className="stack">
              <label className="file-btn">
                {uploading ? "Yükleniyor…" : content.logo ? "Logoyu değiştir" : "Logo yükle"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) {
                      upload("logo", file).catch((error: unknown) => {
                        setStatus(error instanceof Error ? error.message : "Yüklenemedi.");
                      });
                    }
                  }}
                />
              </label>
              {content.logo ? (
                <button className="btn btn-danger" type="button" onClick={removeLogo}>
                  Logoyu kaldır
                </button>
              ) : null}
              <p className="hint">JPG, PNG veya WEBP. En fazla 12 MB.</p>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>Diller</h2>
          <p className="hint">Boş bırakılan metin sitede varsayılan dildeki karşılığıyla görünür.</p>
          <div className="lang-pills" role="tablist" aria-label="Diller">
            {content.locales.map((item) => (
              <button
                key={item.code}
                type="button"
                role="tab"
                aria-selected={item.code === locale.code}
                onClick={() => setActive(item.code)}
              >
                {item.label}
                <small>{item.code.toUpperCase()}</small>
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label>
              Görünen ad
              <input
                value={locale.label}
                maxLength={40}
                onChange={(event) => patchLocale(locale.code, { label: event.target.value })}
              />
            </label>
            <label>
              Yazı yönü
              <select
                value={locale.dir}
                onChange={(event) => patchLocale(locale.code, { dir: event.target.value as Direction })}
              >
                <option value="ltr">Soldan sağa</option>
                <option value="rtl">Sağdan sola</option>
              </select>
            </label>
            <label>
              Varsayılan dil
              <select
                value={content.defaultLocale}
                onChange={(event) => setContent((current) => ({ ...current, defaultLocale: event.target.value }))}
              >
                {content.locales.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="locale-remove">
              <button
                className="btn btn-danger"
                type="button"
                disabled={content.locales.length <= 1}
                onClick={() => removeLocale(locale.code)}
              >
                Bu dili sil
              </button>
            </div>
          </div>
          <div className="add-locale">
            <label>
              Yeni dil kodu
              <input
                value={draftCode}
                maxLength={5}
                placeholder="de"
                onChange={(event) => setDraftCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addLocale();
                  }
                }}
              />
            </label>
            <label>
              Yeni dilin adı
              <input
                value={draftLabel}
                maxLength={40}
                placeholder="Deutsch"
                onChange={(event) => setDraftLabel(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addLocale();
                  }
                }}
              />
            </label>
            <label>
              Yön
              <select value={draftDir} onChange={(event) => setDraftDir(event.target.value as Direction)}>
                <option value="ltr">Soldan sağa</option>
                <option value="rtl">Sağdan sola</option>
              </select>
            </label>
            <button className="btn btn-ghost" type="button" onClick={addLocale}>
              Dil ekle
            </button>
          </div>
        </section>

        <section className="admin-section">
          <h2>Ana görsel</h2>
          <p className="hint">Ana sayfanın üstünde tam genişlikte durur. Geniş bir fotoğraf seçin.</p>
          <div className="hero-admin">
            <div className={content.hero.image ? "hero-preview has-image" : "hero-preview"}>
              {content.hero.image ? <img src={content.hero.image} alt="" /> : <span>Henüz görsel yok</span>}
            </div>
            <div className="stack">
              <label className="file-btn">
                {uploading ? "Yükleniyor…" : content.hero.image ? "Görseli değiştir" : "Görsel yükle"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) upload("hero", file).catch((error: unknown) => {
                      setStatus(error instanceof Error ? error.message : "Yüklenemedi.");
                    });
                  }}
                />
              </label>
              {content.hero.image ? (
                <button className="btn btn-danger" type="button" onClick={removeHero}>
                  Ana görseli kaldır
                </button>
              ) : null}
              <p className="hint">JPG, PNG veya WEBP. En fazla 12 MB. Fotoğraf kaydedilirken sıkıştırılır.</p>
            </div>
          </div>
          <div className="stack">
            <label>
              Başlık ({locale.label})
              <textarea
                rows={2}
                maxLength={180}
                value={content.hero.title[locale.code] ?? ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    hero: { ...current.hero, title: { ...current.hero.title, [locale.code]: event.target.value } },
                  }))
                }
              />
            </label>
            <label>
              Kısa metin ({locale.label})
              <textarea
                rows={4}
                maxLength={600}
                value={content.hero.text[locale.code] ?? ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    hero: { ...current.hero, text: { ...current.hero.text, [locale.code]: event.target.value } },
                  }))
                }
              />
            </label>
            <label>
              Görsel açıklaması ({locale.label})
              <input
                maxLength={180}
                value={content.hero.alt[locale.code] ?? ""}
                onChange={(event) =>
                  setContent((current) => ({
                    ...current,
                    hero: { ...current.hero, alt: { ...current.hero.alt, [locale.code]: event.target.value } },
                  }))
                }
              />
            </label>
          </div>
        </section>

        <section className="admin-section">
          <h2>Ürün galerisi</h2>
          <p className="hint">Sıra, Kaydet’e basınca yayınlanır. Açıklama, seçili dil için yazılır.</p>
          <label className="file-btn">
            {uploading ? "Yükleniyor…" : "Görsel ekle"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={uploading}
              onChange={async (event) => {
                const files = [...(event.target.files || [])];
                event.target.value = "";
                for (const file of files) {
                  try {
                    await upload("gallery", file);
                  } catch (error) {
                    setStatus(error instanceof Error ? error.message : "Yüklenemedi.");
                    break;
                  }
                }
              }}
            />
          </label>
          {content.gallery.length === 0 ? <p className="empty">Galeride görsel yok.</p> : null}
          <div className="admin-gallery">
            {content.gallery.map((item, index) => (
              <article key={item.id} className="admin-card">
                <img src={item.src} alt="" />
                <label>
                  Açıklama ({locale.label})
                  <input
                    maxLength={180}
                    value={item.alt[locale.code] ?? ""}
                    onChange={(event) =>
                      setContent((current) => ({
                        ...current,
                        gallery: current.gallery.map((entry) =>
                          entry.id === item.id
                            ? { ...entry, alt: { ...entry.alt, [locale.code]: event.target.value } }
                            : entry,
                        ),
                      }))
                    }
                  />
                </label>
                <div className="card-actions">
                  <button className="btn btn-ghost" type="button" disabled={index === 0} onClick={() => move(item.id, -1)}>
                    Öne
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={index === content.gallery.length - 1}
                    onClick={() => move(item.id, 1)}
                  >
                    Arkaya
                  </button>
                  <button className="btn btn-danger" type="button" onClick={() => removeGallery(item.id)}>
                    Sil
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <h2>İletişim</h2>
          <p className="hint">Adres, e-posta, telefon ve firma künyesi tüm dillerde aynı görünür. Etiketler dile göre değişir.</p>
          <div className="stack">
            <label>
              Adres
              <textarea
                rows={4}
                maxLength={400}
                value={content.contact.address}
                onChange={(event) =>
                  setContent((current) => ({ ...current, contact: { ...current.contact, address: event.target.value } }))
                }
              />
            </label>
            <div className="form-grid">
              <label>
                E-posta
                <input
                  type="email"
                  maxLength={120}
                  value={content.contact.email}
                  onChange={(event) =>
                    setContent((current) => ({ ...current, contact: { ...current.contact, email: event.target.value } }))
                  }
                />
              </label>
              <label>
                Telefon
                <input
                  type="tel"
                  maxLength={40}
                  value={content.contact.phone}
                  onChange={(event) =>
                    setContent((current) => ({ ...current, contact: { ...current.contact, phone: event.target.value } }))
                  }
                />
              </label>
            </div>
            <label>
              Ticaret ünvanı
              <input
                maxLength={180}
                value={content.company.legalName}
                onChange={(event) =>
                  setContent((current) => ({ ...current, company: { ...current.company, legalName: event.target.value } }))
                }
              />
            </label>
            <div className="form-grid">
              <label>
                Vergi dairesi
                <input
                  maxLength={80}
                  value={content.company.taxOffice}
                  onChange={(event) =>
                    setContent((current) => ({ ...current, company: { ...current.company, taxOffice: event.target.value } }))
                  }
                />
              </label>
              <label>
                Vergi kimlik no
                <input
                  inputMode="numeric"
                  maxLength={20}
                  value={content.company.taxNumber}
                  onChange={(event) =>
                    setContent((current) => ({ ...current, company: { ...current.company, taxNumber: event.target.value } }))
                  }
                />
              </label>
            </div>
          </div>
        </section>

        <section className="admin-section">
          <h2>Arayüz metinleri</h2>
          <p className="hint">{locale.label} için bölüm adları ve kısa yazılar.</p>
          <div className="form-grid">
            {labelFields.map((field) => (
              <label key={field.key}>
                {field.name}
                <input
                  maxLength={field.key === "galleryEmpty" ? 180 : 80}
                  value={content.labels[field.key][locale.code] ?? ""}
                  onChange={(event) =>
                    setContent((current) => ({
                      ...current,
                      labels: {
                        ...current.labels,
                        [field.key]: { ...current.labels[field.key], [locale.code]: event.target.value },
                      },
                    }))
                  }
                />
              </label>
            ))}
          </div>
        </section>

        <div className="savebar">
          <p>{status || (dirty ? "Kaydedilmemiş değişiklik var." : "Tüm değişiklikler kayıtlı.")}</p>
          <button className="btn btn-light" type="submit" disabled={!dirty || saving || uploading}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </div>
      </form>
    </>
  );
}

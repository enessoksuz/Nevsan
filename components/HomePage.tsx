import { Gallery } from "@/components/Gallery";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { tx } from "@/lib/content-shared";
import type { Locale, SiteContent } from "@/lib/types";

function phoneHref(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : "";
}

export function HomePage({ content, locale }: { content: SiteContent; locale: Locale }) {
  const lang = locale.code;
  const fallback = content.defaultLocale;
  const label = (key: keyof SiteContent["labels"]) => tx(content.labels[key], lang, fallback);
  const title = tx(content.hero.title, lang, fallback);
  const text = tx(content.hero.text, lang, fallback);
  const heroAlt = tx(content.hero.alt, lang, fallback);
  const photos = content.gallery.map((item) => ({
    src: item.src,
    alt: tx(item.alt, lang, fallback),
  }));

  const contact = [
    { key: "address" as const, value: content.contact.address, href: "" },
    { key: "email" as const, value: content.contact.email, href: content.contact.email ? `mailto:${content.contact.email}` : "" },
    { key: "phone" as const, value: content.contact.phone, href: phoneHref(content.contact.phone) },
  ];

  return (
    <>
      <a className="skip" href="#icerik">
        {label("skip")}
      </a>
      <header className="site-header">
        <div className="wrap header-inner">
          <a className="logo" href="/">
            {content.logo ? (
              <img className="logo-image" src={content.logo} alt="Nevsan Ambalaj" />
            ) : (
              <>
                <span className="logo-mark" aria-hidden="true" />
                <span>
                  <strong>Nevsan</strong>
                  <small>Ambalaj</small>
                </span>
              </>
            )}
          </a>
          <div className="header-tools">
            <nav className="header-links" aria-label="Sayfa">
              <a href="#urunler">{label("products")}</a>
              <a href="#iletisim">{label("contact")}</a>
            </nav>
            {content.contact.phone ? (
              <a className="header-phone" href={phoneHref(content.contact.phone)}>
                {content.contact.phone}
              </a>
            ) : null}
            <LanguageSwitch locales={content.locales} current={lang} />
          </div>
        </div>
      </header>
      <main id="icerik">
        <section className={content.hero.image ? "hero has-image" : "hero"}>
          {content.hero.image ? <img className="hero-media" src={content.hero.image} alt={heroAlt} /> : null}
          {content.hero.image ? <div className="hero-shade" /> : null}
          <div className="hero-copy">
            <p className="eyebrow">Nevsan Ambalaj</p>
            <h1>{title}</h1>
            {text ? <p className="lede">{text}</p> : null}
          </div>
        </section>
        <section className="section" id="urunler">
          <div className="wrap">
            <h2>{label("products")}</h2>
            {photos.length > 0 ? (
              <Gallery
                items={photos}
                closeLabel={label("close")}
                previousLabel={label("previous")}
                nextLabel={label("next")}
              />
            ) : (
              <p className="empty">{label("galleryEmpty")}</p>
            )}
          </div>
        </section>
        <section className="contact" id="iletisim">
          <div className="wrap">
            <h2>{label("contact")}</h2>
            <div className="contact-grid">
              {contact
                .filter((item) => item.value)
                .map((item) => (
                  <div key={item.key}>
                    <p className="eyebrow">{label(item.key)}</p>
                    <p className="contact-value">
                      {item.href ? <a href={item.href}>{item.value}</a> : item.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="wrap">
          <div className="legal">
            {content.company.legalName ? <strong>{content.company.legalName}</strong> : null}
            {content.company.taxOffice || content.company.taxNumber ? (
              <span>
                {[
                  content.company.taxOffice ? `${label("taxOffice")}: ${content.company.taxOffice}` : "",
                  content.company.taxNumber ? `${label("taxNumber")}: ${content.company.taxNumber}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
            {content.contact.address ? <span className="legal-address">{content.contact.address}</span> : null}
          </div>
          <div className="footer-meta">
            <span>© {new Date().getFullYear()} Nevsan Ambalaj</span>
            <a href="/admin">{label("admin")}</a>
          </div>
        </div>
      </footer>
    </>
  );
}

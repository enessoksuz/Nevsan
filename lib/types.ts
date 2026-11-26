export type Direction = "ltr" | "rtl";

export type Locale = {
  code: string;
  label: string;
  dir: Direction;
};

export type Localized = Record<string, string>;

export type GalleryItem = {
  id: string;
  src: string;
  alt: Localized;
};

export type LabelKey =
  | "products"
  | "contact"
  | "address"
  | "email"
  | "phone"
  | "legalName"
  | "taxOffice"
  | "taxNumber"
  | "galleryEmpty"
  | "close"
  | "previous"
  | "next"
  | "skip"
  | "admin";

export type SiteContent = {
  defaultLocale: string;
  locales: Locale[];
  contact: {
    address: string;
    email: string;
    phone: string;
  };
  company: {
    legalName: string;
    taxOffice: string;
    taxNumber: string;
  };
  logo: string;
  hero: {
    image: string;
    title: Localized;
    text: Localized;
    alt: Localized;
  };
  labels: Record<LabelKey, Localized>;
  gallery: GalleryItem[];
};

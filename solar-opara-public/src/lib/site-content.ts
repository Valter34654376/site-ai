import catalog from "@/data/media-catalog.json";

export const INSTAGRAM_URL = catalog.officialInstagram;
export const ADMIN_URL = "https://solar-opara-web-production.up.railway.app";
export const BRAND_FALLBACK = "/media/solar-opara-monogram.svg";

export const categories = [
  { id: "todos", label: "Todos" },
  { id: "casamentos", label: "Casamentos" },
  { id: "estrutura", label: "Estrutura" },
  { id: "jardins", label: "Jardins" },
  { id: "eventos", label: "Eventos" },
  { id: "decoracao", label: "Decoração" },
  { id: "noite", label: "Noite" },
  { id: "detalhes", label: "Detalhes" },
] as const;

export type Category = (typeof categories)[number]["id"];
export type MediaVariant = { src: string; width: number; height: number; bytes: number };
export type MediaItem = {
  id: string;
  src: string;
  fullSrc: string;
  width: number;
  height: number;
  variants: MediaVariant[];
  categories: string[];
  category: string;
  caption: string;
  alt: string;
  credit: string;
  sourcePage: string;
  orientation: string;
  featured: string[];
  locationNote?: string;
  objectPosition?: string;
};

// Unverified references never enter the public gallery. Authorizations stay in the catalogue.
export const gallery: MediaItem[] = catalog.media
  .filter((item) => ["owner-confirmed", "owned", "licensed"].includes(item.rightsStatus))
  .map((item) => item as MediaItem);

function featured(slot: string): MediaItem {
  const item = gallery.find((entry) => entry.featured.includes(slot));
  if (!item) throw new Error(`Missing authorized featured media: ${slot}`);
  return item;
}

export const media = {
  hero: featured("hero"),
  fallback: featured("wedding"),
  wedding: featured("wedding"),
  garden: featured("garden"),
  detail: featured("detail"),
};

export function mediaSrcSet(item: MediaItem) {
  return item.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ");
}

export const eventTypes = ["Casamento", "Celebração", "Evento social", "Evento corporativo", "Outro"];

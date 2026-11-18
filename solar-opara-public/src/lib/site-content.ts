import catalog from "@/data/media-catalog.json";

export const INSTAGRAM_URL = catalog.officialInstagram;
export const ADMIN_URL = "https://solar-opara-web-production.up.railway.app";
export const BRAND_FALLBACK = "/media/solar-opara-monogram.svg";
export const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Rua+Homero+Nunes+Macedo+1208+Pirapora+MG";

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
export type MediaVariant = {
  src: string;
  width: number;
  height: number;
  bytes: number;
};
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

const SOCIAL_MEDIA_SOURCE = {
  oliver: "https://www.instagram.com/olivercasamentos/p/DevLYbgDOMF/",
  giselle: "https://www.instagram.com/giselledecoracoes/p/Depn5XCiXOv/",
};

const socialMedia: MediaItem[] = [
  {
    id: "solar-nova-celebracao-01",
    src: "/media/social/DevLYbgDOMF-01.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-01.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-01.jpg", width: 1080, height: 1440, bytes: 327743 }],
    categories: ["casamentos", "eventos", "decoracao", "noite"],
    category: "casamentos",
    caption: "Sob a luz do Solar",
    alt: "Casal de noivos sob lustres e um grande arco floral branco no salão do Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: [],
    objectPosition: "50% 42%",
  },
  {
    id: "solar-nova-celebracao-02",
    src: "/media/social/DevLYbgDOMF-02.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-02.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-02.jpg", width: 1080, height: 1440, bytes: 240694 }],
    categories: ["casamentos", "decoracao", "detalhes", "noite"],
    category: "casamentos",
    caption: "Um cenário para viver o sim",
    alt: "Noivos ao lado do bolo entre flores brancas e lustres no Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: [],
  },
  {
    id: "solar-nova-estrutura-01",
    src: "/media/social/DevLYbgDOMF-03.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-03.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-03.jpg", width: 1080, height: 1440, bytes: 291873 }],
    categories: ["estrutura", "decoracao", "noite"],
    category: "estrutura",
    caption: "Arquitetura para celebrar",
    alt: "Grande arco de flores brancas, lustres e bolo no salão decorado do Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: [],
  },
  {
    id: "solar-nova-detalhes-01",
    src: "/media/social/DevLYbgDOMF-04.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-04.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-04.jpg", width: 1080, height: 1440, bytes: 216616 }],
    categories: ["detalhes", "decoracao", "eventos"],
    category: "detalhes",
    caption: "Cada lugar, um gesto de cuidado",
    alt: "Mesa posta com louças, taças e cadeiras transparentes em uma celebração no Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: ["detail"],
  },
  {
    id: "solar-nova-decoracao-01",
    src: "/media/social/DevLYbgDOMF-05.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-05.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-05.jpg", width: 1080, height: 1440, bytes: 136199 }],
    categories: ["decoracao", "detalhes", "noite"],
    category: "decoracao",
    caption: "Detalhes que desenham a noite",
    alt: "Bolo branco com orquídeas visto entre flores no salão do Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: [],
  },
  {
    id: "solar-nova-detalhes-02",
    src: "/media/social/DevLYbgDOMF-06.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-06.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-06.jpg", width: 1080, height: 1440, bytes: 139735 }],
    categories: ["detalhes", "casamentos"],
    category: "detalhes",
    caption: "Memórias à mesa",
    alt: "Cadeira reservada em memória de familiares diante da área verde do Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: [],
  },
  {
    id: "solar-nova-celebracao-03",
    src: "/media/social/DevLYbgDOMF-07.jpg",
    fullSrc: "/media/social/DevLYbgDOMF-07.jpg",
    width: 1080,
    height: 1440,
    variants: [{ src: "/media/social/DevLYbgDOMF-07.jpg", width: 1080, height: 1440, bytes: 312974 }],
    categories: ["casamentos", "eventos", "decoracao", "noite"],
    category: "casamentos",
    caption: "No centro de tudo, a celebração",
    alt: "Casal de noivos emoldurado por flores brancas e lustres no salão do Solar Opará",
    credit: "Oliver Casamentos",
    sourcePage: SOCIAL_MEDIA_SOURCE.oliver,
    orientation: "vertical",
    featured: ["wedding"],
    objectPosition: "50% 42%",
  },
  {
    id: "solar-nova-salao-01",
    src: "/media/social/Depn5XCiXOv-01.jpg",
    fullSrc: "/media/social/Depn5XCiXOv-01.jpg",
    width: 1080,
    height: 1080,
    variants: [{ src: "/media/social/Depn5XCiXOv-01.jpg", width: 1080, height: 1080, bytes: 249222 }],
    categories: ["estrutura", "decoracao", "eventos", "jardins"],
    category: "estrutura",
    caption: "Salão aberto para o jardim",
    alt: "Salão do Solar Opará com grandes janelas, lustres, mesas azuis e vista para as palmeiras",
    credit: "Giselle Decorações",
    sourcePage: SOCIAL_MEDIA_SOURCE.giselle,
    orientation: "square",
    featured: ["garden"],
    objectPosition: "50% 48%",
  },
  {
    id: "solar-nova-mesa-01",
    src: "/media/social/Depn5XCiXOv-02.jpg",
    fullSrc: "/media/social/Depn5XCiXOv-02.jpg",
    width: 805,
    height: 805,
    variants: [{ src: "/media/social/Depn5XCiXOv-02.jpg", width: 805, height: 805, bytes: 222270 }],
    categories: ["decoracao", "detalhes", "eventos"],
    category: "decoracao",
    caption: "Cor e natureza à mesa",
    alt: "Mesa azul decorada com folhagens, flores brancas e laranjas no salão envidraçado",
    credit: "Giselle Decorações",
    sourcePage: SOCIAL_MEDIA_SOURCE.giselle,
    orientation: "square",
    featured: [],
  },
  {
    id: "solar-nova-mesa-02",
    src: "/media/social/Depn5XCiXOv-03.jpg",
    fullSrc: "/media/social/Depn5XCiXOv-03.jpg",
    width: 810,
    height: 810,
    variants: [{ src: "/media/social/Depn5XCiXOv-03.jpg", width: 810, height: 810, bytes: 181302 }],
    categories: ["decoracao", "detalhes", "eventos"],
    category: "detalhes",
    caption: "Uma mesa que recebe",
    alt: "Detalhe da mesa azul com louças, velas flutuantes e menu de casamento",
    credit: "Giselle Decorações",
    sourcePage: SOCIAL_MEDIA_SOURCE.giselle,
    orientation: "square",
    featured: [],
  },
];

// Unverified references never enter the public gallery. Authorizations stay in the catalogue.
export const gallery: MediaItem[] = [
  ...socialMedia,
  ...catalog.media
    .filter((item) =>
      ["owner-confirmed", "owned", "licensed"].includes(item.rightsStatus),
    )
    .map((item) => item as MediaItem),
];

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
  return item.variants
    .map((variant) => `${variant.src} ${variant.width}w`)
    .join(", ");
}

export const eventTypes = [
  "Casamento",
  "Celebração",
  "Evento social",
  "Evento corporativo",
  "Outro",
];

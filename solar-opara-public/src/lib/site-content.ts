export const INSTAGRAM_URL = "https://www.instagram.com/solaroparaoficial/";
export const ADMIN_URL = "https://solar-opara-web-production.up.railway.app";

export const images = {
  hero: "https://images.mindtrip.ai/attractions/61f1/5200/ee79/d0b1/9b75/a8e4/f9d1/d3e2",
  wedding: "https://storage.alboom.ninja/sites/27695/albuns/1015625/1v8a2351.jpg?t=1654179688",
  garden: "https://storage.alboom.ninja/sites/27695/albuns/516598/img_1850.jpg?t=1568211185",
  table: "https://storage.alboom.ninja/sites/27695/albuns/1421318/1v8a1325.jpg?t=1731964494",
};

export const HERO_VIDEO_SRC = "";

export type MediaItem =
  | { type: "image"; src: string; alt: string; caption: string; tall?: boolean }
  | { type: "video"; src: string; poster: string; alt: string; caption: string; tall?: boolean };

export const gallery: MediaItem[] = [
  { type: "image", src: images.wedding, alt: "Casamento realizado no Solar Opará", caption: "Celebrações no Solar Opará", tall: true },
  { type: "image", src: images.hero, alt: "Entrada e fachada do Solar Opará", caption: "Entrada e jardins" },
  { type: "image", src: images.table, alt: "Evento realizado no Solar Opará", caption: "Detalhes do evento", tall: true },
  { type: "image", src: images.garden, alt: "Estrutura e jardins do Solar Opará", caption: "Estrutura e paisagismo" },
  { type: "image", src: "https://storage.alboom.ninja/sites/27695/albuns/1421318/img_0810.jpg?t=1731964628", alt: "Chegada de casamento no Solar Opará", caption: "Momentos especiais" },
  { type: "image", src: "https://storage.alboom.ninja/sites/27695/albuns/1421318/016a5287.jpg?t=1731964541", alt: "Cerimônia no Solar Opará", caption: "Cerimônias" },
  { type: "image", src: "https://storage.alboom.ninja/sites/27695/albuns/516598/img_4025_cde3e3558271.jpg?t=1568210932", alt: "Preparação de evento no Solar Opará", caption: "Preparação", tall: true },
  { type: "image", src: "https://storage.alboom.ninja/sites/27695/albuns/516598/img_4847.jpg?t=1590513143", alt: "Celebração no Solar Opará", caption: "Celebração" },
];

export const eventTypes = ["Casamento", "Celebração", "Evento social", "Evento corporativo", "Outro"];

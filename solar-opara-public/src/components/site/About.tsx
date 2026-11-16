import { SafeImage } from "./SafeImage";
import { Reveal } from "./Reveal";
import { media } from "@/lib/site-content";

const features = [
  {
    index: "01",
    title: "Jardim e gramado",
    description:
      "Área verde externa com espaço aberto para cerimônias ao ar livre, montagem de altar e recepção sob iluminação noturna.",
  },
  {
    index: "02",
    title: "Salão em madeira e vidro",
    description:
      "Pavilhão coberto que preserva a vista para os jardins, oferecendo conforto e integração direta entre o ambiente interno e externo.",
  },
  {
    index: "03",
    title: "Estrutura operacional",
    description:
      "Cozinha de apoio para equipes de gastronomia, sanitários masculino e feminino e acessos práticos para montagem e fornecedores.",
  },
  {
    index: "04",
    title: "Localização urbana",
    description:
      "Situado na Rua Homero Nunes Macedo, 1208, Bairro Sagrada Família, em Pirapora, com acesso simples para convidados e prestadores.",
  },
];

export function About() {
  return (
    <section
      id="espaco"
      className="about-section"
      aria-labelledby="space-title"
    >
      <div className="section-wrap">
        <div className="about-heading">
          <div className="about-heading-left">
            <span className="eyebrow">O Espaço</span>
            <Reveal>
              <h2 id="space-title">
                Arquitetura aberta para o jardim em Pirapora.
              </h2>
            </Reveal>
          </div>
          <div className="about-heading-right">
            <p>
              O Solar Opará foi projetado para conectar a estrutura interna em
              madeira e vidro à área verde externa. Cerimônia e recepção
              acontecem no mesmo endereço, com circulação natural entre o
              gramado e o salão principal.
            </p>
            <a href="#galeria" className="text-link">
              <span>Ver fotografias do espaço</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <Reveal className="about-monumental">
          <figure className="monumental-figure">
            <div className="monumental-frame">
              <SafeImage
                item={media.garden}
                fallback={media.wedding}
                loading="lazy"
                sizes="(max-width: 700px) calc(100vw - 32px), (min-width: 1600px) 1440px, 92vw"
                className="about-media"
              />
            </div>
            <figcaption className="monumental-caption">
              <span>
                Jardins iluminados e salão envidraçado do Solar Opará durante
                recepção noturna
              </span>
              <span>Solar Opará · Fotografia: Oliver Fotos</span>
            </figcaption>
          </figure>
        </Reveal>

        <div className="architecture-grid" aria-label="Características do espaço">
          {features.map((feature) => (
            <article key={feature.index} className="architecture-item">
              <span className="architecture-index">{feature.index}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

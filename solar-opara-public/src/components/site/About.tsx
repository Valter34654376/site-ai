import { SafeImage } from "./SafeImage";
import { Reveal } from "./Reveal";
import { media } from "@/lib/site-content";

const facts = [
  ["Jardim", "Área verde para cerimônias ao ar livre"],
  ["Salão", "Estrutura coberta em madeira e vidro"],
  ["Estrutura de apoio", "Cozinha, sanitários e acesso para fornecedores"],
  ["Localização", "Pirapora · Minas Gerais"],
];

export function About() {
  return (
    <section
      id="espaco"
      className="about-section"
      aria-labelledby="space-title"
    >
      <div className="section-wrap about-intro about-heading">
        <div className="about-signature">
          <span className="eyebrow">O espaço</span>
          <Reveal>
            <h2 id="space-title">Arquitetura aberta para o jardim.</h2>
          </Reveal>
        </div>

        <div className="about-copy">
          <p>
            O Solar Opará integra salão coberto, madeira, vidro e área verde no
            mesmo endereço. Um espaço preparado para receber cerimônias,
            recepções e encontros em Pirapora, com circulação natural entre os
            ambientes internos e externos.
          </p>
          <a href="#galeria" className="text-link">
            <span>Ver fotografias do espaço</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="section-wrap venue-facts" aria-label="Características do espaço">
        {facts.map(([title, description], index) => (
          <div className="venue-fact" key={title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </div>

      <Reveal className="about-monumental">
        <figure className="monumental-figure">
          <div className="monumental-frame">
            <SafeImage
              item={media.garden}
              fallback={media.wedding}
              loading="lazy"
              sizes="(max-width: 700px) 100vw, 94vw"
              className="about-media"
            />
            <div className="architecture-note" aria-hidden="true">
              <span>Madeira</span>
              <i />
              <span>Vidro</span>
              <i />
              <span>Jardim</span>
            </div>
          </div>
          <figcaption className="monumental-caption">
            <span>Jardim e salão durante recepção noturna</span>
            <span>Solar Opará · Fotografia: Oliver Fotos</span>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  );
}

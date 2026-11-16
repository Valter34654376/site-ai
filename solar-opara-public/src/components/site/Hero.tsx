import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
import { media } from "@/lib/site-content";

export function Hero() {
  return (
    <section id="inicio" className="hero-cinema" aria-labelledby="hero-title">
      <div className="hero-overline">
        <span>Pirapora, Minas Gerais</span>
        <span>Casamentos & celebrações</span>
      </div>
      <h1 id="hero-title" className="hero-title">
        <span className="hero-title-first">A vida pede</span>{" "}
        <em className="hero-title-last">encontro.</em>
      </h1>
      <figure className="hero-visual">
        <div className="hero-image-window">
          <SafeImage
            item={media.hero}
            fallback={media.garden}
            fetchPriority="high"
            loading="eager"
            sizes="(min-width: 1101px) 74vw, (min-width: 701px) 90vw, calc(100vw - 40px)"
            className="hero-media"
          />
        </div>
        <figcaption>Solar Opará / Fotografia: Oliver Fotos</figcaption>
      </figure>
      <div className="hero-bottom">
        <a href="#datas" className="date-orbit">
          <span>Ver datas</span>
          <Icon name="arrow" />
          <span className="orbit-label" aria-hidden="true">
            O seu próximo capítulo
          </span>
        </a>
        <p className="hero-lead">
          Jardim, madeira, gente por perto.
          <br />
          Solar Opará. Um espaço para celebrar em Pirapora.
        </p>
        <a href="#espaco" className="hero-scroll">
          <span>Entre, o Solar é seu.</span>
          <span aria-hidden="true">↓</span>
        </a>
      </div>
      <span className="hero-edition" aria-hidden="true">
        S / O
      </span>
    </section>
  );
}

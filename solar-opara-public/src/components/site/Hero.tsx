import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
import { media } from "@/lib/site-content";

export function Hero() {
  return (
    <section id="inicio" className="hero-section" aria-labelledby="hero-title">
      <figure className="hero-visual">
        <div className="hero-image-frame">
          <SafeImage
            item={media.hero}
            fallback={media.garden}
            fetchPriority="high"
            loading="eager"
            sizes="100vw"
            className="hero-media"
          />
        </div>
        <figcaption className="hero-caption">
          <span>Luana & Carlos · Solar Opará</span>
          <span>Oliver Fotos / Marcos Oliver</span>
        </figcaption>
      </figure>

      <div className="hero-content">
        <div className="hero-meta">
          <span>Espaço para celebrações e eventos</span>
          <span aria-hidden="true">·</span>
          <span>Pirapora, Minas Gerais</span>
        </div>

        <h1 id="hero-title" className="hero-title">
          <span className="hero-title-first">Solar</span>{" "}
          <span className="hero-title-last">Opará</span>
        </h1>

        <p className="hero-statement">Celebre em um espaço feito para receber.</p>

        <p className="hero-lead">
          Arquitetura, jardim e ambientes preparados para receber momentos
          especiais.
        </p>

        <div className="hero-actions">
          <a href="#datas" className="btn-primary hero-primary-action">
            <span>Ver datas</span>
            <Icon name="arrow" />
          </a>
          <a href="#espaco" className="btn-secondary hero-secondary-action">
            <span>Conhecer o espaço</span>
          </a>
        </div>
      </div>

      <a className="hero-scroll" href="#espaco" aria-label="Conhecer o espaço">
        <span>Conheça o Solar</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}

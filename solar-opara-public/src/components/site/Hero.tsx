import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
import { media } from "@/lib/site-content";

export function Hero() {
  return (
    <section id="inicio" className="hero-section" aria-labelledby="hero-title">
      <div className="section-wrap hero-grid">
        <div className="hero-content">
          <div className="hero-meta">
            <span className="eyebrow">Pirapora · Minas Gerais</span>
            <span className="hero-meta-divider" aria-hidden="true" />
            <span className="eyebrow">Espaço para celebrações e eventos</span>
          </div>

          <h1 id="hero-title" className="hero-title">
            <span className="hero-title-first">Solar</span>{" "}
            <span className="hero-title-last">Opará</span>
          </h1>

          <p className="hero-lead">
            Arquitetura integrada ao jardim, salão em madeira e vidro e áreas ao
            ar livre preparados para receber casamentos, celebrações e eventos
            especiais em Pirapora.
          </p>

          <div className="hero-actions">
            <a href="#datas" className="btn-primary">
              <span>Ver datas</span>
              <Icon name="arrow" />
            </a>
            <a href="#espaco" className="btn-secondary">
              <span>Conhecer o espaço</span>
            </a>
          </div>

          <dl className="hero-facts">
            <div>
              <dt>Ambientes</dt>
              <dd>Jardim, gramado, altar e salão coberto</dd>
            </div>
            <div>
              <dt>Endereço</dt>
              <dd>Bairro Sagrada Família · Pirapora, MG</dd>
            </div>
          </dl>
        </div>

        <figure className="hero-visual">
          <div className="hero-image-frame">
            <SafeImage
              item={media.hero}
              fallback={media.garden}
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1101px) 62vw, (min-width: 701px) 92vw, calc(100vw - 32px)"
              className="hero-media"
            />
          </div>
          <figcaption className="hero-caption">
            <span>Casamento de Luana & Carlos no Solar Opará</span>
            <span>Fotografia: Oliver Fotos / Marcos Oliver</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

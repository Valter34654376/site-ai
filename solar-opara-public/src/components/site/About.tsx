import { SafeImage } from "./SafeImage";
import { Reveal } from "./Reveal";
import { media } from "@/lib/site-content";

export function About() {
  return (
    <section
      id="espaco"
      className="about-editorial"
      aria-labelledby="space-title"
    >
      <div className="section-wrap about-heading">
        <div className="chapter-label">
          <span>01 / O Solar</span>
          <span>Madeira · jardim · luz</span>
        </div>
        <Reveal>
          <h2 id="space-title">
            O verde abraça.
            <br />
            <em>A luz convida.</em>
          </h2>
        </Reveal>
        <div className="about-intro">
          <span className="about-place">
            Pirapora,
            <br />
            Minas Gerais.
          </span>
          <p>
            Do lado de fora, o jardim. Do lado de dentro, a presença da madeira
            e do vidro. Entre os dois, o Solar abre espaço para a sua história.
          </p>
          <a href="#experiencias" className="text-link">
            Encontre o seu jeito de celebrar <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <Reveal className="about-panorama image-reveal">
        <figure>
          <SafeImage
            item={media.garden}
            fallback={media.wedding}
            loading="lazy"
            sizes="(max-width: 700px) 100vw, 90vw"
            className="about-media"
          />
          <figcaption>
            <span>O jardim encontra a noite.</span>
            <span>Solar Opará / Oliver Fotos</span>
          </figcaption>
        </figure>
      </Reveal>
      <div className="about-after section-wrap">
        <span>O lugar muda com a luz.</span>
        <p>
          Você chega.
          <br />O encontro dá o tom.
        </p>
      </div>
    </section>
  );
}

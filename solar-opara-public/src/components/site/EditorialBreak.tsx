import { SafeImage } from "./SafeImage";
import { Reveal } from "./Reveal";
import { gallery } from "@/lib/site-content";

export function EditorialBreak() {
  const embrace = gallery.find((item) => item.id === "solar-celebracao-03");
  const preparation = gallery.find((item) => item.id === "solar-detalhes-02");
  if (!embrace || !preparation) return null;
  return (
    <section
      className="editorial-pause section-wrap"
      aria-labelledby="pause-title"
    >
      <div className="pause-note">
        <span>Sobre estar perto.</span>
        <span>Um intervalo, antes de seguir.</span>
      </div>
      <Reveal className="pause-title">
        <h2 id="pause-title">
          O que fica
          <br />
          tem a forma
          <br />
          <em>de um abraço.</em>
        </h2>
      </Reveal>
      <Reveal className="pause-main image-reveal">
        <figure>
          <SafeImage
            item={embrace}
            loading="lazy"
            sizes="(max-width: 700px) calc(100vw - 40px), 54vw"
          />
          <figcaption>
            Mariana & Renato · cerimônia religiosa, fora do Solar Opará.
            <br />
            <a
              href={embrace.sourcePage}
              target="_blank"
              rel="noopener noreferrer"
            >
              Fotografia: {embrace.credit} ↗
            </a>
          </figcaption>
        </figure>
      </Reveal>
      <Reveal className="pause-small image-reveal">
        <figure>
          <SafeImage
            item={preparation}
            loading="lazy"
            sizes="(max-width: 700px) 38vw, 23vw"
          />
          <figcaption>
            Emanuely, antes do sim.
            <br />
            Preparativos · local não confirmado como Solar Opará.
            <br />
            Fotografia: Oliver Fotos.
          </figcaption>
        </figure>
      </Reveal>
      <p className="pause-closing">
        O dia passa.
        <br />O afeto, não.
      </p>
    </section>
  );
}

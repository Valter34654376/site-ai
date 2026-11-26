import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

const secondaryFilms = [
  {
    src: "/media/film/solar-detalhes.mp4",
    poster: "/media/film/solar-detalhes-poster.jpg",
    title: "Detalhes da celebração",
    credit: "Sônia Gonçalves Decorações",
  },
  {
    src: "/media/film/solar-celebracao.mp4",
    poster: "/media/film/solar-celebracao-poster.jpg",
    title: "Uma noite no Solar",
    credit: "Hi-Tech Wedding",
  },
];

export function Film() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const player = video.current;
    if (!player || !("IntersectionObserver" in window)) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.25 && !reducedMotion.matches) {
        void player.play().catch(() => {});
      } else {
        player.pause();
      }
    }, { threshold: 0.25 });

    observer.observe(player);
    return () => observer.disconnect();
  }, []);

  function toggleSound() {
    const player = video.current;
    if (!player) return;
    player.muted = !muted;
    setMuted((value) => !value);
    if (player.paused) void player.play().catch(() => {});
  }

  return (
    <section id="filme" className="film-section" aria-labelledby="film-title">
      <div className="section-wrap film-heading">
        <Reveal className="film-heading-main">
          <span className="eyebrow">O Solar em movimento</span>
          <h2 id="film-title">A noite acende. O jardim respira.</h2>
        </Reveal>
        <Reveal className="film-heading-copy">
          <p>
            Luz, flores, água e arquitetura criam o ritmo de cada celebração.
            Aqui, o espaço aparece como ele realmente é: vivo, acolhedor e
            preparado para receber.
          </p>
          <span>Filmes reproduzidos diretamente no site</span>
        </Reveal>
      </div>

      <div className="section-wrap film-experience">
        <Reveal className="film-feature">
          <video
            ref={video}
            muted={muted}
            loop
            playsInline
            preload="none"
            poster="/media/film/solar-atmosfera-poster.jpg"
            aria-label="Atmosfera de uma celebração no Solar Opará"
          >
            <source src="/media/film/solar-atmosfera.mp4" type="video/mp4" />
          </video>
          <div className="film-feature-shade" aria-hidden="true" />
          <div className="film-feature-copy">
            <span>Filme 01 · 00:22</span>
            <strong>Uma entrada para lembrar</strong>
          </div>
          <button
            type="button"
            className="film-sound"
            onClick={toggleSound}
            aria-pressed={!muted}
          >
            <span className="film-sound-pulse" aria-hidden="true" />
            {muted ? "Ativar som" : "Silenciar"}
          </button>
        </Reveal>

        <div className="film-collection" aria-label="Mais filmes do Solar Opará">
          {secondaryFilms.map((item, index) => (
            <Reveal className="film-card" key={item.src}>
              <video
                controls
                playsInline
                preload="none"
                poster={item.poster}
                aria-label={item.title}
              >
                <source src={item.src} type="video/mp4" />
              </video>
              <figcaption>
                <span>Filme 0{index + 2}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.credit}</small>
                </div>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

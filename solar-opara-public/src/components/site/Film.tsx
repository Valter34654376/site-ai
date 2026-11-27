import { useState } from "react";
import { Reveal } from "./Reveal";
import { playVideo, useAutoplayVideo } from "./useAutoplayVideo";

const secondaryFilms = [
  {
    src: "/media/film/solar-detalhes.mp4",
    poster: "/media/film/solar-detalhes-poster.jpg",
    title: "Detalhes da celebração",
  },
  {
    src: "/media/film/solar-celebracao.mp4",
    poster: "/media/film/solar-celebracao-poster.jpg",
    title: "Uma noite no Solar",
  },
];

function FilmCard({ item }: { item: (typeof secondaryFilms)[number] }) {
  const { video, loadSource } = useAutoplayVideo();
  return (
    <Reveal className="film-card">
      <video
        ref={video}
        src={loadSource ? item.src : undefined}
        autoPlay
        muted
        loop
        controls
        playsInline
        preload="auto"
        poster={item.poster}
        aria-label={item.title}
      />
    </Reveal>
  );
}

export function Film() {
  const { video, loadSource } = useAutoplayVideo();
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const player = video.current;
    if (!player) return;
    player.muted = !muted;
    setMuted((value) => !value);
    playVideo(player);
  }

  return (
    <section id="filme" className="film-section" aria-labelledby="film-title">
      <Reveal className="section-wrap film-heading">
        <h2 id="film-title">Vídeos</h2>
      </Reveal>

      <div className="section-wrap film-experience">
        <Reveal className="film-feature">
          <video
            ref={video}
            src={loadSource ? "/media/film/solar-atmosfera.mp4" : undefined}
            autoPlay
            muted={muted}
            loop
            playsInline
            preload="auto"
            poster="/media/film/solar-atmosfera-poster.jpg"
            aria-label="Atmosfera de uma celebração no Solar Opará"
          />
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
          {secondaryFilms.map((item) => (
            <FilmCard key={item.src} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

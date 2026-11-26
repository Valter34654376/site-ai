import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

export function StoryFilm() {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const container = frame.current;
    const player = video.current;
    if (!container || !player) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !reducedMotion.matches) {
          player.play().catch(() => setPlaying(false));
        } else {
          player.pause();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function toggleSound() {
    const player = video.current;
    if (!player) return;
    const nextMuted = !player.muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
    if (player.paused) player.play().catch(() => setPlaying(false));
  }

  function togglePlayback() {
    const player = video.current;
    if (!player) return;
    if (player.paused) player.play().catch(() => setPlaying(false));
    else player.pause();
  }

  return (
    <section
      id="historia"
      className="story-film-section"
      aria-label="Celebração no Solar Opará"
    >
      <Reveal className="section-wrap story-film-stage">
        <div ref={frame} className="story-film-frame">
          <video
            ref={video}
            muted={muted}
            loop
            playsInline
            preload="none"
            poster="/media/film/solar-historia-completa-poster.jpg"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            aria-label="Filme completo de uma celebração no Solar Opará"
          >
            <source
              src="/media/film/solar-historia-completa.mp4"
              type="video/mp4"
            />
          </video>
          <div className="story-film-controls">
            <button type="button" onClick={togglePlayback}>
              {playing ? "Pausar filme" : "Reproduzir filme"}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
            >
              {muted ? "Ativar som" : "Silenciar"}
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

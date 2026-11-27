import { useState } from "react";
import { Reveal } from "./Reveal";
import { toggleVideoPause, useAutoplayVideo } from "./useAutoplayVideo";

export function StoryFilm() {
  const { video, loadSource } = useAutoplayVideo();
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);

  function toggleSound() {
    const player = video.current;
    if (!player) return;
    const nextMuted = !player.muted;
    player.muted = nextMuted;
    setMuted(nextMuted);
  }

  function togglePlayback() {
    if (video.current) setPaused(toggleVideoPause(video.current));
  }

  return (
    <section
      id="historia"
      className="story-film-section"
      aria-label="Celebração no Solar Opará"
    >
      <Reveal className="section-wrap story-film-stage">
        <div className="story-film-frame">
          <video
            ref={video}
            src={loadSource ? "/media/film/solar-historia-completa.mp4" : undefined}
            autoPlay={!paused}
            muted={muted}
            loop
            playsInline
            preload="auto"
            poster="/media/film/solar-historia-completa-poster.jpg"
            onPlaying={() => setHasPlayed(true)}
            aria-label="Filme completo de uma celebração no Solar Opará"
          />
          <div className="story-film-controls">
            {hasPlayed && (
              <button type="button" onClick={togglePlayback}>
                {paused ? "Retomar vídeo" : "Pausar vídeo"}
              </button>
            )}
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

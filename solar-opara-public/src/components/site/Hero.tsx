import { useEffect, useRef, useState } from "react";
import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
import { toggleVideoPause, useAutoplayVideo } from "./useAutoplayVideo";
import { heroFilm, media } from "@/lib/site-content";

function videoConnection() {
  return (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string; downlink?: number };
  }).connection;
}

function heroSource() {
  if (matchMedia("(max-width: 700px) and (orientation: portrait)").matches) {
    return heroFilm.mobile;
  }

  const wideFrame = matchMedia("(min-width: 1000px) and (min-aspect-ratio: 2/1)").matches;
  const largeFrame = (wideFrame && innerWidth * devicePixelRatio >= 1800) ||
    matchMedia("(min-width: 2400px)").matches;
  const connection = videoConnection();
  const limitedBandwidth = connection?.saveData ||
    ["slow-2g", "2g"].includes(connection?.effectiveType ?? "") ||
    (connection?.effectiveType === "3g" && (connection.downlink ?? 0) < 2);
  return largeFrame && !limitedBandwidth ? heroFilm.wide : heroFilm.desktop;
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const { video } = useAutoplayVideo(true);
  const [source, setSource] = useState(heroSource);
  const [paused, setPaused] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    const element = section.current;
    if (
      !element ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(max-width: 700px)").matches
    ) {
      return;
    }

    let frame = 0;
    let elementHeight = element.offsetHeight;
    const update = () => {
      frame = 0;
      const progress = Math.min(window.scrollY / elementHeight, 1);
      element.style.setProperty("--hero-shift", `${progress * 22}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      elementHeight = element.offsetHeight;
      onScroll();
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  function togglePlayback() {
    if (video.current) setPaused(toggleVideoPause(video.current));
  }

  return (
    <section
      ref={section}
      id="inicio"
      className="hero-section"
      aria-labelledby="hero-title"
    >
      <div className="hero-visual">
        <div className="hero-image-frame">
          <SafeImage
            item={heroFilm.poster}
            fallback={media.garden}
            fetchPriority="high"
            loading="eager"
            sizes="(min-width: 1000px) and (min-aspect-ratio: 2/1) 100vw, (min-width: 1700px) 100vw, 420px"
            className="hero-media"
          />
          <video
            ref={video}
            src={source}
            className={hasFrame ? "hero-video is-ready" : "hero-video"}
            autoPlay={!paused}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onPlaying={() => setHasFrame(true)}
            onError={() => {
              setHasFrame(false);
              if (source !== heroFilm.desktop) setSource(heroFilm.desktop);
            }}
          />
        </div>
      </div>
      {hasFrame && (
        <button type="button" className="hero-playback" onClick={togglePlayback}>
          {paused ? "Retomar vídeo" : "Pausar vídeo"}
        </button>
      )}

      <div className="hero-content">
        <div className="hero-identity">
          <p className="hero-place">Pirapora · Minas Gerais</p>
          <h1 id="hero-title" className="hero-title">
            <span className="hero-title-first">Solar</span>{" "}
            <span className="hero-title-last">Opará</span>
          </h1>
        </div>

        <div className="hero-action-strip">
          <p>Jardim e salão para cerimônia e recepção no mesmo endereço.</p>
          <div className="hero-actions">
            <a href="#datas" className="btn-primary hero-primary-action">
              <span>Consultar datas</span>
              <Icon name="arrow" />
            </a>
            <a href="#espaco" className="hero-text-link">
              Conhecer o espaço
            </a>
          </div>
        </div>
      </div>

      <a className="hero-scroll" href="#espaco" aria-label="Conhecer o espaço">
        <span>Descer</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}

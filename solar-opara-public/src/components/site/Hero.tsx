import { useEffect, useRef, useState } from "react";
import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
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

function playHeroFilm(player: HTMLVideoElement) {
  if (!player.getAttribute("src")) player.src = heroSource();
  // Autoplay can be blocked even for muted video. The poster and play button stay visible.
  if (player.paused) void player.play().catch(() => {});
}

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const playbackChoice = useRef<boolean | null>(null);
  const syncPlayback = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [hasFrame, setHasFrame] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const player = video.current;
    if (!player || failed) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let inView = !("IntersectionObserver" in window);
    const sync = () => {
      const wantsPlayback = playbackChoice.current ?? (!reducedMotion.matches && !videoConnection()?.saveData);
      if (wantsPlayback && inView && !document.hidden) playHeroFilm(player);
      else player.pause();
    };
    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting && entry.intersectionRatio >= 0.15;
          sync();
        }, { threshold: 0.15 })
      : null;

    syncPlayback.current = sync;
    observer?.observe(player);
    reducedMotion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      syncPlayback.current = null;
      observer?.disconnect();
      reducedMotion.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      player.pause();
    };
  }, [failed]);

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
    const player = video.current;
    if (!player || failed) return;
    playbackChoice.current = player.paused;
    if (player.paused) playHeroFilm(player);
    else player.pause();
  }

  return (
    <section
      ref={section}
      id="inicio"
      className="hero-section"
      aria-labelledby="hero-title"
    >
      <figure className="hero-visual">
        <div className="hero-image-frame">
          <SafeImage
            item={heroFilm.poster}
            fallback={media.garden}
            fetchPriority="high"
            loading="eager"
            sizes="(min-width: 1000px) and (min-aspect-ratio: 2/1) min(100vw, 225svh), (min-width: 2400px) 100vw, 420px"
            className="hero-media"
          />
          <video
            ref={video}
            className={hasFrame ? "hero-video is-ready" : "hero-video"}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onPlay={() => setPlaying(true)}
            onPlaying={() => setHasFrame(true)}
            onPause={() => setPlaying(false)}
            onError={({ currentTarget }) => {
              setHasFrame(false);
              setPlaying(false);
              if (currentTarget.getAttribute("src") === heroFilm.wide) {
                currentTarget.src = heroFilm.desktop;
                syncPlayback.current?.();
                return;
              }
              setFailed(true);
            }}
          />
        </div>
        <figcaption className="hero-caption">
          <span>Vídeo: {heroFilm.credit}</span>
        </figcaption>
      </figure>
      {!failed && (
        <button type="button" className="hero-playback" onClick={togglePlayback}>
          {playing ? "Pausar vídeo" : "Reproduzir vídeo"}
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

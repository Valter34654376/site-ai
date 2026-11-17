import { useEffect, useRef } from "react";
import { SafeImage } from "./SafeImage";
import { Icon } from "./Icon";
import { media } from "@/lib/site-content";

export function Hero() {
  const section = useRef<HTMLElement>(null);

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
          <span>Fotografia: Oliver Fotos / Marcos Oliver</span>
        </figcaption>
      </figure>

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

      <a className="hero-scroll" href="#espaco" aria-label="Conhecer o espaço">
        <span>Descer</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}

import { useEffect, useRef } from "react";

export function SiteEffects() {
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero-cinema");
    const motion = matchMedia(
      "(prefers-reduced-motion: no-preference) and (min-width: 1101px) and (pointer: fine)",
    );
    let frame = 0;
    let heroVisible = true;
    const draw = () => {
      const max = Math.max(
        document.documentElement.scrollHeight - innerHeight,
        1,
      );
      if (progress.current)
        progress.current.style.transform = `scaleX(${Math.min(Math.max(scrollY / max, 0), 1)})`;
      if (hero && heroVisible)
        hero.style.setProperty(
          "--hero-travel",
          motion.matches ? `${Math.min(scrollY * 0.08, 40)}px` : "0px",
        );
      frame = 0;
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            heroVisible = !!entry?.isIntersecting;
            if (heroVisible) queue();
          })
        : null;
    if (hero) observer?.observe(hero);
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    motion.addEventListener("change", queue);
    draw();
    return () => {
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      motion.removeEventListener("change", queue);
      observer?.disconnect();
      cancelAnimationFrame(frame);
      hero?.style.removeProperty("--hero-travel");
    };
  }, []);
  return <div ref={progress} className="page-progress" aria-hidden="true" />;
}

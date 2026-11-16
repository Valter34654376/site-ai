import { useEffect, useRef } from "react";

export function SiteEffects() {
  const progress = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      if (progress.current) progress.current.style.transform = `scaleX(${Math.min(Math.max(scrollY / max, 0), 1)})`;
      frame = 0;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(draw); };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue, { passive: true });
    draw();
    return () => { removeEventListener("scroll", queue); removeEventListener("resize", queue); cancelAnimationFrame(frame); };
  }, []);
  return <div ref={progress} className="page-progress" aria-hidden="true" />;
}

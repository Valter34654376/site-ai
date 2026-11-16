import { useEffect } from "react";

export function SiteEffects() {
  useEffect(() => {
    const root = document.documentElement;
    const aura = document.querySelector<HTMLElement>('.cursor-aura');
    const hero = document.querySelector<HTMLElement>('.hero-media');
    const progress = document.querySelector<HTMLElement>('.page-progress');
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let scrollFrame = 0;
    let pointerFrame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const drawScroll = () => {
      const max = Math.max(root.scrollHeight - window.innerHeight, 1);
      if (progress) progress.style.transform = `scaleX(${Math.min(Math.max(window.scrollY / max, 0), 1)})`;
      hero?.style.setProperty("--hero-shift", motion.matches ? "0px" : `${Math.min(Math.max(window.scrollY, 0) * 0.16, 110)}px`);
      scrollFrame = 0;
    };
    const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(drawScroll); };
    const drawPointer = () => {
      aura?.style.setProperty("--pointer-x", `${pointerX}px`);
      aura?.style.setProperty("--pointer-y", `${pointerY}px`);
      hero?.style.setProperty("--tilt-x", (pointerX / Math.max(innerWidth, 1) - 0.5).toFixed(3));
      pointerFrame = 0;
    };
    const onPointer = (event: PointerEvent) => {
      if (motion.matches || !finePointer.matches || event.pointerType !== "mouse") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
    };
    const resetMotion = () => {
      if (motion.matches) {
        cancelAnimationFrame(pointerFrame);
        pointerFrame = 0;
        hero?.style.setProperty("--tilt-x", "0");
      }
      onScroll();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    motion.addEventListener("change", resetMotion);
    drawScroll();
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      motion.removeEventListener("change", resetMotion);
      cancelAnimationFrame(scrollFrame);
      cancelAnimationFrame(pointerFrame);
      aura?.style.removeProperty('--pointer-x');
      aura?.style.removeProperty('--pointer-y');
      hero?.style.removeProperty('--tilt-x');
      hero?.style.removeProperty('--hero-shift');
      progress?.style.removeProperty('transform');
    };
  }, []);
  return (
    <>
      <div className="global-noise" aria-hidden="true" />
      <div className="cursor-aura" aria-hidden="true" />
      <div className="page-progress" aria-hidden="true" />
    </>
  );
}

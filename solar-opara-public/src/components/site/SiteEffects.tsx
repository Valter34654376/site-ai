import { useEffect } from "react";

export function SiteEffects() {
  useEffect(() => {
    const root = document.documentElement;

    const onPointer = (event: PointerEvent) => {
      const nx = event.clientX / Math.max(window.innerWidth, 1) - 0.5;
      const ny = event.clientY / Math.max(window.innerHeight, 1) - 0.5;
      root.style.setProperty("--pointer-x", `${event.clientX}px`);
      root.style.setProperty("--pointer-y", `${event.clientY}px`);
      root.style.setProperty("--tilt-x", nx.toFixed(3));
      root.style.setProperty("--tilt-y", ny.toFixed(3));
    };

    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      root.style.setProperty("--page-progress", String(Math.min(window.scrollY / max, 1)));
      root.style.setProperty("--scroll-y", `${window.scrollY}px`);
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
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

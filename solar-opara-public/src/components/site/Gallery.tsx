import { useCallback, useEffect, useState } from "react";
import type { MediaItem } from "@/lib/site-content";

export function Gallery({ items }: { items: MediaItem[] }) {
  const [idx, setIdx] = useState<number | null>(null);
  const close = useCallback(() => setIdx(null), []);
  const step = useCallback((d: number) => setIdx((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useEffect(() => {
    if (idx === null) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", k);
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [idx, close, step]);

  const cur = idx !== null ? items[idx] : null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {items.map((m, i) => (
          <figure key={i} className="group break-inside-avoid">
            <button onClick={() => setIdx(i)} className="relative block w-full overflow-hidden" aria-label={`Ampliar: ${m.caption}`}>
              <img
                src={m.type === "image" ? m.src : m.poster}
                alt={m.alt}
                loading="lazy"
                decoding="async"
                className={`w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04] ${m.tall ? "aspect-[4/5]" : "aspect-[4/3]"}`}
              />
              {m.type === "video" && <span className="eyebrow absolute left-4 top-4 bg-ink/70 px-3 py-1.5 text-ink-foreground">Vídeo</span>}
            </button>
            <figcaption className="eyebrow mt-3 text-muted-foreground">{m.caption}</figcaption>
          </figure>
        ))}
      </div>

      {cur && (
        <div role="dialog" aria-modal="true" aria-label={cur.caption} className="fixed inset-0 z-50 flex flex-col bg-ink/95 text-ink-foreground animate-in fade-in" onClick={close}>
          <div className="flex items-center justify-between px-6 py-5">
            <span className="eyebrow opacity-70">{(idx ?? 0) + 1} / {items.length}</span>
            <button className="eyebrow" onClick={close} autoFocus>Fechar</button>
          </div>
          <div className="flex flex-1 items-center justify-center gap-4 px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            <button className="eyebrow hidden p-4 sm:block" onClick={() => step(-1)} aria-label="Anterior">←</button>
            <figure className="flex max-h-full max-w-5xl flex-col items-center">
              {cur.type === "image" ? (
                <img src={cur.src} alt={cur.alt} className="max-h-[78vh] w-auto object-contain" />
              ) : (
                <video src={cur.src} poster={cur.poster} controls autoPlay playsInline className="max-h-[78vh] w-auto" aria-label={cur.alt} />
              )}
              <figcaption className="mt-4 font-display text-xl italic opacity-90">{cur.caption}</figcaption>
            </figure>
            <button className="eyebrow hidden p-4 sm:block" onClick={() => step(1)} aria-label="Próxima">→</button>
          </div>
          <div className="flex justify-center gap-10 pb-6 sm:hidden" onClick={(e) => e.stopPropagation()}>
            <button className="eyebrow p-3" onClick={() => step(-1)}>Anterior</button>
            <button className="eyebrow p-3" onClick={() => step(1)}>Próxima</button>
          </div>
        </div>
      )}
    </>
  );
}
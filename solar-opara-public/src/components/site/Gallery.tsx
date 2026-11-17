import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  categories,
  INSTAGRAM_URL,
  type Category,
  type MediaItem,
} from "@/lib/site-content";
import { SafeImage } from "./SafeImage";

const PAGE_SIZE = 6;
const IMAGE_SIZES = [
  "(max-width: 700px) calc(100vw - 32px), (min-width: 1600px) 800px, 55vw",
  "(max-width: 360px) calc(100vw - 32px), (max-width: 700px) calc((100vw - 44px) / 2), (min-width: 1600px) 570px, 39vw",
  "(max-width: 360px) calc(100vw - 32px), (max-width: 700px) calc((100vw - 44px) / 2), (min-width: 1600px) 455px, 31vw",
  "(max-width: 360px) calc(100vw - 32px), (max-width: 700px) calc((100vw - 44px) / 2), (min-width: 1600px) 455px, 31vw",
  "(max-width: 360px) calc(100vw - 32px), (max-width: 700px) calc((100vw - 44px) / 2), (min-width: 1600px) 455px, 31vw",
  "(max-width: 700px) calc(100vw - 32px), (min-width: 1600px) 930px, 64vw",
];

export function Gallery({ items }: { items: MediaItem[] }) {
  const [category, setCategory] = useState<Category>("todos");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) => category === "todos" || item.categories.includes(category),
      ),
    [items, category],
  );
  const current = index === null ? null : filtered[index];
  const isOpen = index !== null;
  const close = useCallback(() => setIndex(null), []);
  const step = useCallback(
    (direction: number) => {
      setIndex((value) =>
        value === null || filtered.length === 0
          ? null
          : (value + direction + filtered.length) % filtered.length,
      );
    },
    [filtered.length],
  );

  useEffect(() => {
    const modal = dialog.current;
    if (!isOpen || !modal) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modal.showModal();
    return () => {
      modal.close();
      document.body.style.overflow = overflow;
      trigger.current?.focus({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (index === null || filtered.length < 2) return;
    const next = new Image();
    next.src = filtered[(index + 1) % filtered.length].fullSrc;
  }, [index, filtered]);

  function filter(next: Category) {
    setCategory(next);
    setVisible(PAGE_SIZE);
    close();
  }

  function showMore() {
    const previous = visible;
    setVisible((value) => value + PAGE_SIZE);
    requestAnimationFrame(() =>
      grid.current
        ?.querySelectorAll<HTMLButtonElement>(".gallery-open")
        [previous]?.focus({ preventScroll: true }),
    );
  }

  return (
    <section
      id="galeria"
      className="gallery-section"
      aria-labelledby="gallery-title"
    >
      <div className="section-wrap">
        <div className="gallery-header">
          <div className="gallery-header-main">
            <span className="eyebrow">Galeria</span>
            <h2 id="gallery-title">O espaço. As celebrações.</h2>
          </div>
          <div className="gallery-header-side">
            <p>
              Registros do salão, do jardim e das celebrações que ocupam o
              Solar Opará. Arquitetura, decoração e afeto vistos de perto.
            </p>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              <span>Instagram @solaroparaoficial</span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="gallery-toolbar">
          <div
            className="gallery-filters"
            role="group"
            aria-label="Filtrar fotografias"
          >
            {categories.map((entry) => {
              const count = items.filter(
                (item) =>
                  entry.id === "todos" || item.categories.includes(entry.id),
              ).length;
              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-pressed={category === entry.id}
                  aria-controls="gallery-collection"
                  onClick={() => filter(entry.id)}
                >
                  <span>{entry.label}</span>
                  <small aria-hidden="true">{count}</small>
                </button>
              );
            })}
          </div>
          <p className="gallery-count" role="status" aria-live="polite">
            {filtered.length}{" "}
            {filtered.length === 1 ? "fotografia" : "fotografias"}
          </p>
        </div>

        <div
          id="gallery-collection"
          ref={grid}
          className="gallery-grid"
          key={category}
        >
          {filtered.slice(0, visible).map((item, position) => (
            <figure
              key={item.id}
              className={`gallery-card gallery-slot-${position}`}
            >
              <button
                type="button"
                className="gallery-open"
                aria-label={`Ampliar: ${item.caption}`}
                aria-haspopup="dialog"
                onClick={(event) => {
                  trigger.current = event.currentTarget;
                  setIndex(position);
                }}
              >
                <span
                  className={`gallery-context ${item.locationNote ? "is-external" : "is-venue"}`}
                >
                  {item.locationNote ? "Registro externo" : "No Solar Opará"}
                </span>
                <SafeImage
                  item={item}
                  loading="lazy"
                  sizes={IMAGE_SIZES[position % IMAGE_SIZES.length]}
                  className="gallery-image"
                />
                <span className="gallery-open-cue" aria-hidden="true">
                  Ver {String(position + 1).padStart(2, "0")} ↗
                </span>
              </button>
              <figcaption className="gallery-caption">
                <span className="gallery-caption-title">{item.caption}</span>
                <span className="gallery-caption-meta">
                  {item.locationNote ?? "Solar Opará · Pirapora, MG"}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="gallery-empty">
            Nenhuma fotografia nesta categoria no momento.
          </p>
        )}

        <div className="gallery-footer">
          <p aria-live="polite">
            Exibindo {Math.min(visible, filtered.length)} de {filtered.length}{" "}
            fotografias · Créditos indicados em cada registro
          </p>
          {visible < filtered.length && (
            <button
              type="button"
              className="btn-secondary"
              onClick={showMore}
            >
              Ver mais fotografias
            </button>
          )}
        </div>
      </div>

      <dialog
        ref={dialog}
        className="lightbox"
        aria-labelledby="lightbox-title"
        aria-describedby="lightbox-caption"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            step(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            step(-1);
          }
          if (event.key === "Tab") {
            const controls = event.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), a[href]",
            );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault();
              last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        {current && (
          <div className="lightbox-shell">
            <div className="lightbox-top">
              <span className="lightbox-brand">Solar Opará</span>
              <span className="lightbox-counter" aria-live="polite">
                {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
                {String(filtered.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                className="lightbox-close"
                onClick={close}
                aria-label="Fechar galeria"
                autoFocus
              >
                Fechar <span aria-hidden="true">×</span>
              </button>
            </div>

            <div
              className="lightbox-stage"
              onClick={(event) => {
                if (event.target === event.currentTarget) close();
              }}
              onTouchStart={(event) => {
                const start = event.touches[0];
                if (start)
                  touch.current = { x: start.clientX, y: start.clientY };
              }}
              onTouchEnd={(event) => {
                const end = event.changedTouches[0];
                if (touch.current && end) {
                  const dx = end.clientX - touch.current.x;
                  const dy = end.clientY - touch.current.y;
                  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5)
                    step(dx < 0 ? 1 : -1);
                }
                touch.current = null;
              }}
              onTouchCancel={() => {
                touch.current = null;
              }}
            >
              <button
                type="button"
                className="lightbox-arrow lightbox-prev"
                onClick={() => step(-1)}
                aria-label="Fotografia anterior"
              >
                ←
              </button>
              <SafeImage
                key={current.id}
                item={current}
                full
                className="lightbox-image"
              />
              <button
                type="button"
                className="lightbox-arrow lightbox-next"
                onClick={() => step(1)}
                aria-label="Próxima fotografia"
              >
                →
              </button>
            </div>

            <div className="lightbox-bottom">
              <div>
                <h3 id="lightbox-title">{current.caption}</h3>
                <p id="lightbox-caption">
                  {current.locationNote ??
                    "Solar Opará · Pirapora, Minas Gerais"}
                </p>
              </div>
              <a
                href={current.sourcePage}
                target="_blank"
                rel="noopener noreferrer"
                className="lightbox-credit"
              >
                Fotografia: {current.credit} <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const links = [
  { href: "#espaco", label: "Espaço" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#galeria", label: "Galeria" },
  { href: "#datas", label: "Datas" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const sync = () => setSolid(window.scrollY > 12);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const desktop = matchMedia("(min-width: 1025px)");
    const resize = () => {
      if (desktop.matches) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    desktop.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
      desktop.removeEventListener("change", resize);
    };
  }, [open]);

  return (
    <header
      ref={header}
      className={`site-header ${solid ? "is-solid" : ""} ${open ? "is-open" : ""}`}
    >
      <div className="site-nav">
        <a
          href="#inicio"
          className="site-brand"
          aria-label="Solar Opará, início"
          onClick={() => setOpen(false)}
        >
          <span className="brand-name">Solar Opará</span>
          <span className="brand-location">Pirapora · MG</span>
        </a>

        <nav className="site-nav-links" aria-label="Principal">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <a href="#datas" className="site-nav-cta">
            Ver disponibilidade
          </a>
          <button
            type="button"
            ref={menuButton}
            className="site-menu-button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            <span>{open ? "Fechar" : "Menu"}</span>
            <span
              className={`menu-lines ${open ? "is-open" : ""}`}
              aria-hidden="true"
            >
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      <nav
        id="menu-mobile"
        aria-label="Menu móvel"
        hidden={!open}
        className="site-mobile-menu"
      >
        <div className="mobile-menu-list">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
            >
              <span>{link.label}</span>
              <Icon name="arrow" />
            </a>
          ))}
        </div>
        <div className="mobile-menu-footer">
          <p>Rua Homero Nunes Macedo, 1208 · Pirapora, MG</p>
          <a
            href="#datas"
            onClick={() => setOpen(false)}
            className="btn-primary mobile-cta"
          >
            Ver disponibilidade
            <Icon name="arrow" />
          </a>
        </div>
      </nav>
    </header>
  );
}

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const links = [
  { href: "#espaco", label: "Espaço" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#galeria", label: "Galeria" },
  { href: "#valores", label: "Valores" },
  { href: "#datas", label: "Datas" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [active, setActive] = useState("");
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const syncScroll = () => setScrolled(window.scrollY > 24);
    syncScroll();
    window.addEventListener("scroll", syncScroll, { passive: true });

    const hero = document.getElementById("inicio");
    const sections = links
      .map(({ href }) => document.getElementById(href.slice(1)))
      .filter((section): section is HTMLElement => section !== null);

    const Observer = window.IntersectionObserver;
    if (typeof Observer !== "function") {
      const sync = () => setPastHero(window.scrollY > window.innerHeight * 0.8);
      sync();
      window.addEventListener("scroll", sync, { passive: true });
      return () => {
        window.removeEventListener("scroll", syncScroll);
        window.removeEventListener("scroll", sync);
      };
    }

    const heroObserver = new Observer(
      ([entry]) => {
        const isPastHero = !entry?.isIntersecting;
        setPastHero(isPastHero);
        if (!isPastHero) setActive("");
      },
      { rootMargin: "-110px 0px 0px", threshold: 0 },
    );
    if (hero) heroObserver.observe(hero);

    const visible = new Map<string, number>();
    const sectionObserver = new Observer(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        });
        const current = [...visible.entries()].sort((a, b) => b[1] - a[1])[0];
        if (current) setActive(`#${current[0]}`);
      },
      {
        rootMargin: "-24% 0px -62% 0px",
        threshold: [0, 0.05, 0.2, 0.5],
      },
    );
    sections.forEach((section) => sectionObserver.observe(section));

    return () => {
      window.removeEventListener("scroll", syncScroll);
      heroObserver.disconnect();
      sectionObserver.disconnect();
    };
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
      className={`site-header ${scrolled || pastHero ? "is-solid" : ""} ${pastHero ? "is-past-hero" : ""} ${open ? "is-open" : ""}`}
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
            <a
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "location" : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <a
            href="#datas"
            className="site-nav-cta"
            aria-label="Consultar datas disponíveis"
            onClick={() => setOpen(false)}
          >
            <span className="nav-cta-long">Consultar datas</span>
            <span className="nav-cta-short" aria-hidden="true">Datas</span>
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
              aria-current={active === link.href ? "location" : undefined}
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
            Consultar datas
            <Icon name="arrow" />
          </a>
        </div>
      </nav>
    </header>
  );
}

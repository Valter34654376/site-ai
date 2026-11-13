import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#espaco", label: "O espaço" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#galeria", label: "Galeria" },
  { href: "#datas", label: "Datas" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sync = () => setSolid(window.scrollY > 32);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    };
    const desktop = matchMedia("(min-width: 1051px)");
    const resize = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener("keydown", escape);
    desktop.addEventListener("change", resize);
    return () => { document.removeEventListener("keydown", escape); desktop.removeEventListener("change", resize); };
  }, [open]);

  return (
    <header className={`lux-header ${solid || open ? "is-solid" : ""}`}>
      <div className="lux-nav">
        <a href="#inicio" className="lux-brand" onClick={() => setOpen(false)}>
          <span className="lux-brand-mark" aria-hidden="true">SO</span>
          <span>Solar Opará<small>Espaço de celebrações</small></span>
        </a>

        <nav className="lux-nav-links" aria-label="Principal">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <a href="#contato" className="lux-nav-cta">Solicitar orçamento <span>↗</span></a>

        <button type="button" ref={menuButton} className="lux-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? "Fechar menu" : "Abrir menu"}>
          {open ? "Fechar" : "Menu"} <span aria-hidden="true">{open ? "−" : "+"}</span>
        </button>
      </div>

      <nav id="menu-mobile" aria-label="Menu móvel" hidden={!open} className={`lux-mobile-menu ${open ? "is-open" : ""}`}>
        {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
        <a href="#contato" onClick={() => setOpen(false)}>Solicitar orçamento ↗</a>
      </nav>
    </header>
  );
}

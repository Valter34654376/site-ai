import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const links = [
  { href: "#espaco", label: "O espaço" },
  { href: "#experiencias", label: "Celebrações" },
  { href: "#galeria", label: "Galeria" },
  { href: "#datas", label: "Datas" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  useEffect(() => {
    const sync = () => setSolid(window.scrollY > 16);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); menuButton.current?.focus(); }
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    };
    const desktop = matchMedia("(min-width: 1051px)");
    const resize = () => { if (desktop.matches) setOpen(false); };
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
    <header ref={header} className={`lux-header ${solid ? "is-solid" : ""}`}>
      <div className="lux-nav">
        <a href="#inicio" className="lux-brand" aria-label="Solar Opará, início" onClick={() => setOpen(false)}>
          <span>Solar Opará<small>Espaço de eventos · Pirapora</small></span>
        </a>
        <nav className="lux-nav-links" aria-label="Principal">{links.map(link => <a key={link.href} href={link.href}>{link.label}</a>)}</nav>
        <a href="#datas" className="lux-nav-cta">Consultar disponibilidade <Icon name="arrow" /></a>
        <button type="button" ref={menuButton} className="lux-menu-button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="menu-mobile" aria-label={open ? "Fechar menu" : "Abrir menu"}>
          <span>{open ? "Fechar" : "Menu"}</span><span className={`menu-symbol ${open ? "is-open" : ""}`} aria-hidden="true"><i /><i /></span>
        </button>
      </div>
      <nav id="menu-mobile" aria-label="Menu móvel" hidden={!open} className="lux-mobile-menu">
        {links.map(link => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}<span aria-hidden="true">↗</span></a>)}
        <a href="#contato" onClick={() => setOpen(false)} className="mobile-contact">Fale com o Solar <Icon name="arrow" /></a>
      </nav>
    </header>
  );
}

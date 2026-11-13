import { useEffect, useState } from "react";

const links = [
  { href: "#espaco", label: "O espaço" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#galeria", label: "Galeria" },
  { href: "#datas", label: "Datas" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSolid(window.scrollY > 32);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <header className={`lux-header ${solid || open ? "is-solid" : ""}`}>
      <div className="lux-nav">
        <a href="#inicio" className="lux-brand" onClick={() => setOpen(false)}>
          <span className="lux-brand-mark">SO</span>
          <span>Solar Opará</span>
        </a>

        <nav className="lux-nav-links" aria-label="Principal">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <a href="#contato" className="lux-nav-cta">Solicitar orçamento <span>↗</span></a>

        <button className="lux-menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="menu-mobile">
          {open ? "Fechar" : "Menu"}
        </button>
      </div>

      <div id="menu-mobile" className={`lux-mobile-menu ${open ? "is-open" : ""}`}>
        {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
        <a href="#contato" onClick={() => setOpen(false)}>Solicitar orçamento ↗</a>
      </div>
    </header>
  );
}

import { useEffect, useState } from "react";

const links = [
  { href: "#espaco", label: "O espaço" },
  { href: "#experiencias", label: "Experiências" },
  { href: "#galeria", label: "Galeria" },
  { href: "#datas", label: "Datas" },
  { href: "#contato", label: "Contato" },
];

export function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const dark = solid || open;
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${dark ? "bg-background/95 text-foreground backdrop-blur border-b border-border" : "text-ink-foreground"}`}>
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <a href="#inicio" className="font-display text-2xl tracking-wide">Solar Opará</a>
        <nav aria-label="Principal" className="hidden items-center gap-9 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="eyebrow opacity-85 transition-opacity hover:opacity-100">{l.label}</a>
          ))}
          <a href="#contato" className={`eyebrow border px-5 py-3 transition-colors ${dark ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "border-ink-foreground/60 hover:bg-ink-foreground hover:text-ink"}`}>Solicitar orçamento</a>
        </nav>
        <button className="eyebrow md:hidden" aria-expanded={open} aria-controls="menu-movel" onClick={() => setOpen(!open)}>
          {open ? "Fechar" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="menu-movel" aria-label="Menu móvel" className="flex flex-col gap-6 border-t border-border px-6 py-8 md:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display text-3xl">{l.label}</a>
          ))}
          <a href="#contato" onClick={() => setOpen(false)} className="eyebrow mt-2 bg-primary px-5 py-4 text-center text-primary-foreground">Solicitar orçamento</a>
        </nav>
      )}
    </header>
  );
}
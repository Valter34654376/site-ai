import { Header } from "@/components/site/Header";
import { Gallery } from "@/components/site/Gallery";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Reveal } from "@/components/site/Reveal";
import { ADMIN_URL, HERO_VIDEO_SRC, INSTAGRAM_URL, gallery, images } from "@/lib/site-content";

const experiences = [
  { title: "Casamentos", text: "Da cerimônia à última dança, um cenário que acolhe cada etapa do dia com naturalidade e beleza.", img: images.wedding, alt: "Pavilhão preparado para recepção de casamento à noite" },
  { title: "Celebrações", text: "Aniversários, bodas e encontros de família em um ambiente que convida a permanecer.", img: images.table, alt: "Mesa posta com detalhes dourados e luz de velas" },
  { title: "Eventos sociais e corporativos", text: "Um endereço diferente para reunir pessoas, longe do comum e perto do que importa.", img: images.garden, alt: "Caminho entre jardins tropicais e paredes terracota" },
];

export default function App() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section id="inicio" className="relative flex min-h-[100svh] items-end overflow-hidden bg-ink text-ink-foreground">
          {HERO_VIDEO_SRC ? (
            <video className="absolute inset-0 h-full w-full object-cover" autoPlay muted loop playsInline poster={images.hero} aria-hidden="true">
              <source src={HERO_VIDEO_SRC} />
            </video>
          ) : (
            <img src={images.hero} alt="Fachada do Solar Opará ao entardecer, com jardins tropicais iluminados" width={1920} height={1088} fetchPriority="high" className="animate-slow-zoom absolute inset-0 h-full w-full object-cover" />
          )}
          <div className="hero-overlay absolute inset-0" />
          <div className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40 lg:px-10 lg:pb-28">
            <p className="eyebrow mb-6 text-gold">Pirapora · Minas Gerais</p>
            <h1 className="max-w-4xl text-5xl leading-[1.02] sm:text-7xl lg:text-8xl">Um cenário para momentos que <em>ficam.</em></h1>
            <p className="mt-8 max-w-lg text-base leading-relaxed opacity-90 sm:text-lg">Casamentos, celebrações e encontros em um ambiente marcante, onde arquitetura, jardins e luz se encontram.</p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a href="#espaco" className="eyebrow border border-ink-foreground/60 px-8 py-4 transition-colors hover:bg-ink-foreground hover:text-ink">Conhecer o espaço</a>
              <a href="#datas" className="eyebrow bg-primary px-8 py-4 text-primary-foreground transition-colors hover:bg-primary/85">Ver datas disponíveis</a>
            </div>
          </div>
        </section>

        {/* O espaço */}
        <section id="espaco" className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-12 lg:gap-20 lg:px-10 lg:py-36">
          <Reveal className="lg:col-span-5 lg:pt-16">
            <p className="eyebrow text-primary">O Solar Opará</p>
            <h2 className="mt-6 text-4xl leading-tight sm:text-5xl">Um lugar pensado para receber bem.</h2>
            <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
              <p>Em Pirapora, o Solar Opará reúne arquitetura de tons terrosos, paisagismo tropical e uma atmosfera calorosa que se transforma ao longo do dia.</p>
              <p>Um espaço versátil, que se adapta ao caráter de cada evento — do encontro intimista à grande celebração.</p>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-border pt-10">
              {[["Arquitetura", "Linhas e texturas que acolhem"], ["Paisagismo", "Jardins tropicais em volta"], ["Atmosfera", "Luz quente ao entardecer"], ["Versatilidade", "Formatos diversos de evento"]].map(([t, d]) => (
                <div key={t}><dt className="font-display text-2xl">{t}</dt><dd className="mt-1 text-sm text-muted-foreground">{d}</dd></div>
              ))}
            </dl>
          </Reveal>
          <Reveal className="lg:col-span-7">
            <img src={images.garden} alt="Caminho de pedras entre jardins tropicais e paredes terracota" width={1600} height={1200} loading="lazy" className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]" />
          </Reveal>
        </section>

        {/* Experiências */}
        <section id="experiencias" className="bg-forest py-24 text-ink-foreground lg:py-36">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <Reveal className="max-w-2xl">
              <p className="eyebrow text-gold">Experiências</p>
              <h2 className="mt-6 text-4xl leading-tight sm:text-5xl">Cada ocasião, com a sua própria atmosfera.</h2>
            </Reveal>
            <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
              {experiences.map((x, i) => (
                <Reveal key={x.title} className={i === 1 ? "md:mt-20" : ""}>
                  <article>
                    <div className="overflow-hidden"><img src={x.img} alt={x.alt} loading="lazy" className="aspect-[3/4] w-full object-cover transition-transform duration-[1200ms] hover:scale-105" /></div>
                    <p className="eyebrow mt-6 text-gold">0{i + 1}</p>
                    <h3 className="mt-2 text-3xl">{x.title}</h3>
                    <p className="mt-3 leading-relaxed opacity-80">{x.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Galeria */}
        <section id="galeria" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
          <Reveal className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-primary">Galeria</p>
              <h2 className="mt-6 text-4xl sm:text-5xl">Olhares sobre o Solar.</h2>
            </div>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="eyebrow border-b border-foreground pb-1 self-start md:self-auto">Mais no Instagram</a>
          </Reveal>
          <Gallery items={gallery} />
        </section>

        {/* Visita */}
        <section className="relative overflow-hidden bg-ink text-ink-foreground">
          <img src={images.wedding} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-40" />
          <div className="relative mx-auto max-w-4xl px-6 py-28 text-center lg:py-40">
            <Reveal>
              <p className="eyebrow text-gold">Pirapora · Minas Gerais</p>
              <h2 className="mt-6 text-4xl leading-tight sm:text-6xl">Visite o Solar Opará.</h2>
              <p className="mx-auto mt-6 max-w-xl leading-relaxed opacity-90">Nada substitui caminhar pelo espaço. Agende uma visita e imagine seu evento no lugar onde ele vai acontecer.</p>
              <a href="#contato" className="eyebrow mt-10 inline-block bg-primary px-10 py-4 text-primary-foreground transition-colors hover:bg-primary/85">Solicitar visita</a>
            </Reveal>
          </div>
        </section>

        <BookingFlow />
      </main>

      <footer className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-16 md:flex-row md:items-end md:justify-between lg:px-10">
          <div>
            <p className="font-display text-4xl">Solar Opará</p>
            <p className="eyebrow mt-3 opacity-70">Pirapora / MG</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="eyebrow hover:text-gold">Instagram oficial</a>
            <p className="text-xs opacity-60">© {new Date().getFullYear()} Solar Opará. Todos os direitos reservados.</p>
            <a href={ADMIN_URL} rel="noopener" className="text-xs opacity-40 hover:opacity-80">Acesso administrativo</a>
          </div>
        </div>
      </footer>
    </>
  );
}
import { Header } from "@/components/site/Header";
import { Gallery } from "@/components/site/Gallery";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Reveal } from "@/components/site/Reveal";
import { SiteEffects } from "@/components/site/SiteEffects";
import { ADMIN_URL, INSTAGRAM_URL, gallery, images } from "@/lib/site-content";

const experiences = [
  { title: "Casamentos", kicker: "01 · O grande dia", text: "Uma atmosfera que muda com a luz, valoriza a cerimônia e transforma cada entrada em cena.", img: images.wedding, alt: "Casamento realizado no Solar Opará" },
  { title: "Celebrações", kicker: "02 · Sua história", text: "Aniversários, bodas e encontros com uma linguagem visual elegante, quente e nada genérica.", img: images.table, alt: "Celebração realizada no Solar Opará" },
  { title: "Eventos especiais", kicker: "03 · Fora do comum", text: "Um espaço que aceita diferentes composições, experiências e formatos sem perder identidade.", img: images.garden, alt: "Estrutura do Solar Opará" },
];

function SafeImage({ src, fallback, alt, className, ...rest }: React.ImgHTMLAttributes<HTMLImageElement> & { fallback: string }) {
  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        const el = e.currentTarget;
        if (el.dataset.fallbackApplied) return;
        el.dataset.fallbackApplied = "1";
        el.src = fallback;
      }}
    />
  );
}

export default function App() {
  return (
    <>
      <SiteEffects />
      <Header />

      <main className="site-shell">
        <section id="inicio" className="hero-cinematic">
          <div className="hero-media-frame" aria-hidden="true">
            <SafeImage
              src={images.hero}
              fallback={images.heroFallback}
              alt=""
              fetchPriority="high"
              className="hero-media"
            />
          </div>
          <div className="hero-vignette" />
          <div className="hero-light hero-light-a" />
          <div className="hero-light hero-light-b" />
          <div className="hero-grid" />

          <div className="hero-ghost" aria-hidden="true">OPARÁ</div>

          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="hero-kicker-dot" />
                Pirapora · Minas Gerais
              </div>

              <h1 className="hero-title">
                Eventos que
                <span className="hero-title-line">
                  parecem <em>cinema.</em>
                </span>
              </h1>

              <p className="hero-lead">
                Arquitetura, jardins, luz e atmosfera para transformar uma data importante em uma experiência que ninguém esquece.
              </p>

              <div className="hero-actions">
                <a href="#datas" className="button-lux button-lux-primary">
                  <span>Ver datas disponíveis</span><i aria-hidden="true">↗</i>
                </a>
                <a href="#espaco" className="button-lux button-lux-ghost">
                  <span>Explorar o Solar</span><i aria-hidden="true">↓</i>
                </a>
              </div>
            </div>

            <aside className="hero-side-note">
              <span className="hero-side-line" />
              <p>Espaço de eventos<br />em Pirapora / MG</p>
            </aside>
          </div>

          <div className="hero-scroll">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>CASAMENTOS</span><b>✦</b><span>CELEBRAÇÕES</span><b>✦</b><span>EXPERIÊNCIAS</span><b>✦</b><span>SOLAR OPARÁ</span><b>✦</b>
            <span>CASAMENTOS</span><b>✦</b><span>CELEBRAÇÕES</span><b>✦</b><span>EXPERIÊNCIAS</span><b>✦</b><span>SOLAR OPARÁ</span><b>✦</b>
          </div>
        </div>

        <section id="espaco" className="manifesto-section">
          <div className="manifesto-orbit manifesto-orbit-a" />
          <div className="manifesto-orbit manifesto-orbit-b" />

          <div className="section-wrap manifesto-grid">
            <Reveal className="manifesto-label">
              <p className="eyebrow text-primary">O Solar Opará</p>
              <span className="manifesto-index">01</span>
            </Reveal>

            <Reveal className="manifesto-copy">
              <p className="manifesto-statement">
                Não é só um espaço.
                <span>É a atmosfera inteira trabalhando a favor do seu evento.</span>
              </p>
              <div className="manifesto-body">
                <p>Texturas quentes, paisagismo, arquitetura e iluminação se misturam para criar uma presença visual forte antes mesmo da decoração entrar em cena.</p>
                <p>O objetivo é simples: fazer o convidado sentir que chegou a um lugar especial.</p>
              </div>
            </Reveal>

            <Reveal className="manifesto-image-wrap">
              <div className="image-ribbon">SOLAR · OPARÁ · PIRAPORA</div>
              <SafeImage src={images.garden} fallback={images.wedding} alt="Estrutura e paisagismo do Solar Opará" loading="lazy" className="manifesto-image" />
              <div className="image-glass-card">
                <span>Arquitetura</span>
                <strong>Identidade que aparece em cada enquadramento.</strong>
              </div>
            </Reveal>
          </div>
        </section>

        <section id="experiencias" className="experiences-section">
          <div className="section-wrap">
            <Reveal className="experiences-head">
              <div>
                <p className="eyebrow text-gold">Experiências</p>
                <h2>Três formas de<br /><em>viver o Solar.</em></h2>
              </div>
              <p className="experiences-intro">Passe o mouse pelos cartões. A ideia aqui é trazer profundidade e movimento sem perder a elegância.</p>
            </Reveal>

            <div className="experience-grid">
              {experiences.map((item, i) => (
                <Reveal key={item.title} className={i === 1 ? "experience-offset" : ""}>
                  <article className="experience-card">
                    <div className="experience-media">
                      <SafeImage src={item.img} fallback={images.heroFallback} alt={item.alt} loading="lazy" />
                      <div className="experience-shine" />
                      <span className="experience-number">0{i + 1}</span>
                    </div>
                    <div className="experience-copy">
                      <p>{item.kicker}</p>
                      <h3>{item.title}</h3>
                      <span>{item.text}</span>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="interlude">
          <div className="interlude-word" aria-hidden="true">MEMÓRIAS</div>
          <div className="section-wrap interlude-inner">
            <Reveal>
              <p className="eyebrow text-gold">O efeito certo</p>
              <blockquote>
                “O lugar não precisa competir com o evento.
                <em> Ele precisa amplificar o momento.</em>”
              </blockquote>
            </Reveal>
          </div>
        </section>

        <section id="galeria" className="gallery-section">
          <div className="section-wrap">
            <Reveal className="gallery-heading">
              <div>
                <p className="eyebrow text-primary">Galeria</p>
                <h2>O Solar em<br /><em>movimento.</em></h2>
              </div>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                Ver Instagram <span>↗</span>
              </a>
            </Reveal>
            <div className="gallery-stage">
              <Gallery items={gallery} />
            </div>
          </div>
        </section>

        <section className="visit-cinematic">
          <SafeImage src={images.wedding} fallback={images.heroFallback} alt="" aria-hidden="true" loading="lazy" className="visit-bg" />
          <div className="visit-overlay" />
          <div className="visit-glow" />
          <Reveal className="visit-content">
            <p className="eyebrow text-gold">Conheça pessoalmente</p>
            <h2>Alguns lugares você vê.<br /><em>Outros você sente.</em></h2>
            <p>Agende uma visita, caminhe pelo espaço e veja como a luz, os jardins e a arquitetura funcionam ao vivo.</p>
            <a href="#contato" className="button-lux button-lux-primary">
              <span>Solicitar visita</span><i aria-hidden="true">↗</i>
            </a>
          </Reveal>
        </section>

        <div className="booking-shell">
          <BookingFlow />
        </div>
      </main>

      <footer className="lux-footer">
        <div className="section-wrap lux-footer-grid">
          <div>
            <p className="lux-footer-logo">Solar Opará</p>
            <p className="eyebrow opacity-60">Pirapora · Minas Gerais</p>
          </div>
          <div className="lux-footer-links">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
            <a href="#datas">Datas</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="lux-footer-meta">
            <p>© {new Date().getFullYear()} Solar Opará.</p>
            <a href={ADMIN_URL} rel="noopener">Acesso administrativo</a>
          </div>
        </div>
      </footer>
    </>
  );
}

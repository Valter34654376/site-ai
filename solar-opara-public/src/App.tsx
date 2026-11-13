import { Header } from "@/components/site/Header";
import { Gallery } from "@/components/site/Gallery";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Reveal } from "@/components/site/Reveal";
import { SiteEffects } from "@/components/site/SiteEffects";
import { SafeImage } from "@/components/site/SafeImage";
import { ADMIN_URL, INSTAGRAM_URL, gallery, media } from "@/lib/site-content";

const experiences = [
  { title: "Casamentos", kicker: "01 · Para o seu sim", text: "A madeira, as flores e a luz do fim de tarde. Um cenário que acolhe o começo da sua história.", image: media.wedding, position: "52% 50%" },
  { title: "Celebrações", kicker: "02 · Para reunir quem importa", text: "Aniversários, bodas e encontros que ganham outro ritmo entre o jardim e o salão.", image: media.garden, position: "35% 50%" },
  { title: "Eventos especiais", kicker: "03 · Para criar possibilidades", text: "Arquitetura e paisagismo em diálogo, prontos para receber a identidade do seu evento.", image: media.garden, position: "78% 40%" },
];

export default function App() {
  return (
    <>
      <a className="skip-link" href="#espaco">Pular para o conteúdo</a>
      <SiteEffects />
      <Header />

      <main className="site-shell">
        <section id="inicio" className="hero-cinematic">
          <div className="hero-media-frame" aria-hidden="true">
            <SafeImage
              item={media.hero}
              fallback={media.fallback}
              alt=""
              fetchPriority="high"
              loading="eager"
              sizes="(max-width: 640px) 150vw, 104vw"
              className="hero-media"
            />
          </div>
          <div className="hero-vignette" />
          <div className="hero-light hero-light-a" />
          <div className="hero-light hero-light-b" />
          <div className="hero-ghost" aria-hidden="true">Est. Pirapora</div>

          <div className="hero-content">
            <div className="hero-copy">
              <div className="hero-kicker">
                <span className="hero-kicker-dot" />
                Solar Opará · Pirapora, MG
              </div>

              <h1 className="hero-title">
                Onde a vida
                <span className="hero-title-line">
                  vira <em>memória.</em>
                </span>
              </h1>

              <p className="hero-lead">
                Um lugar para celebrar com tempo, natureza e presença. Seu próximo grande momento começa aqui.
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

            <a href="#galeria" className="hero-side-note" aria-label="Conheça a coleção de fotografias do Solar Opará">
              <SafeImage item={media.wedding} loading="lazy" sizes="180px" alt="" />
              <span><small>Histórias reais</small>Um olhar mais perto <i aria-hidden="true">↗</i></span>
            </a>
          </div>

          <div className="hero-scroll">
            <span>Explore o Solar</span>
            <i />
          </div>
          <div className="hero-photo-caption"><span>O jardim, à noite.</span><span>Fotografia · Oliver Fotos</span></div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span>NATUREZA</span><b>✳</b><span>ARQUITETURA</span><b>✳</b><span>ENCONTROS</span><b>✳</b><span>MEMÓRIAS</span><b>✳</b>
            <span>NATUREZA</span><b>✳</b><span>ARQUITETURA</span><b>✳</b><span>ENCONTROS</span><b>✳</b><span>MEMÓRIAS</span><b>✳</b>
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
              <h2 className="manifesto-statement">O espaço acolhe.<span>A sua história<br />dá vida.</span></h2>
              <div className="manifesto-body">
                <p>Em Pirapora, a madeira encontra o verde. O salão se abre para o jardim, e a luz desenha novas atmosferas ao longo da celebração.</p>
                <p>Um lugar que recebe a sua ideia, aproxima as pessoas e deixa espaço para aquilo que torna cada encontro único.</p>
              </div>
            </Reveal>

            <Reveal className="manifesto-image-wrap">
              <div className="image-ribbon">SOLAR · OPARÁ · PIRAPORA</div>
              <SafeImage item={media.wedding} fallback={media.garden} loading="lazy" sizes="(max-width: 900px) 94vw, 780px" className="manifesto-image" />
              <div className="image-glass-card">
                <span>Madeira, flores & luz</span>
                <strong>O cenário faz parte<br />da lembrança.</strong>
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
              <p className="experiences-intro">Há muitas maneiras de celebrar. Encontre a sua e deixe o Solar fazer parte desse momento.</p>
            </Reveal>

            <div className="experience-grid">
              {experiences.map((item, i) => (
                <Reveal key={item.title} className={i === 1 ? "experience-offset" : ""}>
                  <article className="experience-card">
                    <div className="experience-media">
                      <SafeImage item={item.image} fallback={media.wedding} loading="lazy" sizes="(max-width: 640px) 94vw, (max-width: 900px) 50vw, 400px" style={{ objectPosition: item.position }} />
                      <div className="experience-shine" />
                      <span className="experience-number">0{i + 1}</span>
                    </div>
                    <div className="experience-copy">
                      <p>{item.kicker}</p>
                      <h3>{item.title}</h3>
                      <span>{item.text}</span>
                      <a href="#contato" className="experience-link" aria-label={`Conversar sobre ${item.title.toLowerCase()}`}>Imagine o seu evento <i aria-hidden="true">↗</i></a>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="interlude">
          <SafeImage item={media.wedding} fallback={media.garden} alt="" aria-hidden="true" loading="lazy" sizes="100vw" className="interlude-photo" />
          <div className="interlude-shade" />
          <div className="interlude-word" aria-hidden="true">celebrar</div>
          <div className="section-wrap interlude-inner">
            <Reveal>
              <p className="eyebrow text-gold">Presentes no que importa</p>
              <blockquote>
                Da primeira luz
                <em> ao último abraço.</em>
              </blockquote>
            </Reveal>
          </div>
        </section>

        <section id="galeria" className="gallery-section">
          <div className="section-wrap">
            <Reveal className="gallery-heading">
              <div>
                <p className="eyebrow text-primary">Coleção de momentos</p>
                <h2>O lugar. As pessoas.<br /><em>O que fica.</em></h2>
              </div>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                @solaroparaoficial <span>↗</span>
              </a>
            </Reveal>
            <p className="gallery-intro">Um passeio pelo Solar e pelas histórias de casamento que passam por aqui. Fotografias de Oliver Fotos, com os contextos de cada registro na coleção.</p>
            <div className="gallery-stage">
              <Gallery items={gallery} />
            </div>
          </div>
        </section>

        <section className="visit-cinematic">
          <SafeImage item={media.garden} fallback={media.wedding} alt="" aria-hidden="true" loading="lazy" sizes="100vw" className="visit-bg" />
          <div className="visit-overlay" />
          <div className="visit-glow" />
          <Reveal className="visit-content">
            <p className="eyebrow text-gold">Conheça pessoalmente</p>
            <h2>O próximo capítulo<br /><em>pode ser o seu.</em></h2>
            <p>Caminhe pelo jardim. Entre no salão. Imagine as pessoas que você quer ter por perto. Venha sentir o Solar.</p>
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
            <p className="footer-address">Rua Homero Nunes Macedo, 1208<br />Sagrada Família · Pirapora, MG</p>
          </div>
          <div className="lux-footer-links">
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram ↗</a>
            <a href="#datas">Datas</a>
            <a href="#contato">Contato</a>
          </div>
          <div className="lux-footer-meta">
            <p>© {new Date().getFullYear()} Solar Opará.</p>
            <p>Fotografias: Oliver Fotos.</p>
            <a href={ADMIN_URL} rel="noopener">Acesso administrativo</a>
          </div>
        </div>
      </footer>
    </>
  );
}

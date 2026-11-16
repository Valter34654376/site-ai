import { Header } from "@/components/site/Header";
import { Gallery } from "@/components/site/Gallery";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Reveal } from "@/components/site/Reveal";
import { SiteEffects } from "@/components/site/SiteEffects";
import { SafeImage } from "@/components/site/SafeImage";
import { Icon } from "@/components/site/Icon";
import { ADMIN_URL, INSTAGRAM_URL, gallery, media } from "@/lib/site-content";

const occasions = [
  { title: "Casamentos", number: "01", text: "Da cerimônia à celebração, um cenário para reunir as pessoas que fazem parte da sua história." },
  { title: "Celebrações", number: "02", text: "Aniversários, bodas e encontros em família. Há momentos que merecem um lugar especial." },
  { title: "Eventos especiais", number: "03", text: "Uma nova ideia, um encontro entre amigos ou uma ocasião da sua empresa. Vamos imaginar as possibilidades." },
];
const questions = [
  { title: "Como consultar uma data?", text: "Use o calendário abaixo para ver as datas disponíveis. Selecione a que você deseja e envie o formulário. A equipe confirma os detalhes e a disponibilidade antes de efetivar a reserva." },
  { title: "Posso conhecer o espaço antes de decidir?", text: "Sim. Envie uma mensagem pelo formulário ou pelo Instagram oficial e solicite uma visita. A equipe combina o melhor dia e horário com você." },
  { title: "O envio do formulário já reserva a data?", text: "Não. O formulário é uma solicitação de informações. A reserva só é confirmada diretamente com a equipe, após alinhar os detalhes do evento." },
  { title: "Onde fica o Solar Opará?", text: "Na Rua Homero Nunes Macedo, 1208, bairro Sagrada Família, em Pirapora, Minas Gerais. Você encontra o endereço e o acesso ao mapa na seção de contato." },
];

export default function App() {
  return (
    <>
      <a className="skip-link" href="#espaco">Pular para o conteúdo</a>
      <SiteEffects />
      <Header />
      <main id="conteudo">
        <section id="inicio" className="hero-editorial" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow hero-kicker">Solar Opará · Pirapora, MG</p>
            <h1 id="hero-title" className="hero-title">Para celebrar<br /><em>o que importa.</em></h1>
            <p className="hero-lead">Um espaço onde a natureza encontra a arquitetura para receber o seu grande momento.</p>
            <div className="hero-actions">
              <a href="#datas" className="button-lux button-lux-primary">Consultar uma data <Icon name="arrow" /></a>
              <a href="#espaco" className="quiet-link">Conheça o espaço <span aria-hidden="true">↓</span></a>
            </div>
            <div className="hero-location"><span className="hero-location-line" /><p>Casamentos, celebrações<br />e encontros especiais.</p></div>
          </div>
          <figure className="hero-visual">
            <SafeImage item={media.hero} fallback={media.garden} alt="Casal sob os arcos de madeira e flores do Solar Opará, ao pôr do sol." fetchPriority="high" loading="eager" sizes="(min-width: 901px) 56vw, 100vw" className="hero-media" />
            <figcaption>Um momento no Solar. Uma lembrança para sempre.</figcaption>
          </figure>
        </section>

        <div className="venue-signature" aria-label="Conheça o Solar">
          <div><Icon name="leaf" /><span>Natureza ao redor</span></div>
          <div><Icon name="arch" /><span>Arquitetura que acolhe</span></div>
          <div><Icon name="pin" /><span>Pirapora, Minas Gerais</span></div>
        </div>

        <section id="espaco" className="space-section section-wrap">
          <Reveal className="space-photo">
            <SafeImage item={media.garden} fallback={media.wedding} loading="lazy" sizes="(max-width: 900px) 100vw, 52vw" />
            <span className="photo-caption">O jardim e o salão, à noite.</span>
          </Reveal>
          <Reveal className="space-copy manifesto-copy">
            <p className="eyebrow">Bem-vindo ao Solar</p>
            <h2>O espaço acolhe.<br /><em>A história é sua.</em></h2>
            <p>Entre o verde do jardim e a presença da madeira, o Solar Opará abre espaço para encontros que merecem ser vividos por inteiro.</p>
            <p>Em Pirapora, o salão e a área externa fazem parte do mesmo cenário. A luz muda, as pessoas chegam e a celebração ganha o seu jeito.</p>
            <a href="#galeria" className="text-link">Veja o Solar em fotografias <Icon name="arrow" /></a>
          </Reveal>
        </section>

        <section id="experiencias" className="occasions-section">
          <div className="section-wrap">
            <Reveal className="section-heading">
              <div><p className="eyebrow">O seu jeito de celebrar</p><h2>Para cada encontro,<br /><em>uma nova história.</em></h2></div>
              <p>O que você está planejando?<br />A gente começa por ouvir.</p>
            </Reveal>
            <div className="occasions-grid">
              {occasions.map(item => <Reveal key={item.number}><article className="occasion"><span className="occasion-number">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p><a href="#contato" aria-label={`Conversar sobre ${item.title.toLowerCase()}`}>Converse com a equipe <Icon name="arrow" /></a></article></Reveal>)}
            </div>
          </div>
        </section>

        <section id="galeria" className="gallery-section section-wrap">
          <Reveal className="section-heading">
            <div><p className="eyebrow">Um olhar mais perto</p><h2>O cenário.<br /><em>Os momentos.</em></h2></div>
            <div className="gallery-description"><p>Conheça o Solar pelas imagens. Explore também as histórias de casamento do acervo, com o contexto de cada fotografia.</p><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="text-link">Acompanhe no Instagram <span aria-hidden="true">↗</span></a></div>
          </Reveal>
          <Gallery items={gallery} />
        </section>

        <section className="visit-section">
          <div className="section-wrap visit-inner">
            <Reveal><p className="eyebrow">Do primeiro olhar ao grande dia</p><h2>Imagine o seu evento aqui.<br /><em>Depois, venha sentir o lugar.</em></h2></Reveal>
            <Reveal className="visit-action"><p>Uma visita é o primeiro passo para transformar a sua ideia em um momento especial.</p><a href="#contato" className="button-lux button-lux-light">Quero conhecer o Solar <Icon name="arrow" /></a></Reveal>
          </div>
        </section>

        <BookingFlow />

        <section className="faq-section section-wrap" aria-labelledby="faq-title">
          <div><p className="eyebrow">Antes de começar</p><h2 id="faq-title">Algumas respostas.<br /><em>Uma boa conversa.</em></h2><p>Se ficou alguma dúvida, fale com a equipe. Estamos por aqui.</p></div>
          <div className="faq-list">{questions.map(item => <details key={item.title}><summary>{item.title}<Icon name="plus" /></summary><p>{item.text}</p></details>)}</div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="section-wrap footer-main">
          <div className="footer-brand"><a href="#inicio">Solar Opará</a><p>Um lugar para celebrar<br />o que realmente importa.</p></div>
          <div><span className="footer-label">Encontre o Solar</span><address>Rua Homero Nunes Macedo, 1208<br />Sagrada Família · Pirapora, MG</address><a href="https://www.google.com/maps/search/?api=1&query=Rua+Homero+Nunes+Macedo+1208+Pirapora+MG" target="_blank" rel="noopener noreferrer" className="footer-link">Como chegar <span aria-hidden="true">↗</span></a></div>
          <div><span className="footer-label">Vamos conversar</span><a href="#datas" className="footer-link">Consultar disponibilidade</a><a href="#contato" className="footer-link">Solicitar informações</a><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="footer-link">@solaroparaoficial <span aria-hidden="true">↗</span></a></div>
        </div>
        <div className="section-wrap footer-bottom"><p>© {new Date().getFullYear()} Solar Opará.</p><p>Fotografias: Oliver Fotos.</p><a href={ADMIN_URL} rel="noopener">Acesso administrativo</a></div>
      </footer>
    </>
  );
}

import { ADMIN_URL, INSTAGRAM_URL, MAP_URL } from "@/lib/site-content";
import { Icon } from "./Icon";

const questions = [
  [
    "Como consultar uma data?",
    "Escolha um dia disponível no calendário e envie sua solicitação. A equipe confirma os detalhes antes de efetivar a reserva.",
  ],
  [
    "Como agendar uma visita?",
    "Use o formulário ou o Instagram oficial para solicitar uma visita. A equipe combina o dia e o horário com você.",
  ],
  [
    "O formulário já reserva a data?",
    "O envio inicia uma conversa. A reserva depende da confirmação direta da equipe e do alinhamento dos detalhes do evento.",
  ],
];

export function Footer() {
  return (
    <>
      <section className="faq-section section-wrap" aria-labelledby="faq-title">
        <h2 id="faq-title">
          Antes da
          <br />
          <em>nossa conversa.</em>
        </h2>
        <div className="faq-list">
          {questions.map(([title, text]) => (
            <details key={title}>
              <summary>
                {title}
                <Icon name="plus" />
              </summary>
              <p>{text}</p>
            </details>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <div className="section-wrap footer-top">
          <p>
            O próximo encontro
            <br />
            pode ser aqui.
          </p>
          <a href="#datas" className="text-link">
            Encontre a sua data <Icon name="arrow" />
          </a>
        </div>
        <a
          href="#inicio"
          className="footer-wordmark"
          aria-label="Solar Opará, voltar ao início"
        >
          Solar Opará<span aria-hidden="true">✳</span>
        </a>
        <div className="section-wrap footer-main">
          <div>
            <span className="footer-label">O nosso endereço</span>
            <address>
              Rua Homero Nunes Macedo, 1208
              <br />
              Sagrada Família · Pirapora, MG
            </address>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Como chegar ↗
            </a>
          </div>
          <div>
            <span className="footer-label">O Solar, de perto</span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              @solaroparaoficial ↗
            </a>
            <a href="#contato" className="footer-link">
              Fale com a equipe
            </a>
          </div>
          <p className="footer-signature">
            Madeira, verde
            <br />e gente por perto.
          </p>
        </div>
        <div className="section-wrap footer-bottom">
          <p>© {new Date().getFullYear()} Solar Opará.</p>
          <p>Fotografias: Oliver Fotos.</p>
          <a href={ADMIN_URL} rel="noopener">
            Acesso administrativo
          </a>
        </div>
      </footer>
    </>
  );
}

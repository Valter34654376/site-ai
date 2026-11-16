import { ADMIN_URL, INSTAGRAM_URL, MAP_URL } from "@/lib/site-content";
import { Icon } from "./Icon";

const questions = [
  [
    "Como consultar uma data?",
    "Escolha um dia disponível no calendário acima e envie sua solicitação pelo formulário. Nossa equipe entrará em contato para informar condições e valores.",
  ],
  [
    "Como agendar uma visita presencial?",
    "Envie uma solicitação pelo formulário ou entre em contato pelo Instagram oficial @solaroparaoficial para agendar um horário de visita em Pirapora.",
  ],
  [
    "O envio do formulário já reserva a data?",
    "Não. O formulário registra seu interesse inicial. A reserva efetiva da data ocorre mediante confirmação da equipe e assinatura do contrato de locação.",
  ],
];

export function Footer() {
  return (
    <>
      <section className="faq-section" aria-labelledby="faq-title">
        <div className="section-wrap faq-grid">
          <div className="faq-intro">
            <span className="eyebrow">Informações úteis</span>
            <h2 id="faq-title">Perguntas frequentes.</h2>
          </div>
          <div className="faq-list">
            {questions.map(([title, text]) => (
              <details key={title}>
                <summary>
                  <span>{title}</span>
                  <Icon name="plus" />
                </summary>
                <p>{text}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="section-wrap footer-main">
          <div className="footer-brand-col">
            <a
              href="#inicio"
              className="footer-brand"
              aria-label="Solar Opará, voltar ao início"
            >
              Solar Opará
            </a>
            <p className="footer-desc">
              Espaço para casamentos, celebrações e eventos em Pirapora, Minas
              Gerais.
            </p>
          </div>

          <div className="footer-col">
            <span className="footer-label">Navegação</span>
            <a href="#espaco" className="footer-link">
              O Espaço
            </a>
            <a href="#experiencias" className="footer-link">
              Experiências
            </a>
            <a href="#galeria" className="footer-link">
              Galeria
            </a>
            <a href="#datas" className="footer-link">
              Disponibilidade
            </a>
            <a href="#contato" className="footer-link">
              Contato
            </a>
          </div>

          <div className="footer-col">
            <span className="footer-label">Endereço</span>
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
              Abrir no Google Maps ↗
            </a>
          </div>

          <div className="footer-col">
            <span className="footer-label">Canais</span>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Instagram @solaroparaoficial ↗
            </a>
            <a href="#datas" className="footer-link">
              Consultar datas disponíveis
            </a>
          </div>
        </div>

        <div className="section-wrap footer-bottom">
          <p>© {new Date().getFullYear()} Solar Opará Turismo e Hotéis.</p>
          <p>Fotografias: Oliver Fotos.</p>
          <a href={ADMIN_URL} rel="noopener">
            Acesso administrativo
          </a>
        </div>
      </footer>
    </>
  );
}

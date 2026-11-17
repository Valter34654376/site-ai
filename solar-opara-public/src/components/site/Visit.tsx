import { Icon } from "./Icon";
import { Reveal } from "./Reveal";
import { MAP_URL } from "@/lib/site-content";

export function Visit() {
  return (
    <section
      id="visita"
      className="visit-section"
      aria-labelledby="visit-title"
    >
      <div className="section-wrap visit-panel">
        <div className="visit-copy">
          <span className="eyebrow">Visita presencial</span>
          <Reveal>
            <h2 id="visit-title">Conheça o Solar Opará pessoalmente.</h2>
          </Reveal>
          <p>
            Agende um horário com a nossa equipe para percorrer o jardim,
            conhecer o salão principal e avaliar a configuração ideal para o seu
            evento em Pirapora.
          </p>
        </div>

        <div className="visit-details">
          <address className="visit-address">
            <strong>Endereço</strong>
            <span>Rua Homero Nunes Macedo, 1208</span>
            <span>Bairro Sagrada Família · Pirapora, MG</span>
          </address>
          <div className="visit-actions">
            <a href="#dados-evento" className="btn-primary">
              <span>Solicitar visita pelo formulário</span>
              <Icon name="arrow" />
            </a>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <span>Ver localização no mapa</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

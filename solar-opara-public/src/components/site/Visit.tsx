import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

export function Visit() {
  return (
    <section
      id="visita"
      className="visit-section"
      aria-labelledby="visit-title"
    >
      <div className="section-wrap visit-inner">
        <span className="chapter-label">Uma visita ao Solar</span>
        <Reveal>
          <h2 id="visit-title">
            Tem coisas
            <br />
            que a gente
            <br />
            <em>precisa sentir.</em>
          </h2>
        </Reveal>
        <div className="visit-invitation">
          <span className="visit-arch" aria-hidden="true" />
          <p>
            O jardim, a luz, a escala do lugar.
            <br />
            Venha ver de perto, antes de imaginar o seu dia.
          </p>
          <a href="#contato" className="button-lux button-lux-light">
            Quero agendar uma visita <Icon name="arrow" />
          </a>
          <span>Pirapora, Minas Gerais</span>
        </div>
      </div>
    </section>
  );
}

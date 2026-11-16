import { useState } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

const occasions = [
  {
    title: "Casamentos",
    lead: "O sim é só o começo.",
    text: "A chegada, a cerimônia, a primeira dança. Conte como você imagina o dia; a conversa começa por vocês.",
    action: "Conversar sobre meu casamento",
  },
  {
    title: "Celebrações",
    lead: "Há encontros que pedem mais tempo.",
    text: "Uma nova idade. Mais um ano juntos. A família inteira à mesa. O motivo é seu; o endereço pode ser o Solar.",
    action: "Planejar uma celebração",
  },
  {
    title: "Eventos especiais",
    lead: "Uma ideia pode reunir muita gente.",
    text: "Da ocasião da empresa ao encontro entre amigos. Compartilhe o formato e os detalhes para conversar sobre as possibilidades.",
    action: "Conversar sobre meu evento",
  },
];

export function Experiences() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      id="experiencias"
      className="experiences-section"
      aria-labelledby="experiences-title"
    >
      <div className="section-wrap experiences-grid">
        <div className="experiences-intro">
          <span className="chapter-label">02 / Experiências</span>
          <Reveal>
            <h2 id="experiences-title">
              Cada motivo,
              <br />
              <em>um encontro.</em>
            </h2>
          </Reveal>
          <p>
            Não existe um único jeito de celebrar.
            <br />
            Existe o seu.
          </p>
          <span className="experiences-mark" aria-hidden="true">
            S<span>O</span>
          </span>
        </div>
        <div className="occasion-list">
          {occasions.map((item, index) => (
            <article
              key={item.title}
              className={`occasion-story ${open === index ? "is-open" : ""}`}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={open === index}
                  aria-controls={`occasion-${index}`}
                  id={`occasion-trigger-${index}`}
                  onClick={() =>
                    setOpen((value) => (value === index ? null : index))
                  }
                >
                  <span className="occasion-index">0{index + 1}</span>
                  <span>{item.title}</span>
                  <Icon name="plus" />
                </button>
              </h3>
              <div
                id={`occasion-${index}`}
                role="region"
                aria-labelledby={`occasion-trigger-${index}`}
                hidden={open !== index}
                className="occasion-body"
              >
                <p className="occasion-lead">{item.lead}</p>
                <p>{item.text}</p>
                <a href="#contato" className="text-link">
                  {item.action}
                  <Icon name="arrow" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="experiences-baseline section-wrap">
        <span>O seu jeito de estar junto.</span>
        <span>Pirapora / MG</span>
      </div>
    </section>
  );
}

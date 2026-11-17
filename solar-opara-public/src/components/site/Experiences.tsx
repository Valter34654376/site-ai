import { useState } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

const occasions = [
  {
    title: "Casamentos",
    lead: "Cerimônia ao ar livre e recepção no mesmo endereço.",
    text: "O gramado recebe a cerimônia; o salão coberto, a recepção. Os ambientes se conectam sem deslocamento entre os dois momentos.",
    action: "Solicitar orçamento de casamento",
  },
  {
    title: "Celebrações",
    lead: "Aniversários, bodas e encontros familiares.",
    text: "A família inteira à mesa, com circulação livre entre salão e jardim. O espaço se adapta a encontros durante o dia e recepções à noite.",
    action: "Planejar uma celebração",
  },
  {
    title: "Eventos",
    lead: "Recepções, formaturas e encontros.",
    text: "A locação exclusiva permite organizar os ambientes internos e externos com projetos próprios de decoração, iluminação, gastronomia e montagem.",
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
      <div className="section-wrap experiences-layout">
        <div className="experiences-intro">
          <span className="eyebrow">Celebrações no Solar</span>
          <Reveal>
            <h2 id="experiences-title">
              Três formas de ocupar o espaço.
            </h2>
          </Reveal>
          <p>
            Jardim e salão podem assumir configurações diferentes conforme a
            ocasião. Cada locação é exclusiva para a data contratada. Conheça
            os formatos atendidos pelo Solar Opará.
          </p>
          <a href="#datas" className="text-link">
            <span>Consultar datas</span>
            <Icon name="arrow" />
          </a>
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
                  <span className="occasion-name">{item.title}</span>
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
                  <span>{item.action}</span>
                  <Icon name="arrow" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

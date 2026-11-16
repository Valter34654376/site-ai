import { useState } from "react";
import { Icon } from "./Icon";
import { Reveal } from "./Reveal";

const occasions = [
  {
    title: "Casamentos",
    lead: "Cerimônia ao ar livre e recepção no mesmo endereço.",
    text: "O gramado recebe o altar e os convidados para a cerimônia, enquanto o salão coberto acomoda o jantar, a festa e a estrutura de som e buffet sem necessidade de deslocamento.",
    action: "Solicitar orçamento de casamento",
  },
  {
    title: "Celebrações",
    lead: "Aniversários, bodas e encontros familiares.",
    text: "A família inteira à mesa com circulação livre entre o salão e os jardins. O espaço se adapta tanto a celebrações diurnas quanto a recepções noturnas.",
    action: "Planejar uma celebração",
  },
  {
    title: "Eventos especiais",
    lead: "Recepções corporativas, formaturas e encontros.",
    text: "Locação exclusiva por evento com liberdade para projetos personalizados de decoração, iluminação, gastronomia e montagem.",
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
          <span className="eyebrow">Formatos de evento</span>
          <Reveal>
            <h2 id="experiences-title">
              Um espaço adaptável a diferentes celebrações.
            </h2>
          </Reveal>
          <p>
            Cada locação é exclusiva para a data contratada, permitindo
            organizar os ambientes internos e externos conforme o porte e o
            formato do seu evento.
          </p>
          <a href="#datas" className="text-link">
            <span>Consultar calendário de disponibilidade</span>
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

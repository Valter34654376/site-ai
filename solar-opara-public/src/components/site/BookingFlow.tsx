import { useCallback, useEffect, useRef, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { ContactForm } from "./ContactForm";
import { Reveal } from "./Reveal";
import { Icon } from "./Icon";
import { fetchBusyDates } from "@/lib/booking";
import { INSTAGRAM_URL, MAP_URL } from "@/lib/site-content";

const steps = [
  ["Consulte a data", "Veja a disponibilidade no calendário ao lado."],
  [
    "Conte seus planos",
    "Compartilhe a ideia e os primeiros detalhes do evento.",
  ],
  [
    "Converse com a equipe",
    "Alinhamos as informações para orçamento ou visita.",
  ],
];

export function BookingFlow() {
  const [busy, setBusy] = useState<Set<string> | null>(null);
  const [failed, setFailed] = useState(false);
  const [date, setDate] = useState("");
  const section = useRef<HTMLElement>(null);
  const controller = useRef<AbortController | null>(null);
  const load = useCallback(() => {
    controller.current?.abort();
    const active = new AbortController();
    controller.current = active;
    setBusy(null);
    setFailed(false);
    fetchBusyDates(active.signal)
      .then((value) => {
        if (!active.signal.aborted) setBusy(value);
      })
      .catch(() => {
        if (!active.signal.aborted) setFailed(true);
      });
  }, []);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      load();
      return () => controller.current?.abort();
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "300px 0px" },
    );
    if (section.current) observer.observe(section.current);
    return () => {
      observer.disconnect();
      controller.current?.abort();
    };
  }, [load]);

  function pick(iso: string) {
    setDate(iso);
    document
      .getElementById("dados-evento")
      ?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  }

  return (
    <>
      <section ref={section} id="datas" className="dates-section">
        <div className="section-wrap dates-grid">
          <Reveal className="dates-copy">
            <p className="chapter-label">04 / O próximo capítulo</p>
            <h2>
              Todo encontro
              <br />
              começa com
              <br />
              <em>um dia.</em>
            </h2>
            <p>
              Encontre o seu no calendário.
              <br />
              Depois, conte o que você tem em mente.
            </p>
            <ol className="booking-steps">
              {steps.map(([title, text], index) => (
                <li key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="booking-note">
              A consulta é o início da conversa. A reserva depende da
              confirmação da equipe.
            </p>
          </Reveal>
          <Reveal className="calendar-wrap">
            <AvailabilityCalendar
              busy={busy}
              failed={failed}
              selected={date}
              onSelect={pick}
              onRetry={load}
            />
          </Reveal>
        </div>
      </section>
      <section id="contato" className="contact-section section-wrap">
        <Reveal className="contact-copy">
          <p className="chapter-label">Vamos conversar</p>
          <h2>
            Agora,
            <br />
            <em>a sua história.</em>
          </h2>
          <p>
            Uma data, uma ideia ou uma visita. Deixe os primeiros detalhes; a
            equipe do Solar Opará retorna para conversar com você.
          </p>
          <div className="contact-location">
            <Icon name="pin" />
            <div>
              <strong>O Solar fica aqui</strong>
              <address>
                Rua Homero Nunes Macedo, 1208
                <br />
                Sagrada Família · Pirapora, MG
              </address>
              <a href={MAP_URL} target="_blank" rel="noopener noreferrer">
                Abrir no mapa <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            @solaroparaoficial <span aria-hidden="true">↗</span>
          </a>
        </Reveal>
        <div id="dados-evento" className="contact-panel">
          <div className="contact-panel-heading">
            <span className="chapter-label">Sua solicitação</span>
            <p>O que vamos celebrar?</p>
          </div>
          <ContactForm date={date} onDateChange={setDate} onDateTaken={load} />
        </div>
      </section>
    </>
  );
}

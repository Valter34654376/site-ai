import { useCallback, useEffect, useRef, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { ContactForm } from "./ContactForm";
import { Reveal } from "./Reveal";
import { Icon } from "./Icon";
import { fetchBusyDates } from "@/lib/booking";
import { INSTAGRAM_URL, MAP_URL } from "@/lib/site-content";

const steps = [
  ["Escolha a data", "Verifique os dias livres no calendário abaixo."],
  [
    "Envie os dados do evento",
    "Informe o tipo de celebração e a estimativa de convidados.",
  ],
  [
    "Confirmação com a equipe",
    "Retornamos para apresentar orçamento ou agendar sua visita.",
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
    document.getElementById("dados-evento")?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <section
        ref={section}
        id="datas"
        className="dates-section"
        aria-labelledby="dates-title"
      >
        <div className="section-wrap dates-grid">
          <Reveal className="dates-copy">
            <span className="eyebrow">Disponibilidade</span>
            <h2 id="dates-title">Consulte as datas disponíveis.</h2>
            <p>
              Selecione um dia disponível no calendário para preencher sua
              solicitação de orçamento ou visita.
            </p>
            <ol className="booking-steps">
              {steps.map(([title, text], index) => (
                <li key={title}>
                  <span className="step-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="booking-note">
              A consulta online inicia o atendimento. A reserva da data é
              confirmada após o alinhamento e formalização com a equipe.
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

      <section
        id="contato"
        className="contact-section"
        aria-labelledby="contact-title"
      >
        <div className="section-wrap contact-grid">
          <Reveal className="contact-copy">
            <span className="eyebrow">Contato e orçamento</span>
            <h2 id="contact-title">Conte como imagina o seu evento.</h2>
            <p>
              Preencha os dados abaixo com a data pretendida e o formato da
              celebração. A equipe do Solar Opará entrará em contato.
            </p>

            <div className="contact-location">
              <Icon name="pin" />
              <div>
                <strong>Solar Opará</strong>
                <address>
                  Rua Homero Nunes Macedo, 1208
                  <br />
                  Sagrada Família · Pirapora, MG
                </address>
                <a href={MAP_URL} target="_blank" rel="noopener noreferrer">
                  Abrir no Google Maps <span aria-hidden="true">↗</span>
                </a>
              </div>
            </div>

            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-link"
            >
              <span>@solaroparaoficial</span>
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>

          <div
            id="dados-evento"
            className={`contact-panel ${date ? "has-date" : ""}`}
          >
            <div className="contact-panel-heading">
              <span className="eyebrow">Formulário de solicitação</span>
              <p>Dados do evento e contato</p>
            </div>
            <ContactForm
              date={date}
              onDateChange={setDate}
              onDateTaken={load}
            />
          </div>
        </div>
      </section>
    </>
  );
}

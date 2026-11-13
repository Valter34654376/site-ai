import { useCallback, useEffect, useState } from "react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { ContactForm } from "./ContactForm";
import { Reveal } from "./Reveal";
import { fetchBusyDates } from "@/lib/booking";
import { INSTAGRAM_URL } from "@/lib/site-content";

const steps = ["Escolha uma data disponível", "Preencha seus dados", "A equipe confirma com você"];

export function BookingFlow() {
  const [busy, setBusy] = useState<Set<string> | null>(null);
  const [failed, setFailed] = useState(false);
  const [date, setDate] = useState("");
  const load = useCallback(() => {
    setFailed(false);
    fetchBusyDates().then(setBusy).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  function pick(iso: string) {
    setDate(iso);
    document.getElementById("dados-evento")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <section id="datas" className="scroll-mt-20 border-t border-border bg-secondary/40">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-32">
          <Reveal className="lg:col-span-5">
            <p className="eyebrow text-primary">Datas</p>
            <h2 className="mt-6 text-4xl leading-tight sm:text-5xl">Consulte sua data.</h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">Escolha uma data disponível e envie sua solicitação. A equipe confirma os detalhes antes de reservar.</p>
            <ol className="mt-10 space-y-6">
              {steps.map((s, i) => (
                <li key={s} className="flex items-baseline gap-5 border-b border-border pb-5">
                  <span className="font-display text-3xl text-primary">{i + 1}</span><span>{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal className="lg:col-span-7">
            <AvailabilityCalendar busy={busy} failed={failed} selected={date} onSelect={pick} />
          </Reveal>
        </div>
      </section>

      <section id="contato" className="mx-auto grid max-w-7xl scroll-mt-20 gap-16 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-36">
        <Reveal className="lg:col-span-4">
          <p className="eyebrow text-primary">Solicitação</p>
          <h2 className="mt-6 text-4xl leading-tight sm:text-5xl">Vamos conversar sobre a sua data.</h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">Conte um pouco sobre o seu evento. A equipe do Solar Opará retorna com as informações para orçamento ou visita.</p>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="eyebrow mt-10 inline-block border border-foreground px-8 py-4 transition-colors hover:bg-foreground hover:text-background">@solaroparaoficial</a>
        </Reveal>
        <div id="dados-evento" className="scroll-mt-24 lg:col-span-8">
          <ContactForm date={date} onDateChange={setDate} onDateTaken={load} />
        </div>
      </section>
    </>
  );
}
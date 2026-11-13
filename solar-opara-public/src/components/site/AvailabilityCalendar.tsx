import { useMemo, useState } from "react";
import { toISO } from "@/lib/booking";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEK = ["D","S","T","Q","Q","S","S"];
const SPAN = 18;

type Props = { busy: Set<string> | null; failed: boolean; selected: string; onSelect: (iso: string) => void };

export function AvailabilityCalendar({ busy, failed, selected, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const today = useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const view = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const first = view.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];

  return (
    <div className="border border-border bg-card p-5 sm:p-8">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOffset(offset - 1)} disabled={offset === 0} aria-label="Mês anterior" className="eyebrow px-3 py-2 disabled:opacity-25">←</button>
        <p className="font-display text-2xl sm:text-3xl" aria-live="polite">{MONTHS[view.getMonth()]} {view.getFullYear()}</p>
        <button type="button" onClick={() => setOffset(offset + 1)} disabled={offset >= SPAN - 1} aria-label="Próximo mês" className="eyebrow px-3 py-2 disabled:opacity-25">→</button>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center sm:gap-2">
        {WEEK.map((w, i) => <span key={i} className="eyebrow pb-2 text-muted-foreground">{w}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const iso = toISO(d);
          const past = d < today;
          const isBusy = !!busy?.has(iso);
          const unknown = !busy;
          const disabled = past || isBusy || unknown;
          const sel = iso === selected;
          const status = past ? "Indisponível" : unknown ? "" : isBusy ? "Ocupado" : "Disponível";
          return (
            <button key={i} type="button" disabled={disabled} onClick={() => onSelect(iso)}
              aria-label={`${d.getDate()} de ${MONTHS[d.getMonth()]}${status ? `, ${status}` : ""}`} aria-pressed={sel}
              className={`flex aspect-square flex-col items-center justify-center border text-sm transition-colors sm:text-base
                ${sel ? "border-primary bg-primary text-primary-foreground"
                  : past || unknown ? "border-transparent text-muted-foreground/40"
                  : isBusy ? "cursor-not-allowed border-transparent bg-muted text-muted-foreground line-through"
                  : "border-border hover:border-primary hover:bg-primary/10"}`}>
              <span>{d.getDate()}</span>
              {!past && !unknown && <span className="mt-0.5 hidden text-[0.6rem] uppercase tracking-wider opacity-70 sm:block">{isBusy ? "Ocupado" : "Disponível"}</span>}
            </button>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-2"><i className="h-3 w-3 border border-border" />Disponível</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 bg-muted" />Ocupado</span>
        <span className="flex items-center gap-2"><i className="h-3 w-3 bg-primary" />Selecionada</span>
      </div>
      {!busy && !failed && <p className="mt-4 text-sm text-muted-foreground">Carregando datas…</p>}
      {failed && <p role="status" className="mt-4 border-l-2 border-gold pl-3 text-sm">Não foi possível carregar as datas agora. Tente novamente em instantes ou fale com a equipe pelo Instagram.</p>}
    </div>
  );
}
import { useMemo, useState } from "react";
import { toISO } from "@/lib/booking";
const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEK=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const SPAN=18;
type Props={busy:Set<string>|null;failed:boolean;selected:string;onSelect:(iso:string)=>void;onRetry:()=>void};

export function AvailabilityCalendar({busy,failed,selected,onSelect,onRetry}:Props){
 const [offset,setOffset]=useState(0);
 const today=useMemo(()=>{
  const parts=new Intl.DateTimeFormat("en",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const values=Object.fromEntries(parts.map(part=>[part.type,part.value]));
  return new Date(Number(values.year),Number(values.month)-1,Number(values.day));
 },[]);
 const view=new Date(today.getFullYear(),today.getMonth()+offset,1);
 const first=view.getDay(),days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
 const cells:(Date|null)[]=[...Array(first).fill(null),...Array.from({length:days},(_,index)=>new Date(view.getFullYear(),view.getMonth(),index+1))];
 return <div className="availability-calendar" aria-label="Calendário de disponibilidade">
  <div className="calendar-caption"><span>Disponibilidade</span><span>{offset+1} / {SPAN}</span></div>
  <div className="calendar-heading">
   <button type="button" onClick={()=>setOffset(value=>value-1)} disabled={offset===0} aria-label="Mês anterior">←</button>
   <p aria-live="polite">{MONTHS[view.getMonth()]} {view.getFullYear()}</p>
   <button type="button" onClick={()=>setOffset(value=>value+1)} disabled={offset>=SPAN-1} aria-label="Próximo mês">→</button>
  </div>
  <div className="calendar-grid grid-cols-7">
   {WEEK.map(day=><span key={day} className="calendar-weekday">{day}</span>)}
   {cells.map((day,index)=>{
    if(!day)return <span key={index} />;
    const iso=toISO(day),past=day<today,isBusy=!!busy?.has(iso),unknown=!busy,disabled=past||isBusy||unknown,chosen=iso===selected;
    const status=past?"Indisponível":unknown?"":isBusy?"Ocupado":"Disponível";
    return <button key={iso} type="button" disabled={disabled} onClick={()=>onSelect(iso)} aria-label={`${day.getDate()} de ${MONTHS[day.getMonth()]}${status?`, ${status}`:""}`} aria-pressed={chosen} className={`calendar-day ${chosen?"is-selected":past||unknown?"is-unknown":isBusy?"is-busy":"is-available"}`}><span>{day.getDate()}</span>{!past&&!unknown&&<i aria-hidden="true" />}</button>;
   })}
  </div>
  <div className="calendar-legend"><span><i className="legend-free" />Disponível</span><span><i className="legend-busy" />Ocupado</span><span><i className="legend-selected" />Selecionada</span></div>
  <div className={`calendar-status ${selected ? "is-selected" : ""}`} aria-live="polite">{failed?<div role="status"><p>Não foi possível carregar as datas agora. Tente novamente em instantes ou fale com a equipe pelo Instagram.</p><button type="button" onClick={onRetry}>Tentar novamente <span aria-hidden="true">↻</span></button></div>:!busy?<p>Carregando datas…</p>:selected?<p><span aria-hidden="true">✓</span> <strong>Data selecionada.</strong> Continue preenchendo os dados do evento.</p>:<p>Selecione um dia disponível para continuar.</p>}</div>
 </div>;
}

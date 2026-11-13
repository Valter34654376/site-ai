import { useState, type FormEvent, type ReactNode } from "react";
import { contactSchema } from "@/lib/contact-schema";
import { eventTypes, INSTAGRAM_URL } from "@/lib/site-content";
import { formatBR, sendBookingRequest } from "@/lib/booking";

const field = "w-full border-0 border-b border-input bg-transparent px-0 py-3 text-base outline-none transition-colors focus:border-primary placeholder:text-muted-foreground/60";

type Props = { date: string; onDateChange: (iso: string) => void; onDateTaken: () => void };

export function ContactForm({ date, onDateChange, onDateTaken }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotice("");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = contactSchema.safeParse({ tipo: "", ...data, data: date });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSending(true);
    const v = r.data;
    const res = await sendBookingRequest({
      name: v.nome, phone: v.telefone, email: v.email, event_type: v.tipo, event_date: v.data,
      guest_count: v.convidados ? Number(v.convidados) : null, message: v.mensagem || null,
    }).catch(() => "error" as const);
    setSending(false);
    if (res === "ok") setSent(true);
    else if (res === "date_unavailable") { onDateTaken(); onDateChange(""); setNotice("Essa data acabou de ficar indisponível. Escolha outra."); }
    else if (res === "recent_request_exists") setNotice("Já recebemos uma solicitação sua há poucos minutos. Aguarde o contato da equipe.");
    else setNotice("Não foi possível enviar agora. Tente novamente em instantes ou fale com a equipe pelo Instagram.");
  }

  if (sent) {
    return (
      <div role="status" className="border border-border bg-card p-8 sm:p-12">
        <p className="eyebrow text-primary">Recebido</p>
        <h3 className="mt-4 text-3xl sm:text-4xl">Solicitação enviada.</h3>
        <p className="mt-5 leading-relaxed text-muted-foreground">A equipe do Solar Opará vai analisar sua data e entrar em contato.</p>
        <p className="mt-4 border-l-2 border-gold pl-4 text-sm">Lembre-se: o envio não reserva a data automaticamente. A reserva só é feita após a confirmação da equipe.</p>
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="eyebrow mt-8 inline-block border-b border-foreground pb-1">Acompanhe no Instagram</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field error={errors["data"]} label="Data desejada">
          <input name="data" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className={`${field} ${date ? "border-primary font-medium" : ""}`} />
        </Field>
        {date && <p className="mt-3 inline-block bg-primary/10 px-3 py-2 text-sm">Data selecionada: <strong>{formatBR(date)}</strong></p>}
      </div>
      <Field error={errors["nome"]} label="Nome"><input name="nome" autoComplete="name" className={field} /></Field>
      <Field error={errors["telefone"]} label="WhatsApp / telefone"><input name="telefone" type="tel" autoComplete="tel" placeholder="(38) 00000-0000" className={field} /></Field>
      <Field error={errors["email"]} label="E-mail"><input name="email" type="email" autoComplete="email" className={field} /></Field>
      <Field error={errors["tipo"]} label="Tipo de evento">
        <select name="tipo" defaultValue="" className={field}>
          <option value="" disabled>Selecione</option>
          {eventTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </Field>
      <Field error={errors["convidados"]} label="Convidados (aprox.)"><input name="convidados" inputMode="numeric" className={field} /></Field>
      <div className="sm:col-span-2">
        <Field error={errors["mensagem"]} label="Mensagem"><textarea name="mensagem" rows={4} className={`${field} resize-none`} /></Field>
      </div>
      <div className="flex flex-col gap-5 sm:col-span-2">
        <p className="text-sm text-muted-foreground">Enviar a solicitação não reserva a data. A equipe confirma os detalhes antes de reservar.</p>
        <button type="submit" disabled={sending} className="eyebrow self-start bg-primary px-10 py-4 text-primary-foreground transition-colors hover:bg-ink disabled:opacity-60">
          {sending ? "Enviando…" : "Enviar solicitação"}
        </button>
        {notice && <p role="alert" className="border-l-2 border-gold bg-card p-4 text-sm leading-relaxed">{notice}</p>}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-muted-foreground">{label}</span>
      {children}
      {error && <span role="alert" className="mt-1 block text-sm text-destructive">{error}</span>}
    </label>
  );
}
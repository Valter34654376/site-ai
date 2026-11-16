import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { contactSchema } from "@/lib/contact-schema";
import { eventTypes, INSTAGRAM_URL } from "@/lib/site-content";
import { formatBR, sendBookingRequest } from "@/lib/booking";

const field = "form-control";

type Props = {
  date: string;
  onDateChange: (iso: string) => void;
  onDateTaken: () => void;
};

export function ContactForm({ date, onDateChange, onDateTaken }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setNotice("");
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const r = contactSchema.safeParse({ tipo: "", ...data, data: date });
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => {
        errs[String(i.path[0])] = i.message;
      });
      setErrors(errs);
      const first = e.currentTarget.elements.namedItem(
        Object.keys(errs)[0] ?? "",
      );
      if (first instanceof HTMLElement) first.focus();
      return;
    }
    setErrors({});
    setSending(true);
    const v = r.data;
    const res = await sendBookingRequest({
      name: v.nome,
      phone: v.telefone,
      email: v.email,
      event_type: v.tipo,
      event_date: v.data,
      guest_count: v.convidados ? Number(v.convidados) : null,
      message: v.mensagem || null,
    }).catch(() => "error" as const);
    setSending(false);
    if (res === "ok") setSent(true);
    else if (res === "date_unavailable") {
      onDateTaken();
      onDateChange("");
      setNotice("Essa data acabou de ficar indisponível. Escolha outra.");
    } else if (res === "recent_request_exists")
      setNotice(
        "Já recebemos uma solicitação sua há poucos minutos. Aguarde o contato da equipe.",
      );
    else
      setNotice(
        "Não foi possível enviar agora. Tente novamente em instantes ou fale com a equipe pelo Instagram.",
      );
  }

  if (sent) {
    return (
      <div role="status" className="form-success">
        <p className="eyebrow">Recebido</p>
        <h3>Solicitação enviada.</h3>
        <p>
          A equipe do Solar Opará vai analisar sua data e entrar em contato.
        </p>
        <p className="form-success-note">
          Lembre-se: o envio não reserva a data automaticamente. A reserva só é
          feita após a confirmação da equipe.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link"
        >
          <span>Acompanhe no Instagram</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="contact-form">
      <div className="form-span-full">
        <Field error={errors["data"]} label="Data desejada">
          <input
            name="data"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={`${field} ${date ? "has-value" : ""}`}
          />
        </Field>
        {date && (
          <p className="selected-date-pill">
            Data selecionada: <strong>{formatBR(date)}</strong>
          </p>
        )}
      </div>

      <Field error={errors["nome"]} label="Nome completo">
        <input name="nome" autoComplete="name" className={field} />
      </Field>

      <Field error={errors["telefone"]} label="WhatsApp / telefone">
        <input
          name="telefone"
          type="tel"
          autoComplete="tel"
          placeholder="(38) 00000-0000"
          className={field}
        />
      </Field>

      <Field error={errors["email"]} label="E-mail">
        <input
          name="email"
          type="email"
          autoComplete="email"
          className={field}
        />
      </Field>

      <Field error={errors["tipo"]} label="Tipo de evento">
        <select name="tipo" defaultValue="" className={field}>
          <option value="" disabled>
            Selecione
          </option>
          {eventTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </Field>

      <Field error={errors["convidados"]} label="Convidados (aprox.)">
        <input name="convidados" inputMode="numeric" className={field} />
      </Field>

      <div className="form-span-full">
        <Field error={errors["mensagem"]} label="Mensagem ou observações">
          <textarea
            name="mensagem"
            rows={4}
            className={`${field} form-textarea`}
          />
        </Field>
      </div>

      <div className="form-actions form-span-full">
        <p className="form-privacy">
          Seus dados serão utilizados exclusivamente para responder a esta
          solicitação. O envio não reserva a data automaticamente.
        </p>
        <button
          type="submit"
          disabled={sending}
          className="btn-primary form-submit"
        >
          <span>{sending ? "Enviando…" : "Enviar solicitação"}</span>
        </button>
        {notice && (
          <p role="alert" className="form-notice">
            {notice}
          </p>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  const errorId = useId();
  const input = isValidElement<{
    "aria-invalid"?: boolean;
    "aria-describedby"?: string | undefined;
  }>(children)
    ? cloneElement(children, {
        "aria-invalid": !!error,
        "aria-describedby": error ? errorId : undefined,
      })
    : children;
  return (
    <label className="form-field">
      <span className="form-label">{label}</span>
      {input}
      {error && (
        <span id={errorId} role="alert" className="form-error">
          {error}
        </span>
      )}
    </label>
  );
}

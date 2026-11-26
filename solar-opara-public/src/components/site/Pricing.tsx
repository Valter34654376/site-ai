import { Icon } from "./Icon";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const cleaningFee = 650;
const rentalPrices = [
  { label: "À vista", amount: 7500, className: "pricing-option" },
  {
    label: "Parcelado",
    amount: 8600,
    className: "pricing-option pricing-option-installments",
  },
];

export function Pricing() {
  return (
    <section id="valores" className="pricing-section" aria-labelledby="pricing-title">
      <div className="section-wrap">
        <header className="pricing-heading">
          <h2 id="pricing-title">Valores da locação</h2>
          <p>Locação do espaço para 8 horas de evento.</p>
        </header>

        <div className="pricing-options">
          {rentalPrices.map(({ label, amount, className }) => (
            <article key={label} className={className}>
              <h3>{label}</h3>
              <p className="pricing-amount">{currency.format(amount)}</p>
              <p className="pricing-fee">+ {currency.format(cleaningFee)} de taxa de limpeza</p>
              <p className="pricing-total">
                <span>Total com limpeza</span>
                <strong>{currency.format(amount + cleaningFee)}</strong>
              </p>
            </article>
          ))}
        </div>

        <div className="pricing-terms">
          <h3>Condições do parcelamento</h3>
          <dl>
            <div>
              <dt>Cartão de crédito</dt>
              <dd>Em até 12 vezes, conforme a operadora do cartão.</dd>
            </div>
            <div>
              <dt>Boleto bancário</dt>
              <dd>A última parcela deve ser paga até 30 dias antes da data do evento.</dd>
            </div>
          </dl>
        </div>

        <div className="pricing-actions">
          <a href="#datas" className="btn-primary">
            <span>Consultar datas</span>
            <Icon name="arrow" />
          </a>
          <a
            href="https://wa.me/5538992222224"
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tirar dúvidas no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

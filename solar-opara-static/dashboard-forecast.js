const longMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "short" });
const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
});
const monthsPerChart = 18;
let selectedMonth = null;

export function buildForecast({ today, calendar, collections, payments, expenses, cash, contracts, parcels }) {
  if (!calendar) return { state: "unavailable" };
  const lastDay = calendar.at(-1)?.date;
  if (!lastDay) return { state: "empty" };

  const date = new Date(`${today.slice(0, 7)}-01T00:00:00Z`);
  const endMonth = lastDay.slice(0, 7);
  const months = [];
  for (let key = date.toISOString().slice(0, 7); ; key = date.toISOString().slice(0, 7)) {
    months.push({ key, date: new Date(date), received: 0, spent: 0, closing: 0, days: [], contractedDays: 0 });
    if (key === endMonth) break;
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  const byMonth = new Map(months.map(month => [month.key, month]));
  const byDay = new Map();
  for (const event of calendar) {
    let day = byDay.get(event.date);
    if (!day) {
      day = { date: event.date, events: [], contracted: false };
      byDay.set(day.date, day);
      byMonth.get(day.date.slice(0, 7)).days.push(day);
    }
    day.events.push(event);
    day.contracted ||= event.source === "Contrato";
  }
  let agendaOnlyDays = 0;
  for (const month of months) {
    month.contractedDays = month.days.filter(day => day.contracted).length;
    agendaOnlyDays += month.days.length - month.contractedDays;
  }

  const finance = cash && collections ? {
    opening: cash.received - cash.spent, received: 0, spent: 0, overdue: 0, undated: 0, afterEnd: 0,
  } : null;
  if (finance) {
    const eligible = id => ["active", "completed"].includes(contracts.get(id)?.status);
    const addReceipt = (date, cents) => {
      if (!date) finance.undated += cents;
      else if (date < today) finance.overdue += cents;
      else if (date > lastDay) finance.afterEnd += cents;
      else byMonth.get(date.slice(0, 7)).received += cents;
    };
    for (const charge of collections.open) {
      if (eligible(charge.contractId)) addReceipt(charge.date, charge.cents);
    }
    for (const payment of payments) {
      const parcel = parcels.get(payment.receivableId);
      if (payment.date > today && parcel?.status !== "cancelled" && eligible(parcel?.contract_id)) {
        addReceipt(payment.date, payment.cents);
      }
    }
    for (const expense of expenses) {
      if (expense.date > today && expense.date <= lastDay) byMonth.get(expense.date.slice(0, 7)).spent += expense.cents;
    }
    let closing = finance.opening;
    for (const month of months) {
      finance.received += month.received;
      finance.spent += month.spent;
      closing += month.received - month.spent;
      month.closing = closing;
    }
    finance.recovery = finance.overdue + finance.undated;
    finance.totalReceipts = finance.received + finance.recovery;
    finance.scheduledClosing = closing;
    finance.result = finance.totalReceipts - finance.spent;
    finance.closing = closing + finance.recovery;
  }

  return { state: "ready", today, lastDay, agendaOnlyDays, months, finance };
}

function windowFor(forecast, key) {
  const found = forecast.months.findIndex(month => month.key === key);
  const index = found >= 0 ? found : forecast.months.findIndex(month => month.days.length);
  const start = Math.floor(index / monthsPerChart) * monthsPerChart;
  return { index, start, current: forecast.months[index], months: forecast.months.slice(start, start + monthsPerChart) };
}

function scale(values, monetary) {
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const range = Math.max(monetary ? 100 : 1, high - low);
  const unit = 10 ** Math.floor(Math.log10(range / 4));
  const rounded = [1, 2, 2.5, 5, 10].map(value => value * unit).find(value => value * 4 >= range);
  const step = monetary ? rounded : Math.max(1, Math.ceil(rounded));
  const min = Math.floor(low / step) * step;
  const max = Math.max(low === high ? range : min + step, Math.ceil(high / step) * step);
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => max - index * step);
  return { ticks, min, max };
}

function chart(type, visible, format) {
  const { esc, money } = format;
  const isAgenda = type === "agenda";
  const isLine = type === "closing";
  const { months, current, recoveryClosing } = visible;
  const values = months.flatMap(month => {
    if (isAgenda) return [month.days.length];
    if (isLine) return [month.closing];
    return [month.received, month.spent];
  });
  if (isLine) {
    values.push(visible.opening);
    if (recoveryClosing !== null) values.push(recoveryClosing);
  }
  const { ticks, min, max } = scale(values, !isAgenda);
  const axisLabel = cents => isAgenda ? cents : Math.abs(cents) >= 100000 ? compactMoney.format(cents / 100) : money(cents / 100);
  const group = isAgenda ? "Ver datas por mês" : isLine ? "Ver saldo por mês" : "Ver previsão por mês";
  const style = value => `--bar:${100 * value / max}%`;

  return `<div class="dash-chart-scroll dash-forecast-scroll">
    <div class="dash-chart dash-forecast-chart" style="--months:${months.length}">
      <div class="dash-axis" aria-hidden="true">${ticks.map(value => `<span>${axisLabel(value)}</span>`).join("")}</div>
      <div class="dash-plot">
        <div class="dash-gridlines" aria-hidden="true">${ticks.map(value => `<i${value === 0 ? ' class="dash-zero-line"' : ""}></i>`).join("")}</div>
        ${isLine ? `<canvas class="dash-forecast-line" data-balance-line data-min="${min}" data-max="${max}" aria-hidden="true"></canvas>` : ""}
        <div class="dash-months" role="group" aria-label="${group}">${months.map(month => {
          const label = `${shortMonth.format(month.date).replace(".", "")}/${month.key.slice(2, 4)}`;
          const otherDays = month.days.length - month.contractedDays;
          const detail = isAgenda ? `${month.contractedDays} com contrato, ${otherDays} somente na agenda`
            : isLine ? `saldo ${money(month.closing / 100)}`
            : `entradas ${money(month.received / 100)}, despesas ${money(month.spent / 100)}`;
          const recovery = isLine && recoveryClosing !== null && month === months.at(-1)
            ? `, saldo com recuperação ${money(recoveryClosing / 100)}` : "";
          let bars = "";
          if (isAgenda) bars = `<span class="dash-forecast-stack"><span class="dash-in" style="${style(month.contractedDays)}"></span><span class="dash-neutral" style="${style(otherDays)}"></span></span>`;
          else if (!isLine) bars = `<span class="dash-in" style="${style(month.received)}"></span><span class="dash-out" style="${style(month.spent)}"></span>`;
          return `<button type="button" class="dash-month" data-forecast-month="${month.key}"
            title="${esc(`${longMonth.format(month.date)}, ${detail}${recovery}`)}"
            aria-pressed="${month.key === current.key}" aria-label="${esc(`${label}, ${longMonth.format(month.date)}, ${detail}${recovery}`)}">
              <span class="dash-bars" aria-hidden="true">${bars}</span>
              <span class="dash-month-label" aria-hidden="true">${label}</span>
            </button>`;
        }).join("")}</div>
      </div>
    </div>
  </div>`;
}

function visibleWindow(forecast, key) {
  const visible = windowFor(forecast, key);
  const finance = forecast.finance;
  const includesEnd = visible.months.at(-1) === forecast.months.at(-1);
  return { ...visible, opening: forecast.months[visible.start - 1]?.closing ?? finance?.opening ?? 0,
    recoveryClosing: includesEnd && finance?.recovery ? finance.closing : null };
}

function monthDetail(month, format, forecast) {
  const { dateBR, esc, money } = format;
  const otherDays = month.days.length - month.contractedDays;
  const finalMonth = month.key === forecast.lastDay.slice(0, 7);
  return `<h3>${longMonth.format(month.date)}</h3>
    ${forecast.finance ? `<dl class="dash-forecast-month-sums">
      <div><dt>Entradas</dt><dd>${money(month.received / 100)}</dd></div>
      <div><dt>Despesas</dt><dd>${money(month.spent / 100)}</dd></div>
      <div><dt>Resultado</dt><dd>${money((month.received - month.spent) / 100)}</dd></div>
      <div><dt>${finalMonth ? `Saldo pelo calendário em ${dateBR(forecast.lastDay)}` : "Saldo ao fim do mês"}</dt><dd>${money(month.closing / 100)}</dd></div>
      ${finalMonth && forecast.finance.recovery ? `<div><dt>Saldo com recuperação</dt><dd>${money(forecast.finance.closing / 100)}</dd></div>` : ""}
    </dl>` : ""}
    <p class="dash-forecast-days">${month.contractedDays} ${month.contractedDays === 1 ? "dia" : "dias"} com contrato · ${otherDays} somente na agenda</p>
    ${month.days.length ? `<ul class="dash-forecast-event-list" aria-label="Datas agendadas no mês">${month.days.map(day => `
      <li><time datetime="${esc(day.date)}">${dateBR(day.date)}</time><ul>${day.events.map(event => `
        <li><span>${esc(event.title)}</span><span class="dash-tag">${event.hasParcels === false ? "Contrato sem parcelas" : event.source}</span></li>`).join("")}</ul></li>`).join("")}</ul>`
      : '<p class="dash-empty">Nenhum compromisso agendado neste mês.</p>'}`;
}

function summary(finance, money) {
  const amount = cents => money(cents / 100);
  return `<dl class="dash-forecast-totals">
    <div class="dash-forecast-result${finance.result < 0 ? " dash-forecast-loss" : ""}"><dt>${finance.recovery ? "Resultado com recuperação" : "Resultado previsto"}</dt><dd>${amount(finance.result)}</dd></div>
    <div><dt>${finance.recovery ? "Recebimentos com recuperação" : "Recebimentos previstos"}</dt><dd>${amount(finance.totalReceipts)}</dd></div>
    <div><dt>Despesas lançadas no período</dt><dd>${amount(finance.spent)}</dd></div>
    <div><dt>${finance.recovery ? "Saldo com recuperação" : "Saldo na última data"}</dt><dd${finance.closing < 0 ? ' class="dash-red"' : ""}>${amount(finance.closing)}<small>Inclui o saldo atual de ${amount(finance.opening)}</small></dd></div>
  </dl>`;
}

function receiptBreakdown(finance, money) {
  if (!finance.recovery) return "";
  const amount = cents => money(cents / 100);
  return `<div class="dash-forecast-context">
    <span>Programados por vencimento <b>${amount(finance.received)}</b></span>
    ${finance.overdue ? `<span>Parcelas vencidas a recuperar <b>${amount(finance.overdue)}</b></span>` : ""}
    ${finance.undated ? `<span>Parcelas sem vencimento <b>${amount(finance.undated)}</b></span>` : ""}
  </div>`;
}

function forecastCoverage(forecast, money) {
  const { finance, agendaOnlyDays } = forecast;
  const reviewMonth = forecast.months.find(month => month.days.length > month.contractedDays);
  return `${finance?.afterEnd ? `<p class="dash-chart-note">Recebimentos programados após a última data <b>${money(finance.afterEnd / 100)}</b></p>` : ""}
    ${reviewMonth ? `<div class="dash-forecast-context dash-forecast-coverage">
      <p><strong>${agendaOnlyDays} ${agendaOnlyDays === 1 ? "data sem contrato" : "datas sem contrato"} no financeiro.</strong> Confira os valores das reservas na agenda.</p>
      <button type="button" class="dash-link" data-route="agenda" data-agenda-month="${reviewMonth.key}">Revisar datas <span aria-hidden="true">→</span></button>
    </div>` : ""}`;
}

export function renderForecast(forecast, format) {
  const { dateBR, money, esc } = format;
  if (forecast.state !== "ready") {
    return `<section class="dash-panel dash-forecast" aria-labelledby="dash-forecast-title">
      <div class="dash-panel-head"><h2 id="dash-forecast-title">Previsão de resultado</h2></div>
      <p class="dash-empty">${forecast.state === "empty" ? "A agenda ainda não tem datas futuras para a previsão." : "A previsão estará disponível quando o calendário completo carregar."}</p>
    </section>`;
  }

  const { finance } = forecast;
  const visible = visibleWindow(forecast, selectedMonth);
  const { current } = visible;
  return `<div class="dash-forecast" data-forecast>
    <section class="dash-panel" aria-labelledby="dash-forecast-title">
      <div class="dash-panel-head dash-forecast-head">
        <div><h2 id="dash-forecast-title">Previsão de resultado</h2>
        <p>De <time datetime="${forecast.today}">${dateBR(forecast.today)}</time> até a última data agendada, <strong><time datetime="${forecast.lastDay}">${dateBR(forecast.lastDay)}</time></strong></p></div>
        <label class="dash-forecast-select">Mês em destaque<select data-forecast-select>${forecast.months.map(month =>
          `<option value="${month.key}"${month === current ? " selected" : ""}>${esc(longMonth.format(month.date))}</option>`).join("")}</select></label>
      </div>
      ${finance ? `${summary(finance, money)}${receiptBreakdown(finance, money)}<p class="dash-chart-note dash-forecast-subtitle">${finance.recovery
        ? "O resultado considera o recebimento das pendências até a última data agendada. Os valores mensais seguem as datas cadastradas."
        : "Resultado estimado pelos recebimentos programados e pelas despesas lançadas."}${finance.spent ? "" : " Nenhuma despesa futura lançada neste período."}</p>
        <div class="dash-forecast-graphs">
          <section class="dash-forecast-card" aria-labelledby="dash-forecast-flow-title"><h3 id="dash-forecast-flow-title">Recebimentos e despesas previstos</h3>
            <p class="dash-forecast-legend"><span><i class="dash-dot dash-in"></i> Recebimentos programados</span><span><i class="dash-dot dash-out"></i> Despesas</span></p>
            <div data-forecast-chart="cash">${chart("cash", visible, format)}</div>
          </section>
          <section class="dash-forecast-card" aria-labelledby="dash-forecast-balance-title"><h3 id="dash-forecast-balance-title">Saldo acumulado previsto</h3>
            <p class="dash-forecast-legend"><span><i class="dash-dot dash-in"></i> Saldo pelo calendário</span>${finance.recovery ? '<span><i class="dash-dot dash-forecast-recovery"></i> Com recuperação na última data</span>' : ""}</p>
            <div data-forecast-chart="closing">${chart("closing", visible, format)}</div>
            ${finance.recovery ? `<p class="dash-chart-note">Saldo pelo calendário na última data <b>${money(finance.scheduledClosing / 100)}</b></p>` : ""}
          </section>
        </div>` : '<p class="dash-empty">Dados financeiros incompletos. Atualize para calcular a previsão.</p>'}
      ${forecastCoverage(forecast, money)}
    </section>
    <div class="dash-columns dash-forecast-agenda">
      <section class="dash-panel" aria-labelledby="dash-forecast-agenda-title">
        <div class="dash-panel-head"><div><h2 id="dash-forecast-agenda-title">Agenda por mês</h2><p>Dias com contratos, reservas aprovadas ou compromissos importados</p></div></div>
        <p class="dash-forecast-legend"><span><i class="dash-dot dash-in"></i> Com contrato</span><span><i class="dash-dot dash-neutral"></i> Somente na agenda</span></p>
        <div data-forecast-chart="agenda">${chart("agenda", visible, format)}</div>
      </section>
      <section class="dash-panel" aria-labelledby="dash-forecast-detail-title">
        <div class="dash-panel-head"><h2 id="dash-forecast-detail-title">Detalhes do mês</h2>
          <button type="button" class="dash-link" data-route="agenda" data-forecast-agenda data-agenda-month="${current.key}">Ver mês na agenda <span aria-hidden="true">→</span></button>
        </div>
        <div data-forecast-detail aria-live="polite">${monthDetail(current, format, forecast)}</div>
      </section>
    </div>
  </div>`;
}

function drawBalance(canvas, visible) {
  if (!canvas) return;
  const { months, current, opening, recoveryClosing } = visible;
  const width = Math.max(720, 96 * months.length);
  const height = 300;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const min = Number(canvas.dataset.min);
  const max = Number(canvas.dataset.max);
  const plotY = value => (max - value) / (max - min) * (height - 10) + 5;
  const points = months.map((month, index) => [width * (index + .5) / months.length, plotY(month.closing)]);
  ctx.strokeStyle = "#25664a";
  ctx.lineWidth = 4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(0, plotY(opening));
  points.forEach(([x, y]) => ctx.lineTo(x, y));
  ctx.stroke();
  points.forEach(([x, y], index) => {
    ctx.beginPath();
    ctx.arc(x, y, months[index] === current ? 8 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = months[index] === current ? "#91591d" : "#25664a";
    ctx.fill();
  });
  if (recoveryClosing !== null) {
    const [x, datedY] = points.at(-1);
    const recoveredY = plotY(recoveryClosing);
    ctx.strokeStyle = "#935921";
    ctx.setLineDash([9, 7]);
    ctx.beginPath();
    ctx.moveTo(x, datedY);
    ctx.lineTo(x, recoveredY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, recoveredY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#935921";
    ctx.fill();
  }
}

export function bindForecast(root, forecast, format) {
  const section = root.querySelector("[data-forecast]");
  if (!section) return;
  const control = section.querySelector("[data-forecast-select]");
  const containers = [...section.querySelectorAll("[data-forecast-chart]")];
  const detail = section.querySelector("[data-forecast-detail]");
  let visible = visibleWindow(forecast, selectedMonth);
  const move = key => {
    const next = visibleWindow(forecast, key);
    if (next.start !== visible.start) {
      for (const container of containers) container.innerHTML = chart(container.dataset.forecastChart, next, format);
    }
    visible = next;
    selectedMonth = next.current.key;
    control.value = selectedMonth;
    section.querySelector("[data-forecast-agenda]").dataset.agendaMonth = selectedMonth;
    detail.innerHTML = monthDetail(next.current, format, forecast);
    section.querySelectorAll("[data-forecast-month]").forEach(button =>
      button.setAttribute("aria-pressed", String(button.dataset.forecastMonth === selectedMonth)));
    drawBalance(section.querySelector("[data-balance-line]"), visible);
    for (const container of containers) {
      const scroll = container.querySelector(".dash-chart-scroll");
      const button = scroll.querySelector('[aria-pressed="true"]');
      if (!button || scroll.scrollWidth <= scroll.clientWidth) continue;
      const bounds = scroll.getBoundingClientRect();
      const match = button.getBoundingClientRect();
      scroll.scrollLeft += match.left + match.width / 2 - (bounds.left + bounds.width / 2);
    }
  };
  control.onchange = () => move(control.value);
  section.addEventListener("click", event => {
    const button = event.target.closest("[data-forecast-month]");
    if (button) move(button.dataset.forecastMonth);
  });
  move(visible.current.key);
}

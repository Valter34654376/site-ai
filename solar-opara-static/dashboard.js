const timeZone = "America/Sao_Paulo";
const localDay = new Intl.DateTimeFormat("sv-SE", { timeZone, dateStyle: "short" });
const fullDay = new Intl.DateTimeFormat("pt-BR", { timeZone, dateStyle: "full" });
const monthName = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long", year: "numeric" });
const shortMonth = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "short" });
const clock = new Intl.DateTimeFormat("pt-BR", { timeZone, hour: "2-digit", minute: "2-digit" });
const compactMoney = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1,
});
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });
const dayMs = 86400000;
const view = { months: 6, month: null, charges: "late" };

const toCents = value => Math.round(Number(value) * 100);
const sumValues = records => records.reduce((sum, record) => sum + record.cents, 0);
const isoDay = value => value.toISOString().slice(0, 10);
const addDays = (day, days) => isoDay(new Date(Date.parse(day) + days * dayMs));
const byDate = (a, b) => a.date.localeCompare(b.date);
const monthDate = key => new Date(`${key}-01T12:00:00Z`);

async function readRows(client, table, columns, filter = query => query) {
  const rows = [];
  let total = null;
  while (total === null || rows.length < total) {
    const options = rows.length ? {} : { count: "exact" };
    let query = filter(client.from(table).select(columns, options)).order("id").limit(500);
    if (rows.length) query = query.gt("id", rows.at(-1).id);
    const { data, error, count } = await query;
    if (error) throw error;
    if (!data?.length) break;
    if (!rows.length) total = count ?? null;
    rows.push(...data);
  }
  return rows;
}

export async function loadDashboard(client, now = new Date()) {
  const today = localDay.format(now);
  const horizon = addDays(today, 30);
  const queries = [
    ["contracts", "Contratos", "so_contracts", "id,status,event_name,event_date,start_at,so_clients(name)"],
    ["receivables", "Cobranças", "so_receivables", "id,contract_id,status,description,due_date,amount"],
    ["payments", "Pagamentos", "so_payments", "id,receivable_id,amount,method,paid_at",
      query => query.eq("reversed", false)],
    ["expenses", "Despesas", "so_expenses", "id,description,category,amount,expense_date"],
    ["legacy", "Agenda importada", "so_legacy_events", "id,event_date,description",
      query => query.gte("event_date", today).lt("event_date", horizon)],
    ["requests", "Solicitações", "so_booking_requests", "id,name,event_type,event_date,status,created_at",
      query => query.in("status", ["new", "approved"])],
  ];
  const responses = await Promise.allSettled(queries.map(([, , ...query]) => readRows(client, ...query)));
  const unavailable = [];
  const records = Object.fromEntries(responses.map((result, index) => {
    const [key, label] = queries[index];
    if (result.status === "fulfilled") return [key, result.value];
    unavailable.push(label);
    return [key, null];
  }));

  const contracts = new Map(records.contracts?.map(item => [item.id, item]));
  const parcels = new Map(records.receivables?.map(item => [item.id, item]));
  const payments = records.payments?.map(item => {
    const parcel = parcels.get(item.receivable_id);
    const contract = contracts.get(parcel?.contract_id);
    return {
      receivableId: item.receivable_id,
      cents: toCents(item.amount),
      date: localDay.format(new Date(item.paid_at)),
      timestamp: Date.parse(item.paid_at),
      title: contract?.so_clients?.name || contract?.event_name || "Recebimento",
      subtitle: ["Recebimento", item.method].filter(Boolean).join(" · "),
      type: "payment",
    };
  });
  const expenses = records.expenses?.map(item => ({
    cents: toCents(item.amount),
    date: item.expense_date,
    timestamp: Date.parse(item.expense_date),
    title: item.description || "Despesa",
    subtitle: ["Despesa", item.category].filter(Boolean).join(" · "),
    type: "expense",
  }));
  const activity = [...(payments || []), ...(expenses || [])].sort((a, b) => byDate(b, a) || b.timestamp - a.timestamp);
  const cash = payments && expenses ? { received: sumValues(payments), spent: sumValues(expenses) } : null;

  const collections = records.receivables && records.contracts && payments
    ? summarizeCollections(records.receivables, contracts, payments, today)
    : null;
  const scheduled = records.contracts?.filter(item =>
    item.status === "active" && item.event_date >= today && item.event_date < horizon);
  const events = [
    ...(scheduled || []).map(item => ({
      date: item.event_date,
      title: item.event_name || "Evento contratado",
      subtitle: [item.start_at && clock.format(new Date(item.start_at)), item.so_clients?.name].filter(Boolean).join(" · "),
      source: "Contrato",
    })),
    ...(records.legacy || []).map(item => ({
      date: item.event_date, title: item.description || "Compromisso", source: "Planilha",
    })),
  ].sort(byDate);

  return {
    today,
    now,
    refreshed: new Date(),
    unavailable,
    activity,
    activityAvailable: !!(payments || expenses),
    cash,
    collections,
    events,
    agendaAvailable: !!(records.contracts || records.legacy),
    scheduledCount: scheduled?.length ?? null,
    contractCount: records.contracts?.length ?? null,
    requests: records.requests,
  };
}

function summarizeCollections(receivables, contracts, payments, today) {
  const paidByParcel = new Map();
  for (const item of payments) {
    const id = item.receivableId;
    paidByParcel.set(id, (paidByParcel.get(id) || 0) + item.cents);
  }
  const result = { total: 0, received: 0, lateCents: 0, onTimeCents: 0, undatedCents: 0, late: [], soon: [], openCount: 0 };
  const nextWeek = addDays(today, 7);
  for (const item of receivables) {
    const contract = contracts.get(item.contract_id);
    if (item.status === "cancelled" || contract?.status === "cancelled") continue;
    const cents = toCents(item.amount);
    const paid = Math.min(cents, paidByParcel.get(item.id) || 0);
    result.total += cents;
    result.received += paid;
    if (paid >= cents) continue;

    const balance = cents - paid;
    const date = item.due_date;
    const charge = {
      id: item.id,
      date,
      cents: balance,
      title: contract?.so_clients?.name || contract?.event_name || "Cobrança",
      subtitle: item.description || contract?.event_name || "Parcela",
    };
    result.openCount++;
    if (!date) {
      result.undatedCents += balance;
    } else if (date < today) {
      result.lateCents += balance;
      result.late.push(charge);
    } else {
      result.onTimeCents += balance;
      if (date < nextWeek) result.soon.push(charge);
    }
  }
  result.late.sort(byDate);
  result.soon.sort(byDate);
  return result;
}

function metric({ label, value, caption, route, tone = "" }) {
  const body = `<span class="dash-metric-label">${label}</span>
    <strong>${value}</strong><span class="dash-metric-caption">${caption}</span>`;
  return route
    ? `<button type="button" class="dash-metric ${tone}" data-route="${route}">${body}</button>`
    : `<div class="dash-metric ${tone}">${body}</div>`;
}

const stateMessage = message => `<p class="dash-empty">${message}</p>`;
const link = (route, label) => `<button type="button" class="dash-link" data-route="${route}">${label} <span aria-hidden="true">→</span></button>`;

function cashMonths(model) {
  const end = monthDate(model.today.slice(0, 7));
  const months = Array.from({ length: view.months }, (_, index) => {
    const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + index - view.months + 1, 1));
    return { key: isoDay(date).slice(0, 7), date, received: 0, spent: 0 };
  });
  const byMonth = new Map(months.map(month => [month.key, month]));
  for (const item of model.activity) {
    const month = byMonth.get(item.date.slice(0, 7));
    if (month) month[item.type === "payment" ? "received" : "spent"] += item.cents;
  }
  return months;
}

function cashDetail(month, money) {
  return `<strong>${monthName.format(month.date)}</strong>
    <span>Recebido <b>${money(month.received / 100)}</b></span>
    <span>Despesas <b>${money(month.spent / 100)}</b></span>
    <span>Resultado <b>${money((month.received - month.spent) / 100)}</b></span>`;
}

function cashChart(months, { esc, money }) {
  const received = months.reduce((total, item) => total + item.received, 0);
  const spent = months.reduce((total, item) => total + item.spent, 0);
  const selected = months.find(month => month.key === view.month) || months.at(-1);
  const peak = Math.max(100, ...months.flatMap(item => [item.received, item.spent]));
  const unit = 10 ** Math.floor(Math.log10(peak / 4));
  const step = [1, 2, 2.5, 5, 10].map(value => value * unit).find(value => value * 4 >= peak);
  const max = step * 4;

  return `<dl class="dash-cash-totals">
    <div><dt><span class="dash-dot dash-in"></span> Recebido no período</dt><dd>${money(received / 100)}</dd></div>
    <div><dt><span class="dash-dot dash-out"></span> Despesas no período</dt><dd>${money(spent / 100)}</dd></div>
    <div><dt>Resultado do período</dt><dd class="${received < spent ? "dash-red" : ""}">${money((received - spent) / 100)}</dd></div>
  </dl>
  ${received || spent ? "" : '<p class="dash-chart-note">Sem movimentações no período.</p>'}
  <div class="dash-chart-scroll">
    <div class="dash-chart" style="--months:${months.length}">
      <div class="dash-axis" aria-hidden="true">${[4, 3, 2, 1, 0].map(tick => {
        const value = tick * step / 100;
        return `<span>${value >= 1000 ? compactMoney.format(value) : money(value)}</span>`;
      }).join("")}</div>
      <div class="dash-plot">
        <div class="dash-gridlines" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="dash-months" role="group" aria-label="Detalhar fluxo de caixa por mês">${months.map(item => {
          const label = shortMonth.format(item.date).replace(".", "");
          return `
          <button type="button" class="dash-month" data-cash-month="${item.key}" aria-pressed="${item.key === selected.key}"
            aria-label="${esc(`${label} de ${item.date.getUTCFullYear()}, recebido ${money(item.received / 100)}, despesas ${money(item.spent / 100)}`)}">
            <span class="dash-bars" aria-hidden="true">
              <span class="dash-in" style="--bar:${100 * item.received / max}%"></span>
              <span class="dash-out" style="--bar:${100 * item.spent / max}%"></span>
            </span>
            <span class="dash-month-label" aria-hidden="true">${label}</span>
          </button>`;
        }).join("")}</div>
      </div>
    </div>
  </div>
  <div class="dash-chart-detail" data-cash-detail aria-live="polite">${cashDetail(selected, money)}</div>`;
}

function collectionStatus(collections, money) {
  if (!collections) return stateMessage("Dados das cobranças indisponíveis.");
  if (!collections.total) return stateMessage("Nenhuma parcela vigente com valor lançado.");
  const parts = [
    ["Recebido", collections.received, "dash-in"],
    ["Em atraso", collections.lateCents, "dash-late"],
    ["A vencer", collections.onTimeCents, "dash-out"],
  ];
  if (collections.undatedCents) parts.push(["Sem vencimento", collections.undatedCents, "dash-neutral"]);
  return `<p class="dash-ratio"><strong>${percent.format(collections.received / collections.total)}</strong>
    <span>recebido de <b>${money(collections.total / 100)}</b> em parcelas vigentes</span></p>
    <div class="dash-segments" aria-hidden="true">${parts.map(([, amount, tone]) =>
      amount ? `<span class="${tone}" style="flex-grow:${amount}"></span>` : "").join("")}</div>
    <dl class="dash-status-legend">${parts.map(([label, amount, tone]) =>
      `<div><dt><span class="dash-dot ${tone}"></span>${label}</dt><dd>${money(amount / 100)}</dd></div>`).join("")}</dl>`;
}

function chargeList(model, { canWrite, esc, money, dateBR }) {
  const late = view.charges === "late";
  const items = model.collections[view.charges];
  if (!items.length) return stateMessage(late ? "Nenhuma parcela em atraso." : "Nenhuma parcela a vencer nos próximos 7 dias.");
  return `<ul class="dash-list">${items.slice(0, 5).map(item => {
    const days = (Date.parse(model.today) - Date.parse(item.date)) / dayMs;
    const deadline = days === 0 ? "Vence hoje" : dateBR(item.date);
    const action = canWrite
      ? `<button type="button" class="dash-action" data-dashboard-charge="${esc(item.id)}"
          aria-label="Confirmar pagamento de ${esc(item.title)}, vencimento ${dateBR(item.date)}">Confirmar</button>`
      : "";
    return `<li class="dash-charge">
      <div class="dash-row-text"><b>${esc(item.title)}</b><small>${esc(item.subtitle)}</small></div>
      <div class="dash-row-values"><b>${money(item.cents / 100)}</b>
        <time class="${late ? "dash-red" : ""}" datetime="${item.date}">${deadline}${late ? ` · ${days} d em atraso` : ""}</time></div>${action}
    </li>`;
  }).join("")}</ul>${items.length > 5 ? `<p class="dash-chart-note">Mostrando 5 de ${items.length} parcelas.</p>` : ""}`;
}

function eventList(model, { esc, dateBR }) {
  if (!model.agendaAvailable) return stateMessage("Agenda indisponível.");
  if (!model.events.length) return stateMessage("Nenhum evento ou compromisso nos próximos 30 dias.");
  return `<ul class="dash-list">${model.events.slice(0, 5).map(item => `
    <li class="dash-event">
      <time class="dash-date" datetime="${item.date}" aria-label="${dateBR(item.date)}">
        <b>${Number(item.date.slice(8))}</b><small>${shortMonth.format(monthDate(item.date.slice(0, 7))).replace(".", "")}</small>
      </time>
      <div class="dash-row-text"><b>${esc(item.title)}</b>${item.subtitle ? `<small>${esc(item.subtitle)}</small>` : ""}</div>
      <span class="dash-tag">${item.source}</span>
    </li>`).join("")}</ul>
    ${model.events.length > 5 ? `<p class="dash-chart-note">Mostrando 5 de ${model.events.length} compromissos.</p>` : ""}`;
}

function recentActivity(model, { esc, money, dateBR }) {
  if (!model.activityAvailable) return stateMessage("Dados das movimentações indisponíveis.");
  if (!model.activity.length) return stateMessage("Nenhum recebimento ou despesa registrado.");
  return `<ul class="dash-list">${model.activity.slice(0, 5).map(item => {
    const incoming = item.type === "payment";
    return `<li class="dash-movement">
      <span class="dash-movement-icon ${incoming ? "dash-positive" : ""}" aria-hidden="true">${incoming ? "↓" : "↑"}</span>
      <div class="dash-row-text"><b>${esc(item.title)}</b><small>${esc(item.subtitle)}</small></div>
      <div class="dash-row-values"><b class="${incoming ? "dash-green" : ""}">${incoming ? "+" : "−"}${money(item.cents / 100)}</b>
        <time datetime="${item.date}">${dateBR(item.date)}</time></div>
    </li>`;
  }).join("")}</ul>`;
}

function requestsBox(requests, { esc, dateBR }) {
  if (!requests) return stateMessage("Dados das solicitações indisponíveis.");
  const open = requests.filter(item => item.status === "new");
  const approved = requests.filter(item => item.status === "approved");
  const latest = [...open].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 3);
  return `<dl class="dash-request-totals">
    <div><dt>Novas</dt><dd>${open.length}</dd></div>
    <div><dt>Aprovadas sem contrato</dt><dd>${approved.length}</dd></div>
  </dl>${latest.length ? `<ul class="dash-list">${latest.map(item => `
    <li class="dash-request">
      <div class="dash-row-text"><b>${esc(item.name)}</b><small>${esc(item.event_type)}</small></div>
      <time class="dash-tag" datetime="${item.event_date}" aria-label="Data desejada ${dateBR(item.event_date)}">${dateBR(item.event_date)}</time>
    </li>`).join("")}</ul>` : stateMessage("Nenhuma solicitação nova aguardando retorno.")}`;
}

export function renderDashboard(model, format) {
  const { cash, collections } = model;
  const { money, pix, esc, canWrite } = format;
  const scalar = value => value == null ? "—" : money(value / 100);
  const openCents = collections && collections.total - collections.received;
  const count = (value, one, many) => value == null ? "Dados indisponíveis" : `${value} ${value === 1 ? one : many}`;
  const metrics = [
    metric({ label: "Saldo registrado", value: scalar(cash && cash.received - cash.spent),
      caption: cash ? `<span>Recebido <b>${scalar(cash.received)}</b></span><span>Despesas <b>${scalar(cash.spent)}</b></span>`
        : "Dados indisponíveis", tone: "dash-balance" }),
    metric({ label: "A receber", value: scalar(openCents),
      caption: count(collections?.openCount, "parcela com saldo", "parcelas com saldo"), route: "receber" }),
    metric({ label: "Em atraso", value: scalar(collections?.lateCents),
      caption: count(collections?.late.length, "parcela vencida", "parcelas vencidas"), route: "receber",
      tone: collections?.lateCents ? "dash-overdue" : "" }),
    metric({ label: "Eventos contratados", value: model.scheduledCount ?? "—",
      caption: model.scheduledCount == null ? "Dados indisponíveis"
        : `Nos próximos 30 dias · ${count(model.contractCount, "contrato no total", "contratos no total")}`, route: "agenda" }),
  ];
  const warning = model.unavailable.length
    ? `<p class="warnbox dash-warning" role="status">Não foi possível carregar ${esc(model.unavailable.join(", "))}. Use Atualizar para tentar de novo.</p>`
    : "";

  return `<section class="ops-dashboard" aria-labelledby="dashboard-title">
    <header class="dash-heading">
      <div><p class="dash-today"><time datetime="${model.today}">${fullDay.format(model.now)}</time></p><h1 id="dashboard-title">Visão geral</h1></div>
      <div class="dash-header-actions">
        <button type="button" class="dash-action" data-refresh-dashboard><span aria-hidden="true">↻</span> Atualizar</button>
        ${canWrite ? '<button type="button" class="btn dash-primary" data-route="contratos" data-open-form="newContract">+ Novo contrato</button>' : ""}
      </div>
    </header>
    ${warning}
    <div class="dash-metrics">${metrics.join("")}</div>

    <div class="dash-columns">
      <section class="dash-panel" aria-labelledby="dash-cash-title">
        <div class="dash-panel-head"><h2 id="dash-cash-title">Fluxo de caixa</h2>
          ${cash ? `<select aria-label="Período do fluxo de caixa" data-cash-period>${[3, 6, 12].map(n =>
            `<option value="${n}"${n === view.months ? " selected" : ""}>Últimos ${n} meses</option>`).join("")}</select>` : ""}
        </div>
        <div data-cash-chart>${cash ? cashChart(cashMonths(model), format) : stateMessage("Dados do fluxo de caixa indisponíveis.")}</div>
      </section>
      <section class="dash-panel" aria-labelledby="dash-status-title">
        <div class="dash-panel-head"><h2 id="dash-status-title">Situação das cobranças</h2></div>
        ${collectionStatus(collections, money)}
        <div class="dash-panel-foot">${link("receber", "Ver cobranças")}</div>
      </section>
    </div>

    <div class="dash-columns">
      <section class="dash-panel" aria-labelledby="dash-priority-title">
        <div class="dash-panel-head"><h2 id="dash-priority-title">Cobranças prioritárias</h2>${link("receber", "Ver todas")}</div>
        ${collections ? `<div class="dash-filters" role="group" aria-label="Filtrar cobranças prioritárias">
          <button type="button" data-charge-view="late" aria-pressed="${view.charges === "late"}">Em atraso <b>${collections.late.length}</b></button>
          <button type="button" data-charge-view="soon" aria-pressed="${view.charges === "soon"}">Próximos 7 dias <b>${collections.soon.length}</b></button>
        </div><div data-charge-list aria-live="polite">${chargeList(model, format)}</div>` : stateMessage("Dados das cobranças indisponíveis.")}
      </section>
      <section class="dash-panel" aria-labelledby="dash-agenda-title">
        <div class="dash-panel-head"><div><h2 id="dash-agenda-title">Próximos eventos</h2><p>Agenda dos próximos 30 dias</p></div>${link("agenda", "Ver agenda")}</div>
        ${eventList(model, format)}
      </section>
    </div>

    <div class="dash-columns">
      <section class="dash-panel" aria-labelledby="dash-activity-title">
        <div class="dash-panel-head"><h2 id="dash-activity-title">Movimentações recentes</h2></div>
        ${recentActivity(model, format)}
        <div class="dash-panel-foot">${link("recebimentos", "Ver pagamentos")}${link("despesas", "Ver despesas")}</div>
      </section>
      <section class="dash-panel" aria-labelledby="dash-requests-title">
        <div class="dash-panel-head"><h2 id="dash-requests-title">Solicitações do site</h2></div>
        ${requestsBox(model.requests, format)}
        <div class="dash-panel-foot">${link("solicitacoes", "Ver solicitações")}</div>
      </section>
    </div>

    <footer class="dash-footer"><span>${model.unavailable.length ? "Consulta" : "Atualizado"} às <time datetime="${model.refreshed.toISOString()}">${clock.format(model.refreshed)}</time></span>
      <span>Chave Pix <b>${esc(pix)}</b> <button type="button" class="dash-link" data-copy-pix>Copiar</button></span></footer>
    <dialog id="pixModal" aria-labelledby="paymentTitle"></dialog>
  </section>`;
}

function revealSelectedMonth(chart) {
  const scroll = chart.querySelector(".dash-chart-scroll");
  const selected = chart.querySelector('[data-cash-month][aria-pressed="true"]');
  if (!scroll || scroll.scrollWidth <= scroll.clientWidth) return;
  const bounds = scroll.getBoundingClientRect();
  const button = selected.getBoundingClientRect();
  scroll.scrollLeft += button.left + button.width / 2 - (bounds.left + bounds.width / 2);
}

export function bindDashboard(root, model, format, { refresh, confirmPayment, notify }) {
  root.querySelector("[data-refresh-dashboard]").onclick = async event => {
    const button = event.currentTarget;
    const restoreFocus = document.activeElement === button;
    button.disabled = true;
    button.textContent = "Atualizando…";
    if (await refresh() && restoreFocus) document.querySelector("[data-refresh-dashboard]")?.focus({ preventScroll: true });
  };

  const chart = root.querySelector("[data-cash-chart]");
  const period = root.querySelector("[data-cash-period]");
  revealSelectedMonth(chart);
  if (period) period.onchange = () => {
    view.months = Number(period.value);
    chart.innerHTML = cashChart(cashMonths(model), format);
    revealSelectedMonth(chart);
  };
  root.addEventListener("click", async event => {
    const month = event.target.closest("[data-cash-month]");
    if (month) {
      view.month = month.dataset.cashMonth;
      const item = cashMonths(model).find(value => value.key === view.month);
      chart.querySelectorAll("[data-cash-month]").forEach(button => button.setAttribute("aria-pressed", button === month));
      chart.querySelector("[data-cash-detail]").innerHTML = cashDetail(item, format.money);
    }
    const filter = event.target.closest("[data-charge-view]");
    if (filter) {
      view.charges = filter.dataset.chargeView;
      root.querySelectorAll("[data-charge-view]").forEach(button => button.setAttribute("aria-pressed", button === filter));
      root.querySelector("[data-charge-list]").innerHTML = chargeList(model, format);
    }
    const charge = event.target.closest("[data-dashboard-charge]");
    if (charge) confirmPayment(charge.dataset.dashboardCharge);
    if (event.target.closest("[data-copy-pix]")) {
      try {
        await navigator.clipboard.writeText(format.pix);
        notify("Chave Pix copiada.");
      } catch {
        notify("Não foi possível copiar. A chave está no rodapé.");
      }
    }
  });
}

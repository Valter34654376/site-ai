function expenseForm() {
  return `<dialog class="expense-dialog" aria-labelledby="expense-dialog-title">
    <header class="expense-dialog-header">
      <h2 id="expense-dialog-title">Nova despesa</h2>
      <button type="button" class="expense-close" data-close-expense aria-label="Fechar">×</button>
    </header>
    <form id="ef" class="expense-form">
      <fieldset class="expense-fields">
        <label class="expense-field-wide">Descrição<input name="description" required autofocus></label>
        <label class="expense-field-wide">Categoria<input name="category"></label>
        <label>Valor em reais<input name="amount" type="number" step="0.01" inputmode="decimal" required></label>
        <label>Data<input name="expense_date" type="date" required></label>
        <label class="expense-field-wide">Observações<textarea name="notes" rows="2"></textarea></label>
      </fieldset>
      <p class="expense-form-error" role="alert" hidden></p>
      <footer class="expense-dialog-footer"><button class="expense-button expense-primary" type="submit">Salvar despesa</button></footer>
    </form>
  </dialog>`;
}

function expenseLedger(records, { dateBR, esc, money }, canWrite) {
  const cents = records.reduce((sum, row) => sum + Math.round(Number(row.amount) * 100), 0);
  const count = `${records.length.toLocaleString("pt-BR")} ${records.length === 1 ? "lançamento" : "lançamentos"}`;
  const summary = `<div class="expense-summary">
    <dl><dt>Total registrado</dt><dd>${money(cents / 100)}</dd></dl>
    <span class="expense-count">${count}</span>
  </div>`;
  if (!records.length) {
    return `${summary}<section class="expense-card expense-empty" aria-labelledby="expense-empty-title">
      <span class="expense-receipt" aria-hidden="true"><i></i></span>
      <h2 id="expense-empty-title">Nenhuma despesa registrada</h2>
      ${canWrite ? "<p>Use Nova despesa para registrar a primeira saída.</p>" : ""}
    </section>`;
  }

  const ordered = [...records].sort((a, b) => String(b.expense_date || "").localeCompare(String(a.expense_date || "")));
  return `${summary}<section class="expense-card" aria-labelledby="expense-ledger-title">
    <h2 class="expense-ledger-title" id="expense-ledger-title">Histórico de despesas</h2>
    <ul class="expense-list" role="list">
      ${ordered.map(item => `<li class="expense-row">
        <span class="expense-row-icon" aria-hidden="true"></span>
        <div class="expense-row-detail">
          <strong>${esc(item.description || "Despesa")}</strong>
          <div class="expense-row-meta">
            ${item.expense_date ? `<time datetime="${esc(item.expense_date)}">${dateBR(item.expense_date)}</time>` : ""}
            ${item.category ? `<span>${esc(item.category)}</span>` : ""}
          </div>
        </div>
        <strong class="expense-amount">${money(item.amount)}</strong>
      </li>`).join("")}
    </ul>
  </section>`;
}

export function renderExpenses(records, format, canWrite) {
  return `<section class="expense-page" aria-labelledby="expense-page-title">
    <header class="expense-page-header">
      <h1 id="expense-page-title">Despesas</h1>
      ${canWrite ? '<button type="button" class="expense-button expense-primary" id="newExpense" aria-haspopup="dialog"><span aria-hidden="true">+</span> Nova despesa</button>' : ""}
    </header>
    ${records ? expenseLedger(records, format, canWrite) : `<section class="expense-card expense-empty" aria-labelledby="expense-error-title">
      <h2 id="expense-error-title">Não foi possível carregar as despesas</h2>
      <button type="button" class="expense-button expense-secondary" data-retry-expenses>Tentar novamente</button>
    </section>`}
    ${canWrite ? expenseForm() : ""}
  </section>`;
}

export function bindExpenses(page, { client, audit, notify, refresh }) {
  const retry = page.querySelector("[data-retry-expenses]");
  if (retry) retry.onclick = async () => {
    retry.disabled = true;
    await refresh();
  };

  const dialog = page.querySelector("dialog");
  if (!dialog) return;
  const open = page.querySelector("#newExpense");
  const close = dialog.querySelector("[data-close-expense]");
  const form = dialog.querySelector("form");
  const fields = form.querySelector("fieldset");
  const submit = form.querySelector('[type="submit"]');
  const errorBox = form.querySelector('[role="alert"]');
  let saving = false;

  open.onclick = () => {
    if (dialog.open) return;
    form.reset();
    errorBox.hidden = true;
    dialog.showModal();
  };
  close.onclick = () => dialog.close();
  dialog.oncancel = event => {
    if (saving) event.preventDefault();
  };

  form.onsubmit = async event => {
    event.preventDefault();
    if (saving) return;
    const values = Object.fromEntries(new FormData(form));
    values.amount = Number(values.amount);
    saving = true;
    close.disabled = submit.disabled = fields.disabled = true;
    submit.textContent = "Salvando…";
    errorBox.hidden = true;

    let expense;
    try {
      const { data, error } = await client.from("so_expenses").insert(values).select().single();
      if (error) throw error;
      expense = data;
    } catch (error) {
      errorBox.textContent = error?.message || "Não foi possível salvar a despesa.";
      errorBox.hidden = false;
    } finally {
      saving = false;
      close.disabled = submit.disabled = fields.disabled = false;
      submit.textContent = "Salvar despesa";
    }
    if (!expense) return;

    dialog.close();
    await audit("create", "expense", expense.id, { amount: expense.amount }).catch(console.error);
    notify("Despesa salva");
    if (await refresh()) page.ownerDocument.querySelector(".expense-page #newExpense")?.focus({ preventScroll: true });
  };
}

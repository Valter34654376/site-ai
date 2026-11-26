export const paymentsEndpoint = "https://bdfojankowlfuezdhdjl.supabase.co/functions/v1/solar-payments";

const methods = {
  pix: { name: "Pix", provider: "Sicoob", description: "QR Code e Pix Copia e Cola no valor da parcela." },
  boleto: { name: "Boleto bancário", provider: "Sicoob", description: "Boleto registrado com vencimento até 30 dias antes do evento." },
  card: { name: "Cartão parcelado", provider: "Sipag", description: "Pagamento no checkout da Sipag conforme as parcelas habilitadas na conta." },
};
const stateLabel = {
  preparing: "Em preparação", open: "Aguardando pagamento", paid: "Pagamento confirmado",
  refunded: "Pagamento estornado", closed: "Link encerrado", review: "Em conferência bancária",
};

export async function paymentRequest(action, data = {}, token = "") {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["X-Solar-Session"] = token;
  const response = await fetch(paymentsEndpoint, {
    method: "POST", headers, body: JSON.stringify({ ...data, action }), cache: "no-store",
    credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(28000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.error || "Serviço de recebimentos indisponível. Tente novamente.");
  return result;
}

export function renderPaymentSetup(status, escape) {
  const account = status?.account ? `<strong>Conta final ${escape(status.account)}</strong>` : "<strong>Conta de recebimento pendente</strong>";
  return `<section class="pay-setup" aria-labelledby="pay-setup-title">
    <header class="top"><div><h1 id="pay-setup-title">Recebimentos online</h1>
    <p class="muted">Configure o Sicoob para Pix e boleto e a Sipag para cartão.</p></div>
    <button type="button" class="btn gray" id="refreshPaymentSetup">Atualizar situação</button></header>
    ${status ? "" : '<p class="warnbox" role="status">Não foi possível verificar a integração. Atualize a situação para tentar novamente.</p>'}
    <div class="pay-account"><div><span>Conta de recebimento</span><h2>Sicoob</h2></div>${account}</div>
    <div class="pay-channels">
      ${Object.entries(methods).map(([id, method]) => {
        const channel = status?.[id];
        const label = !status ? "Verificação indisponível" : channel?.ready ? "Habilitado" : "Aguardando habilitação";
        return `<article class="card pay-channel">
          <div class="pay-channel-heading"><span class="pay-provider">${method.provider}</span><span class="badge ${channel?.ready ? "paid" : ""}">${label}</span></div>
          <h2>${method.name}</h2><p class="muted">${method.description}</p>
          ${channel?.sandbox ? `<button type="button" class="btn small gray" data-test-payment="${id}">Testar ambiente de homologação</button>` : ""}
          <p class="pay-test-message" data-test-result="${id}" role="status" hidden></p>
        </article>`;
      }).join("")}
    </div>
    <section class="card pay-onboarding" aria-labelledby="pay-onboarding-title"><h2 id="pay-onboarding-title">Habilitar a conta</h2>
      <ol>
        <li><strong>Pix e boleto</strong><p>Cadastre o aplicativo da empresa com o certificado público A1. Habilite Pix Recebimentos e Cobrança Bancária na conta PJ.</p>
        <a class="pay-text-link" href="https://developers.sicoob.com.br/portal/" target="_blank" rel="noopener noreferrer">Abrir Portal Developers Sicoob ↗</a></li>
        <li><strong>Cartão parcelado</strong><p>Solicite à Sipag o e-commerce, os limites de parcelamento e o vínculo com a conta Sicoob.</p>
        <a class="pay-text-link" href="https://portal.sipag.com.br/" target="_blank" rel="noopener noreferrer">Abrir Portal Sipag ↗</a></li>
        <li><strong>Credenciais da integração</strong><p>A chave privada e as credenciais ficam no cofre do servidor. O painel exibe somente a situação e o final da conta.</p>
        <a class="pay-text-link" href="https://supabase.com/dashboard/project/bdfojankowlfuezdhdjl/functions/secrets" target="_blank" rel="noopener noreferrer">Abrir cofre da integração ↗</a></li>
      </ol>
    </section>
  </section>`;
}

export function bindPaymentSetup(root, api, refresh) {
  root.querySelector("#refreshPaymentSetup").onclick = refresh;
  root.querySelectorAll("[data-test-payment]").forEach(button => button.onclick = async () => {
    const method = button.dataset.testPayment;
    const status = root.querySelector(`[data-test-result="${method}"]`);
    button.disabled = true;
    status.hidden = false;
    status.textContent = "Consultando o Sicoob…";
    try {
      await api("test", { method });
      status.textContent = "Conexão de homologação confirmada.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
}

function checkoutLink(value) {
  try {
    const url = new URL(value);
    return url.origin === location.origin && url.pathname === "/pagar.html" && !url.search &&
      /^#[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(url.hash) ? url.href : null;
  } catch {
    return null;
  }
}

export async function openOnlinePayment(dialog, receivable, { api, escape, money, settings }) {
  if (!dialog || dialog.open) return;
  const done = '<button type="button" class="btn gray" data-online-close>Fechar</button>';
  const view = html => {
    dialog.innerHTML = html;
    dialog.querySelector("[data-online-close]").onclick = () => dialog.close();
  };
  view(`<h2 id="onlinePaymentTitle">Link de pagamento</h2><p role="status">Carregando cobrança…</p>${done}`);
  dialog.showModal();

  function attach(checkout) {
    const link = checkoutLink(checkout.link);
    const expiry = new Date(checkout.expires).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const inProgress = checkout.state === "preparing";
    const check = ["open", "review", "paid"].includes(checkout.state) ? '<button class="btn gray" type="button" data-check-bank>Conferir no Sicoob</button>' : "";
    view(`<h2 id="onlinePaymentTitle">Link de pagamento</h2>
      <div class="pay-amount"><span>${escape(methods[checkout.method]?.name || "Cobrança online")}</span><strong>${escape(money(checkout.amount / 100))}</strong></div>
      <p>${escape(stateLabel[checkout.state] || "Aguardando atualização")}</p>
      ${link ? `<p class="muted">Disponível até ${escape(expiry)}.</p>
        <label>Link para o cliente<input class="pay-share" readonly value="${escape(link)}"></label>
        <p role="status" data-share-status></p><div class="row"><button class="btn" type="button" data-copy-link>Copiar link</button>
        <a class="btn gray" href="${escape(link)}" target="_blank" rel="noopener noreferrer">Abrir link</a>${check}${done}</div>`
      : `${inProgress ? '<p class="muted">A emissão ainda aguarda confirmação do Sicoob.</p>' : ""}
        <p role="status" data-share-status></p><div class="row">${inProgress && checkout.method === "pix" ? '<button class="btn" type="button" data-resume-pix>Consultar emissão</button>' : ""}${check}${done}</div>`}`);
    const copy = dialog.querySelector("[data-copy-link]");
    if (copy) copy.onclick = async () => {
      const status = dialog.querySelector("[data-share-status]");
      try { await navigator.clipboard.writeText(link); status.textContent = "Link copiado."; }
      catch { dialog.querySelector(".pay-share").select(); status.textContent = "Copie o link selecionado."; }
    };
    const resume = dialog.querySelector("[data-resume-pix]");
    if (resume) resume.onclick = async () => {
      resume.disabled = true;
      try { attach((await api("issue", { receivable, method: "pix" })).checkout); }
      catch (error) { view(`<h2 id="onlinePaymentTitle">Link de pagamento</h2><p role="alert">${escape(error.message)}</p>${done}`); }
    };
    const verify = dialog.querySelector("[data-check-bank]");
    if (verify) verify.onclick = async () => {
      const status = dialog.querySelector("[data-share-status]");
      verify.disabled = true;
      status.textContent = "Consultando movimentação…";
      try {
        const result = await api("check", { receivable });
        if (dialog.open && dialog.isConnected && result.checkout) attach(result.checkout);
      } catch (error) { status.textContent = error.message; }
      finally { verify.disabled = false; }
    };
  }

  try {
    const [status, result] = await Promise.all([api("status"), api("lookup", { receivable })]);
    if (!dialog.open || !dialog.isConnected) return;
    if (result.checkout && !["closed", "refunded"].includes(result.checkout.state)) return attach(result.checkout);
    const available = ["pix", "boleto"].filter(method => status[method]?.ready);
    if (!available.length) {
      view(`<h2 id="onlinePaymentTitle">Link de pagamento</h2><p>Os recebimentos online aguardam a habilitação do Sicoob ou da Sipag.</p>
        <div class="row">${settings ? '<button class="btn" type="button" data-payment-settings>Ver configuração</button>' : ""}${done}</div>`);
      const button = dialog.querySelector("[data-payment-settings]");
      if (button) button.onclick = () => { dialog.close(); settings(); };
      return;
    }
    view(`<h2 id="onlinePaymentTitle">Emitir link de pagamento</h2><p class="muted">O valor vem do saldo atual da parcela.</p>
      <form class="form" data-online-form>
        <label class="full">Forma de pagamento<select name="method">${available.map(method => `<option value="${method}">${methods[method].name}</option>`).join("")}</select></label>
        <fieldset class="full pay-address" hidden><legend>Endereço do pagador</legend>
          <label>Rua e número<input name="endereco" maxlength="100" autocomplete="off"></label>
          <label>Bairro<input name="bairro" maxlength="50" autocomplete="off"></label>
          <label>Cidade<input name="cidade" maxlength="50" autocomplete="off"></label>
          <label>UF<input name="uf" maxlength="2" size="2" autocomplete="off"></label>
          <label>CEP<input name="cep" inputmode="numeric" maxlength="9" autocomplete="off"></label>
        </fieldset>
        <p class="full" data-online-error role="alert" hidden></p>
        <div class="row full"><button type="submit" class="btn">Gerar link</button>${done}</div>
      </form>`);
    const form = dialog.querySelector("[data-online-form]");
    const fieldset = form.querySelector("fieldset");
    function toggleAddress() {
      const show = form.elements.method.value === "boleto";
      fieldset.hidden = !show;
      fieldset.disabled = !show;
      fieldset.querySelectorAll("input").forEach(input => input.required = show);
    }
    form.elements.method.onchange = toggleAddress;
    toggleAddress();
    form.onsubmit = async event => {
      event.preventDefault();
      const { method, ...address } = Object.fromEntries(new FormData(form));
      const submit = form.querySelector("[type=submit]");
      const errorBox = form.querySelector("[data-online-error]");
      submit.disabled = true;
      errorBox.hidden = true;
      try {
        const result = await api("issue", { receivable, method, ...(method === "boleto" ? {address} : {}) });
        if (dialog.open && dialog.isConnected) attach(result.checkout);
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      } finally {
        submit.disabled = false;
      }
    };
  } catch (error) {
    if (dialog.open && dialog.isConnected) view(`<h2 id="onlinePaymentTitle">Link de pagamento</h2><p role="alert">${escape(error.message)}</p>${done}`);
  }
}

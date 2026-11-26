import { paymentRequest } from "./payments-online.js";

const elements = Object.fromEntries(
  ["payTitle", "payAmount", "payExpiry", "payStatus", "payTools", "payQr", "payLabel", "payCode", "copyPayment", "copyResult", "reloadPayment"]
    .map(id => [id, document.getElementById(id)])
);
const proof = location.hash.slice(1);
const formatMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatTime = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "long", timeStyle: "short" });
const states = {
  closed: "Esta cobrança foi encerrada.", paid: "Pagamento confirmado pelo Sicoob.",
  refunded: "Este pagamento foi estornado.", review: "O pagamento está em conferência bancária.",
  expired: "O prazo desta cobrança terminou. Entre em contato com a equipe do Solar Opará.",
};
let timer;

function status(message) {
  elements.payStatus.textContent = message;
}

function render(data) {
  const isPix = data.method === "pix";
  elements.payTitle.textContent = isPix ? "Pagamento via Pix" : "Boleto bancário";
  elements.payAmount.textContent = formatMoney.format(data.amount / 100);
  elements.payAmount.hidden = false;
  const code = typeof data.code === "string" ? data.code : "";
  const validCode = isPix ? /^000201.{10,644}$/.test(code) : /^756\d{44}$/.test(code);
  const open = data.state === "open" && validCode;
  elements.payTools.hidden = !open;
  elements.payExpiry.hidden = !open;
  if (!open) {
    elements.payCode.value = "";
    status(states[data.state] || "Esta cobrança aguarda confirmação.");
    return data.state === "review" || data.state === "preparing";
  }
  elements.payExpiry.textContent = `Disponível até ${formatTime.format(new Date(data.expires))}.`;
  status(isPix ? "Pague pelo aplicativo do seu banco com o QR Code ou o Pix Copia e Cola." : "Copie a linha digitável e pague pelo aplicativo do seu banco.");
  const image = isPix && typeof data.image === "string" && data.image.length < 220000 && /^iVBORw0KGgo[a-zA-Z0-9+/]+=*$/.test(data.image);
  elements.payQr.hidden = !image;
  if (image && !elements.payQr.hasAttribute("src")) elements.payQr.src = `data:image/png;base64,${data.image}`;
  if (!image) elements.payQr.removeAttribute("src");
  elements.payLabel.textContent = isPix ? "Pix Copia e Cola" : "Linha digitável do boleto";
  if (elements.payCode.value !== code) elements.payCode.value = code;
  elements.copyPayment.textContent = isPix ? "Copiar Pix" : "Copiar linha digitável";
  return true;
}

async function refresh() {
  clearTimeout(timer);
  elements.reloadPayment.hidden = true;
  try {
    if (render(await paymentRequest("public", { proof }))) {
      timer = setTimeout(refresh, 30000);
    }
  } catch {
    elements.payTools.hidden = true;
    elements.payExpiry.hidden = true;
    elements.payAmount.hidden = true;
    elements.payCode.value = "";
    status("Não foi possível abrir a cobrança. Confira o link recebido ou consulte novamente.");
    elements.reloadPayment.hidden = false;
  }
}

elements.copyPayment.onclick = async () => {
  try {
    await navigator.clipboard.writeText(elements.payCode.value);
    elements.copyResult.textContent = "Código copiado.";
  } catch {
    elements.payCode.focus();
    elements.payCode.select();
    elements.copyResult.textContent = "Copie o código selecionado.";
  }
};
elements.reloadPayment.onclick = refresh;

if (/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(proof)) refresh();
else status("Abra o link de pagamento enviado pela equipe do Solar Opará.");

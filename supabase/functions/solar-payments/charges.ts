import { Bank, bankDate, BankError, cents, decimal, Environment, Json, Method, object, validTimestamp } from "./sicoob.ts";

export type Checkout = {
  id: string;
  receivable_id: string | null;
  environment: Environment;
  method: Method;
  amount_cents: number;
  expires_at: string;
  created_at: string;
  updated_at: string;
  state: "preparing" | "open" | "paid" | "refunded" | "closed" | "review";
  provider_checkout_id: string | null;
  provider_details: Json;
};

export type Settlement = {
  reference: string;
  cents: number;
  outcome: "paid" | "refunded" | "review";
  paidAt: string;
  updatedAt: string;
};

export type BoletoAddress = { endereco: string; bairro: string; cidade: string; cep: string; uf: string };
const BRAZIL_UFS = new Set("AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" "));
const PIX_REMOVED = new Set(["REMOVIDA_PELO_USUARIO_RECEBEDOR", "REMOVIDA_PELO_PSP"]);

function txid(checkout: Checkout) {
  return checkout.id.replaceAll("-", "");
}

function yourNumber(checkout: Checkout) {
  return "SO" + txid(checkout).slice(0, 16).toUpperCase();
}

export function boletoAddress(value: Json): BoletoAddress | null {
  const clean = (v: unknown) => typeof v === "string" ? v.trim() : "";
  const endereco = clean(value.endereco);
  const bairro = clean(value.bairro);
  const cidade = clean(value.cidade);
  const cep = clean(value.cep).replace(/\D/g, "");
  const uf = clean(value.uf).toUpperCase();
  if (endereco.length < 3 || endereco.length > 100 || !bairro || bairro.length > 50 ||
      !cidade || cidade.length > 50 || !/^\d{8}$/.test(cep) || !BRAZIL_UFS.has(uf)) return null;
  return { endereco, bairro, cidade, cep, uf };
}

export function boletoPayer(value: Json) {
  const nome = typeof value.name === "string" ? value.name.trim() : "";
  const numeroCpfCnpj = typeof value.document === "string" ? value.document.replace(/\D/g, "") : "";
  if (!nome || nome.length > 50 || !/^(\d{11}|\d{14})$/.test(numeroCpfCnpj)) return null;
  return { nome, numeroCpfCnpj };
}

function pixMatches(data: Json, checkout: Checkout, bank: Bank) {
  const amount = object(data.valor);
  return data.txid === txid(checkout) && data.chave === bank.config.pixKey &&
    cents(amount.original) === checkout.amount_cents && (!amount.modalidadeAlteracao || amount.modalidadeAlteracao === 0);
}

export async function issuePix(checkout: Checkout, bank: Bank, created: boolean) {
  const id = txid(checkout);
  const seconds = Math.floor((Date.parse(checkout.expires_at) - Date.now()) / 1000);
  if (created && seconds < 60) throw new BankError(422);
  const path = `/cob/${id}`;
  const data = object(await (created ? bank.json("pix", path, "PUT", {
    calendario: { expiracao: seconds },
    valor: { original: decimal(checkout.amount_cents), modalidadeAlteracao: 0 },
    chave: bank.config.pixKey,
    solicitacaoPagador: "Reserva Solar Opará",
  }) : bank.json("pix", path)));
  if (!pixMatches(data, checkout, bank) || !["ATIVA", "CONCLUIDA"].includes(String(data.status))) {
    throw new BankError(502);
  }
  const code = data.brcode;
  if (typeof code !== "string" || code.length > 650 || !code.startsWith("000201") ||
      !code.toLowerCase().includes("br.gov.bcb.pix")) throw new BankError(502);
  return { id, details: { code, pix_key: bank.config.pixKey } };
}

export async function verifyPix(checkout: Checkout, bank: Bank): Promise<Settlement | "closed" | "review" | null> {
  const id = txid(checkout);
  if (checkout.provider_checkout_id !== id || checkout.provider_details.pix_key !== bank.config.pixKey) return "review";
  const charge = object(await bank.json("pix", `/cob/${id}`));
  if (!pixMatches(charge, checkout, bank)) return "review";
  if (charge.status === "ATIVA" || PIX_REMOVED.has(String(charge.status))) {
    const calendar = object(charge.calendario);
    if (!validTimestamp(calendar.criacao) || typeof calendar.expiracao !== "number") return "review";
    const expired = Date.now() >= Date.parse(calendar.criacao) + (calendar.expiracao + 600) * 1000;
    const ended = expired || PIX_REMOVED.has(String(charge.status));
    if (ended && checkout.state === "open" && (!Array.isArray(charge.pix) || !charge.pix.length)) return "closed";
    return charge.status === "ATIVA" && checkout.state === "open" ? null : "review";
  }
  if (charge.status !== "CONCLUIDA" || !Array.isArray(charge.pix) || charge.pix.length !== 1) return "review";
  const summary = object(charge.pix[0]);
  const reference = summary.endToEndId;
  if (typeof reference !== "string" || !/^[a-zA-Z0-9]{32}$/.test(reference)) return "review";
  const payment = object(await bank.json("pix", `/pix/${reference}`));
  const received = cents(payment.valor);
  if (payment.txid !== id || payment.endToEndId !== reference ||
      (payment.chave && payment.chave !== bank.config.pixKey) || received === null || received < 1 ||
      received !== cents(summary.valor) || !validTimestamp(payment.horario)) return "review";
  let refunded = 0;
  let updatedAt = payment.horario;
  for (const item of Array.isArray(payment.devolucoes) ? payment.devolucoes : []) {
    const refund = object(item);
    if (refund.status !== "DEVOLVIDO") continue;
    const value = cents(refund.valor);
    const time = object(refund.horario).liquidacao;
    if (!value || !validTimestamp(time)) return "review";
    refunded += value;
    if (Date.parse(time) > Date.parse(updatedAt)) updatedAt = time;
  }
  const outcome = refunded === 0 ? "paid" : refunded === received ? "refunded" : "review";
  return { reference, cents: received, outcome, paidAt: payment.horario, updatedAt };
}

function boletoQuery(bank: Bank, number: number) {
  const wallet = bank.config.wallet;
  if (!wallet) throw new BankError(503);
  const query = new URLSearchParams({ numeroCliente: String(wallet.number), codigoModalidade: "1", nossoNumero: String(number) });
  if (wallet.contract) query.set("numeroContratoCobranca", String(wallet.contract));
  return query;
}

export async function issueBoleto(checkout: Checkout, bank: Bank, payer: Json) {
  const wallet = bank.config.wallet;
  if (!wallet) throw new BankError(503);
  const due = bankDate(new Date(checkout.expires_at));
  const data = object((await bank.json("boleto", "/boletos", "POST", {
    numeroCliente: wallet.number,
    numeroContaCorrente: wallet.account,
    ...(wallet.contract ? { numeroContratoCobranca: wallet.contract } : {}),
    codigoModalidade: 1,
    codigoEspecieDocumento: "DS",
    dataEmissao: bankDate(new Date()),
    seuNumero: yourNumber(checkout),
    identificacaoEmissaoBoleto: 2,
    identificacaoDistribuicaoBoleto: 2,
    valor: Number(decimal(checkout.amount_cents)),
    dataVencimento: due,
    dataLimitePagamento: due,
    aceite: false,
    tipoDesconto: 0,
    tipoMulta: 0,
    tipoJurosMora: 3,
    numeroParcela: 1,
    pagador: { numeroCliente: wallet.number, ...payer },
    gerarPdf: false,
  }))?.resultado);
  if (!Number.isSafeInteger(data.nossoNumero) || Number(data.nossoNumero) < 1 ||
      data.numeroCliente !== wallet.number || data.numeroContaCorrente !== wallet.account ||
      data.seuNumero !== yourNumber(checkout) || cents(data.valor) !== checkout.amount_cents ||
      data.dataVencimento !== due || typeof data.linhaDigitavel !== "string" || !/^756\d{44}$/.test(data.linhaDigitavel) ||
      typeof data.codigoBarras !== "string" || !/^756\d{41}$/.test(data.codigoBarras)) throw new BankError(502);
  return {
    id: `${wallet.number}:${data.nossoNumero}`,
    details: { code: data.linhaDigitavel, barcode: data.codigoBarras, wallet: wallet.number,
      wallet_contract: wallet.contract, account: wallet.account, number: data.nossoNumero },
  };
}

export async function boletoState(checkout: Checkout, bank: Bank) {
  const details = checkout.provider_details;
  const wallet = bank.config.wallet;
  if (!wallet || details.wallet !== wallet.number || details.account !== wallet.account ||
      details.wallet_contract !== wallet.contract || !Number.isSafeInteger(details.number) ||
      checkout.provider_checkout_id !== `${wallet.number}:${details.number}`) return "review";
  const data = object((await bank.json("boleto", `/boletos?${boletoQuery(bank, Number(details.number))}`))?.resultado);
  if (data.nossoNumero !== details.number || data.numeroCliente !== wallet.number ||
      data.numeroContaCorrente !== wallet.account || data.seuNumero !== yourNumber(checkout) ||
      data.codigoBarras !== details.barcode || cents(data.valor) !== checkout.amount_cents ||
      data.dataVencimento !== bankDate(new Date(checkout.expires_at))) return "review";
  if (data.situacaoBoleto === "Baixado" && checkout.state === "open") return "closed";
  if (data.situacaoBoleto === "Liquidado") return "liquidated";
  return data.situacaoBoleto === "Em Aberto" && checkout.state === "open" ? null : "review";
}

export function matchBoletoSettlement(checkout: Checkout, movement: Json): Settlement | null {
  const details = checkout.provider_details;
  if (movement.siglaMovimento !== "LIQUI" || movement.numeroCliente !== details.wallet ||
      movement.numeroTitulo !== details.number || movement.numeroContaCorrente !== details.account ||
      movement.seuNumero !== yourNumber(checkout) || movement.codigoBarras !== details.barcode ||
      movement.modalidade !== 1 || (details.wallet_contract !== null && movement.numeroContrato !== details.wallet_contract) ||
      cents(movement.valorTitulo) !== checkout.amount_cents) return null;
  const value = cents(movement.valorLiquido);
  if (!value || !validTimestamp(movement.dataLiquidacao) || !validTimestamp(movement.dataMovimentoLiquidacao)) return null;
  return { reference: `boleto:${checkout.provider_checkout_id}`, cents: value, outcome: "paid",
    paidAt: movement.dataLiquidacao, updatedAt: movement.dataMovimentoLiquidacao };
}

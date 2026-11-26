import assert from "node:assert/strict";
import { zipSync } from "npm:fflate@0.8.2";
import { decodeReport } from "./boleto-report.ts";
import { Checkout, issueBoleto, issuePix, matchBoletoSettlement, verifyPix } from "./charges.ts";
import { configuration, createBank } from "./sicoob.ts";

const id = "18b6261b-b0f7-4cc6-9f58-241f323cff4d";
const txid = id.replaceAll("-", "");
const e2e = "E" + "00000000" + "202611261800" + "a8d2af00001";
const pixKey = "sandbox-key";
const now = "2026-11-26T18:00:00-03:00";
const refundTime = "2026-11-27T14:00:00-03:00";
const amount = 15425;

const checkout: Checkout = {
  id, receivable_id: null, method: "pix", environment: "test", amount_cents: amount,
  expires_at: new Date(Date.now() + 3_600_000).toISOString(), created_at: now, updated_at: now,
  state: "open", provider_checkout_id: txid, provider_details: { pix_key: pixKey },
};
const settings = configuration(name => ({
  SICOOB_SANDBOX_CLIENT_ID: "sandbox-client",
  SICOOB_SANDBOX_ACCESS_TOKEN: "sandbox-token",
  SICOOB_SANDBOX_PIX_KEY: pixKey,
  SICOOB_SANDBOX_BENEFICIARY: "240",
  SICOOB_SANDBOX_ACCOUNT: "1234",
  SICOOB_SANDBOX_WALLET_CONTRACT: "987",
})[name], "test")!;

Deno.test("Pix uses a deterministic reference and a fixed amount", async () => {
  const bank = createBank(settings, (url, init) => {
    const body = JSON.parse(String(init.body));
    assert.equal(init.method, "PUT");
    assert.equal(url, `https://sandbox.sicoob.com.br/sicoob/sandbox/pix/api/v2/cob/${txid}`);
    assert.equal(new Headers(init.headers).get("authorization"), "Bearer sandbox-token");
    assert.deepEqual(body.valor, {original: "154.25", modalidadeAlteracao: 0});
    return Promise.resolve(Response.json({ txid, valor: body.valor, chave: pixKey, status: "ATIVA", brcode: "000201fixturebr.gov.bcb.pix" }));
  });
  const charge = await issuePix(checkout, bank, true);
  assert.equal(charge.id, txid);
  assert.equal(charge.details.code, "000201fixturebr.gov.bcb.pix");
});

Deno.test("Pix settlement is tied to the charge and verifies the refund amount", async () => {
  function fixture(paymentTxid: string, refund: string | null) {
    return createBank(settings, url => Promise.resolve(Response.json(url.endsWith(`/cob/${txid}`) ? {
      txid, status: "CONCLUIDA", valor: { original: "154.25" }, chave: pixKey,
      pix: [{ endToEndId: e2e, valor: "154.25" }],
    } : {
      endToEndId: e2e, txid: paymentTxid, valor: "154.25", horario: now,
      devolucoes: refund ? [{ valor: refund, status: "DEVOLVIDO", horario: { liquidacao: refundTime } }] : [],
    })));
  }
  assert.deepEqual(await verifyPix(checkout, fixture(txid, null)), {reference: e2e, cents: amount, outcome: "paid", paidAt: now, updatedAt: now});
  assert.equal(await verifyPix(checkout, fixture("unrelated", null)), "review");
  assert.deepEqual(await verifyPix(checkout, fixture(txid, "154.25")), {reference: e2e, cents: amount, outcome: "refunded", paidAt: now, updatedAt: refundTime});
  assert.equal((await verifyPix(checkout, fixture(txid, "4.25")) as {outcome: string}).outcome, "review");
});

Deno.test("Boleto uses the configured bank wallet and the authenticated settlement file", async () => {
  const barcode = "756" + "1".repeat(41);
  const code = "756" + "2".repeat(44);
  const bank = createBank(settings, (_, init) => {
    const body = JSON.parse(String(init.body));
    assert.equal(init.method, "POST");
    assert.equal(body.valor, 154.25);
    assert.equal(body.dataVencimento, body.dataLimitePagamento);
    return Promise.resolve(Response.json({ resultado: { nossoNumero: 67, numeroCliente: 240, numeroContaCorrente: 1234,
      seuNumero: body.seuNumero, valor: body.valor, dataVencimento: body.dataVencimento, codigoBarras: barcode, linhaDigitavel: code } }));
  });
  const boleto = { ...checkout, method: "boleto" as const, expires_at: "2099-01-03T23:59:59-03:00" };
  const charge = await issueBoleto(boleto, bank, {nome: "Pagador de teste", numeroCpfCnpj: "00000000000"});
  assert.equal(charge.id, "240:67");
  const active = { ...boleto, provider_checkout_id: charge.id, provider_details: charge.details };
  const movement = { siglaMovimento: "LIQUI", numeroCliente: 240, numeroContrato: 987, modalidade:1, numeroTitulo: 67,
    numeroContaCorrente: 1234, codigoBarras: barcode, seuNumero: "SO" + txid.slice(0, 16).toUpperCase(),
    valorTitulo: 154.25, valorLiquido: "154.25", dataLiquidacao: now, dataMovimentoLiquidacao: now };
  const zip = zipSync({"liquidacoes.json": new TextEncoder().encode(JSON.stringify([movement]))});
  assert.deepEqual(decodeReport(btoa(String.fromCharCode(...zip))), [movement]);
  assert.equal(matchBoletoSettlement(active, movement)?.cents, amount);
  assert.equal(matchBoletoSettlement(active, { ...movement, numeroContaCorrente: 4321 }), null);
  assert.equal(matchBoletoSettlement(active, { ...movement, valorLiquido: null }), null);
  assert.equal(matchBoletoSettlement(active, { ...movement, valorLiquido: 150 })?.cents, 15000);
});

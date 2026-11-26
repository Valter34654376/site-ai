import { timingSafeEqual } from "node:crypto";
import { Bank, bankDate, BankError, configuration, createBank, Environment, Json, Method, object } from "./sicoob.ts";
import { boletoAddress, boletoPayer, boletoState, Checkout, issueBoleto, issuePix,
  matchBoletoSettlement, Settlement, verifyPix } from "./charges.ts";
import { readSettlementReport, requestSettlementReport } from "./boleto-report.ts";

const read = (name: string) => Deno.env.get(name);
const project = read("SUPABASE_URL") || "";
const publicKey = read("SUPABASE_ANON_KEY") || "";
const serviceKey = read("SUPABASE_SERVICE_ROLE_KEY") || "";
const panel = read("PAYMENTS_PANEL_ORIGIN") || "https://solar-opara-gestao-v4.onrender.com";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const encoder = new TextEncoder();
const banks = new Map<Environment, Bank>();

class RequestError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

function bankFor(environment: Environment) {
  const cached = banks.get(environment);
  if (cached) return cached;
  const settings = configuration(read, environment);
  if (!settings) throw new RequestError(503, "Credenciais Sicoob pendentes neste ambiente.");
  const bank = createBank(settings);
  banks.set(environment, bank);
  return bank;
}

function status() {
  const live = configuration(read, "live");
  const test = configuration(read, "test");
  const signing = /^[a-f0-9]{64}$/.test(read("PAYMENTS_LINK_SECRET") || "");
  const sync = /^[a-f0-9]{64}$/.test(read("PAYMENTS_SYNC_SECRET") || "");
  return {
    pix: { ready: !!(signing && sync && live?.pixKey && read("SICOOB_PIX_LIVE") === "true"), sandbox: !!test },
    boleto: { ready: !!(signing && sync && live?.wallet && read("SICOOB_BOLETO_LIVE") === "true"), sandbox: !!test },
    card: { ready: false, sandbox: false },
    account: live?.wallet ? String(live.wallet.account).slice(-4) : null,
  };
}

async function database(path: string, method = "GET", body?: unknown, key = serviceKey, prefer?: string) {
  const headers: Record<string, string> = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  if (prefer) headers.Prefer = prefer;
  const response = await fetch(`${project}/rest/v1/${path}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(9500), redirect: "error",
  });
  if (response.ok) return response.status === 204 ? null : await response.json();
  const problem = await response.json().catch(() => null);
  if (problem?.code === "P0001" && typeof problem.message === "string") {
    throw new RequestError(409, problem.message);
  }
  throw new RequestError(503, "Não foi possível acessar o registro de pagamentos.");
}

async function user(request: Request) {
  const token = request.headers.get("x-solar-session");
  if (!token || !/^[a-zA-Z0-9_-]{20,200}$/.test(token)) throw new RequestError(401, "Entre novamente no painel.");
  const result = await database("rpc/so_local_session", "POST", { p_token: token }, publicKey);
  if (!result?.ok || !uuid.test(result.user?.id)) throw new RequestError(401, "Entre novamente no painel.");
  if (!['admin', 'operator'].includes(result.user.role)) throw new RequestError(403, "Seu perfil não pode emitir cobranças.");
  return { id: result.user.id as string, admin: result.user.role === "admin" };
}

function decodeSecret(value: string | undefined) {
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new RequestError(503, "Emissão online ainda não habilitada.");
  return Uint8Array.from(value.match(/.{2}/g)!, pair => parseInt(pair, 16));
}

async function signingKey() {
  return await crypto.subtle.importKey("raw", decodeSecret(read("PAYMENTS_LINK_SECRET")),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function hex(value: ArrayBuffer) {
  return Array.from(new Uint8Array(value), v => v.toString(16).padStart(2, "0")).join("");
}

async function linkFor(id: string) {
  const signature = await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(`checkout:${id}`));
  return `${panel}/pagar.html#${id}.${hex(signature)}`;
}

async function proofId(proof: unknown) {
  const invalid = new RequestError(404, "Link de pagamento indisponível.");
  if (typeof proof !== "string" || proof.length !== 101) throw invalid;
  const [id, signature, extra] = proof.split(".");
  if (extra !== undefined || !uuid.test(id) || !/^[a-f0-9]{64}$/.test(signature)) throw invalid;
  const valid = await crypto.subtle.verify("HMAC", await signingKey(), decodeSecret(signature), encoder.encode(`checkout:${id}`));
  if (!valid) throw invalid;
  return id;
}

async function getCheckout(receivable: string): Promise<Checkout | null> {
  const list = await database(`so_online_checkouts?environment=eq.live&provider=eq.sicoob&receivable_id=eq.${receivable}&order=created_at.desc&limit=1`);
  return list[0] ?? null;
}

async function patch(checkout: Checkout, values: Json): Promise<Checkout> {
  const query = new URLSearchParams({ id: `eq.${checkout.id}`, updated_at: `eq.${checkout.updated_at}`, state: `eq.${checkout.state}` });
  const data = await database(`so_online_checkouts?${query}`, "PATCH", { ...values, updated_at: new Date().toISOString() }, serviceKey, "return=representation");
  if (data[0]) return data[0];
  const current = await database(`so_online_checkouts?id=eq.${checkout.id}&limit=1`);
  return current[0] ?? checkout;
}

async function panelCheckout(checkout: Checkout | null) {
  if (!checkout) return null;
  const open = checkout.state === "open" && Date.parse(checkout.expires_at) > Date.now();
  return {
    method: checkout.method, amount: checkout.amount_cents, expires: checkout.expires_at, state: checkout.state,
    link: open ? await linkFor(checkout.id) : null,
  };
}

async function publicCheckout(proof: unknown) {
  const id = await proofId(proof);
  const results = await database(`so_online_checkouts?id=eq.${id}&environment=eq.live&provider=eq.sicoob&limit=1`);
  const checkout: Checkout | undefined = results[0];
  if (!checkout) throw new RequestError(404, "Link de pagamento indisponível.");
  const active = checkout.state === "open" && Date.parse(checkout.expires_at) > Date.now();
  return {
    method: checkout.method, amount: checkout.amount_cents, expires: checkout.expires_at,
    state: active ? "open" : checkout.state === "open" ? "expired" : checkout.state,
    code: active ? checkout.provider_details.code : null,
    image: active && checkout.method === "pix" ? checkout.provider_details.image : null,
  };
}

async function issue(receivable: string, method: Method, body: Json, actor: string) {
  if (!status()[method].ready) throw new RequestError(503, "Esta forma ainda aguarda habilitação do Sicoob.");
  const previous = await getCheckout(receivable);
  if (previous && ["open", "review", "preparing"].includes(previous.state)) {
    if (previous.state === "preparing" && previous.method === "pix" && method === "pix") {
      return await finishIssue(previous, method, false, {});
    }
    return previous;
  }

  let payer: Json = {};
  let expires = new Date(Date.now() + 48 * 3_600_000).toISOString();
  if (method === "boleto") {
    const address = boletoAddress(object(body.address));
    if (!address) throw new RequestError(422, "Preencha o endereço completo do pagador.");
    const rows = await database(`so_receivables?select=due_date,so_contracts(so_clients(name,document))&id=eq.${receivable}&limit=1`);
    const current = rows[0];
    const document = current?.so_contracts?.so_clients && boletoPayer(current.so_contracts.so_clients);
    if (!document) throw new RequestError(422, "Confira o nome e o CPF/CNPJ no cadastro deste cliente.");
    if (typeof current.due_date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(current.due_date)) {
      throw new RequestError(422, "Preencha o vencimento da parcela antes de emitir o boleto.");
    }
    expires = `${current.due_date}T23:59:59-03:00`;
    payer = { ...document, ...address };
  }

  // Establish the provider client before reserving the payable amount.
  await bankFor("live").authenticate(method);
  const reservation = await database("rpc/so_reserve_online_checkout", "POST", {
    p_receivable_id: receivable, p_actor_id: actor, p_provider: "sicoob", p_environment: "live", p_method: method,
    p_max_installments: 1, p_expires_at: expires,
  });
  const checkout: Checkout = reservation.checkout;
  if (!reservation.created) return checkout;
  return await finishIssue(checkout, method, true, payer);
}

async function finishIssue(checkout: Checkout, method: Method, created: boolean, payer: Json) {
  const bank = bankFor("live");
  try {
    if (method === "boleto") {
      const result = await issueBoleto(checkout, bank, payer);
      return await patch(checkout, { state: "open", provider_checkout_id: result.id, provider_details: result.details, issue: null });
    }
    const result = await issuePix(checkout, bank, created);
    const image = await bank.pixImage(result.id).catch(() => null);
    return await patch(checkout, { state: "open", provider_checkout_id: result.id, provider_details: { ...result.details, image }, issue: null });
  } catch {
    // Never resend a boleto POST after an uncertain response. For Pix, only consult the original txid.
    throw new RequestError(502, "O Sicoob ainda não confirmou a emissão. Consulte a cobrança antes de tentar outra forma.");
  }
}

async function reconcile(checkout: Checkout, movement: Settlement) {
  await database("rpc/so_reconcile_online_payment", "POST", {
    p_checkout_id: checkout.id, p_provider: "sicoob", p_environment: checkout.environment,
    p_provider_payment_id: movement.reference, p_amount_cents: movement.cents, p_method: checkout.method,
    p_outcome: movement.outcome, p_provider_updated_at: movement.updatedAt, p_paid_at: movement.paidAt,
  });
  return await getCheckout(checkout.receivable_id!);
}

async function verify(checkout: Checkout) {
  if (!checkout.provider_checkout_id || !["open", "review", "paid"].includes(checkout.state)) return checkout;
  const bank = bankFor("live");
  if (checkout.method === "pix") {
    const result = await verifyPix(checkout, bank);
    if (!result) return checkout;
    if (typeof result !== "string") return await reconcile(checkout, result);
    return await patch(checkout, { state: result });
  }

  const result = await boletoState(checkout, bank);
  if (!result) return checkout;
  if (result !== "liquidated") return await patch(checkout, { state: result });

  // A paid status on its own only contains the nominal amount of the boleto.
  const details = checkout.provider_details;
  if (!Number.isSafeInteger(details.report_request)) {
    const report = await requestSettlementReport(bank);
    return await patch(checkout, { state: "review", provider_details: { ...details, report_request: report.request, report_day: report.day } });
  }
  const movements = await readSettlementReport(bank, { request: Number(details.report_request), day: String(details.report_day) });
  if (!movements) return checkout;
  const matches = movements.map(movement => matchBoletoSettlement(checkout, movement)).filter((value): value is Settlement => !!value);
  if (matches.length === 1) return await reconcile(checkout, matches[0]);
  // Request a new report on a different day. Keep reports with old or ambiguous movements in review.
  const today = bankDate(new Date());
  if (matches.length === 0 && typeof details.report_day === "string" && details.report_day < today) {
    const report = await requestSettlementReport(bank);
    return await patch(checkout, { state: "review", provider_details: { ...details, report_request: report.request, report_day: report.day } });
  }
  return checkout;
}

async function checkOne(receivable: string) {
  const checkout = await getCheckout(receivable);
  if (!checkout?.provider_checkout_id || !["open", "review", "paid"].includes(checkout.state)) return checkout;
  const now = new Date();
  const query = new URLSearchParams({ id: `eq.${checkout.id}`, next_sync_at: `lte.${now.toISOString()}` });
  const claimed = await database(`so_online_checkouts?${query}`, "PATCH",
    { next_sync_at: new Date(now.getTime() + 300_000).toISOString() }, serviceKey, "return=representation");
  if (!claimed[0]) throw new RequestError(429, "O Sicoob foi consultado recentemente. Aguarde alguns minutos para consultar de novo.");
  return await verify(claimed[0]);
}

async function sync(request: Request) {
  const expected = decodeSecret(read("PAYMENTS_SYNC_SECRET"));
  const supplied = request.headers.get("x-solar-payment-job");
  if (!supplied || !/^[a-f0-9]{64}$/.test(supplied) ||
      !timingSafeEqual(expected, decodeSecret(supplied))) throw new RequestError(403, "Acesso restrito ao agendador.");
  const checkouts: Checkout[] = await database("rpc/so_claim_online_payment_checks", "POST", {});
  let failures = 0;
  for (let i = 0; i < checkouts.length; i += 3) {
    const results = await Promise.allSettled(checkouts.slice(i, i + 3).map(verify));
    failures += results.filter(result => result.status === "rejected").length;
  }
  if (failures) console.warn(`Pagamentos Sicoob: ${failures} consulta(s) pendente(s) de nova tentativa.`);
  return { checked: checkouts.length, failures };
}

async function testConnection(method: Method) {
  const bank = bankFor("test");
  const end = new Date();
  const start = new Date(end.getTime() - 60_000);
  const dates = new URLSearchParams({ inicio: start.toISOString(), fim: end.toISOString() });
  if (method === "pix") await bank.json("pix", `/cob?${dates}`);
  else await bank.json("boleto", "/health");
  return { ok: true, mode: "test" };
}

async function requestBody(request: Request): Promise<Json> {
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Requisição inválida.");
  const input = new Uint8Array(4096);
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (size + value.length > input.length) {
      await reader.cancel();
      throw new RequestError(413, "Requisição excede o tamanho permitido.");
    }
    input.set(value, size);
    size += value.length;
  }
  try { return object(JSON.parse(new TextDecoder().decode(input.subarray(0, size)))); }
  catch { throw new RequestError(400, "Requisição inválida."); }
}

function json(body: unknown, httpStatus = 200): Response {
  return Response.json(body, { status: httpStatus, headers: {
    "Access-Control-Allow-Origin": panel, "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, x-solar-session", Vary: "Origin",
    "Cache-Control": "no-store, max-age=0", "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
  } });
}

Deno.serve(async request => {
  const origin = request.headers.get("origin");
  try {
    if (origin && origin !== panel) throw new RequestError(403, "Origem não autorizada.");
    if (request.method === "OPTIONS") return json({ ok: true });
    if (request.method !== "POST") return json({ error: "Método inválido." }, 405);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
      return json({ error: "Requisição inválida." }, 415);
    }
    const body = await requestBody(request);
    if (body.action === "public") return json(await publicCheckout(body.proof));
    if (body.action === "sync") return json(await sync(request));
    const actor = await user(request);
    const channels = status();
    if (body.action === "status") return json({ ...channels, account: actor.admin ? channels.account : null });
    const method = body.method;
    if (body.action === "test") {
      if (!actor.admin) throw new RequestError(403, "A configuração pertence à administração.");
      if (method !== "pix" && method !== "boleto") throw new RequestError(422, "Forma indisponível.");
      return json(await testConnection(method));
    }
    const id = body.receivable;
    if (typeof id !== "string" || !uuid.test(id)) throw new RequestError(422, "Selecione uma cobrança válida.");
    if (body.action === "lookup") return json({ checkout: await panelCheckout(await getCheckout(id)) });
    if (body.action === "check") return json({ checkout: await panelCheckout(await checkOne(id)) });
    if (body.action === "issue" && (method === "pix" || method === "boleto")) {
      return json({ checkout: await panelCheckout(await issue(id, method, body, actor.id)) });
    }
    throw new RequestError(400, "Ação inválida.");
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    if (error instanceof BankError) return json({ error: "O Sicoob ainda não confirmou a solicitação." }, 502);
    console.warn("Erro interno no serviço de recebimentos.");
    return json({ error: "Serviço de recebimentos temporariamente indisponível." }, 503);
  }
});

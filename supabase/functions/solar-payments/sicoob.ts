export type Method = "pix" | "boleto";
export type Environment = "test" | "live";
export type Json = Record<string, unknown>;
type ReadEnv = (name: string) => string | undefined;

const PRODUCTION = "https://api.sicoob.com.br";
const SANDBOX = "https://sandbox.sicoob.com.br/sicoob/sandbox";
const TOKEN_URL = "https://auth.sicoob.com.br/auth/realms/cooperado/protocol/openid-connect/token";
const SCOPES: Record<Method, string> = {
  pix: "cob.read cob.write pix.read",
  boleto: "boletos_inclusao boletos_consulta",
};

export class BankError extends Error {
  constructor(readonly status: number) {
    super("O Sicoob não confirmou a solicitação.");
  }
}

export function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BankError(502);
  return value as Json;
}

export function cents(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const match = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export function bankDate(value: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(value);
}

export function validTimestamp(value: unknown): value is string {
  return typeof value === "string" && /T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
}

export function decimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

function bankNumber(value: string | undefined): number | null {
  if (!value || !/^\d{1,15}$/.test(value) || Number(value) < 1) return null;
  return Number(value);
}

export type Wallet = { number: number; account: number; contract: number | null };
type Settings = {
  environment: Environment;
  clientId: string;
  pixKey: string | null;
  wallet: Wallet | null;
  credential: { cert: string; key: string } | { sandboxToken: string };
};

export function configuration(read: ReadEnv, environment: Environment): Settings | null {
  const prefix = environment === "live" ? "SICOOB_" : "SICOOB_SANDBOX_";
  const clientId = read(`${prefix}CLIENT_ID`)?.trim();
  if (!clientId || !/^[a-zA-Z0-9_-]{8,160}$/.test(clientId)) return null;
  let credential: Settings["credential"];
  if (environment === "test") {
    const sandboxToken = read(`${prefix}ACCESS_TOKEN`)?.trim();
    if (!sandboxToken || !/^[A-Za-z0-9._~+\/-]+=*$/.test(sandboxToken)) return null;
    credential = { sandboxToken };
  } else {
    const cert = read("SICOOB_CERT_PEM")?.replaceAll("\\n", "\n");
    const key = read("SICOOB_KEY_PEM")?.replaceAll("\\n", "\n");
    if (!cert?.includes("-----BEGIN CERTIFICATE-----") || !key?.includes("PRIVATE KEY-----")) return null;
    credential = { cert, key };
  }
  const pixKey = read(`${prefix}PIX_KEY`)?.trim() || null;
  const number = bankNumber(read(`${prefix}BENEFICIARY`));
  const account = bankNumber(read(`${prefix}ACCOUNT`));
  const rawContract = read(`${prefix}WALLET_CONTRACT`);
  const contract = bankNumber(rawContract);
  const wallet = account && number && (!rawContract || contract) ? { number, account, contract } : null;
  return { environment, clientId, pixKey, wallet, credential };
}

export type BankFetch = (url: string, init: RequestInit) => Promise<Response>;

export function createBank(config: Settings, transport?: BankFetch) {
  const credential = config.credential;
  const client = !transport && "cert" in credential ? Deno.createHttpClient(credential) : undefined;
  const send = transport ?? ((url: string, init: RequestInit) => fetch(url, { ...init, client }));
  const tokens = new Map<Method, { value: string; expires: number }>();
  const origin = config.environment === "live" ? PRODUCTION : SANDBOX;

  async function request(url: string, init: RequestInit) {
    const response = await send(url, { ...init, redirect: "error", signal: AbortSignal.timeout(9000) });
    if (!response.ok) {
      await response.body?.cancel().catch(() => undefined);
      throw new BankError(response.status);
    }
    return response;
  }

  async function token(method: Method): Promise<string> {
    if ("sandboxToken" in credential) return credential.sandboxToken;
    const existing = tokens.get(method);
    if (existing && existing.expires > Date.now()) return existing.value;
    const response = await request(TOKEN_URL, {
      method: "POST",
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: config.clientId, scope: SCOPES[method] }),
    });
    const data = object(await response.json());
    if (typeof data.access_token !== "string" || typeof data.expires_in !== "number" || data.expires_in <= 0) {
      throw new BankError(502);
    }
    tokens.set(method, { value: data.access_token, expires: Date.now() + (Math.min(data.expires_in, 300) - 30) * 1000 });
    return data.access_token;
  }

  async function call(method: Method, path: string, verb = "GET", body?: Json) {
    const base = method === "pix" ? "/pix/api/v2" : "/cobranca-bancaria/v3";
    const headers: Record<string, string> = { client_id: config.clientId, Authorization: `Bearer ${await token(method)}` };
    if (body) headers["Content-Type"] = "application/json";
    return await request(origin + base + path, { method: verb, headers, body: body && JSON.stringify(body) });
  }

  async function json(method: Method, path: string, verb = "GET", body?: Json): Promise<Json | null> {
    const response = await call(method, path, verb, body);
    return response.status === 204 ? null : object(await response.json());
  }

  return {
    config,
    json,
    authenticate: token,
    async pixImage(txid: string) {
      const response = await call("pix", `/cob/${txid}/imagem?largura=360`);
      if (response.headers.get("Content-Type")?.split(";")[0] !== "image/png") throw new BankError(502);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length > 160_000 || ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) {
        throw new BankError(502);
      }
      return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(""));
    },
  };
}

export type Bank = ReturnType<typeof createBank>;

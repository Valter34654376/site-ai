
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import {
  buildDpsFromJson,
  emitirNfse,
  consultarNfse,
  loadPfxFromBuffer,
  assertCertificateValidity,
  assertCertificateForProvider,
} from "@useinvio/nfse-sdk";

const app = express();
app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8788);
const DEFAULT_NFSE_ENV =
  process.env.NFSE_ENV === "producao" ? "producao" : "restrita";

const A1_PASSWORD_FROM_RENDER = process.env.NFSE_A1_PASSWORD || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://bdfojankowlfuezdhdjl.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";

const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN ||
  "https://solar-opara-gestao-v4.onrender.com";

// O certificado desbloqueado fica somente na memória do servidor.
// A senha permanece como variável protegida do Render.
let activeFiscalCertificate: any = null;
let restoringCertificate: Promise<any> | null = null;

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin === ALLOWED_ORIGIN) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, X-Solar-Session"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

function cleanDoc(v: any) {
  return String(v || "").replace(/\D/g, "");
}

function money(v: any) {
  const n = Number(v);

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("Valor da NFS-e inválido.");
  }

  return n.toFixed(2);
}

function nowBr() {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const g = (t: string) =>
    parts.find(x => x.type === t)?.value || "";

  return (
    `${g("year")}-${g("month")}-${g("day")}` +
    `T${g("hour")}:${g("minute")}:${g("second")}-03:00`
  );
}

async function session(req: express.Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Backend fiscal sem conexão com o banco.");
  }

  const token = String(req.headers["x-solar-session"] || "");

  if (!token) {
    throw new Error("Sessão ausente.");
  }

  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/so_local_session`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        authorization: `Bearer ${SUPABASE_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ p_token: token })
    }
  );

  if (!r.ok) {
    throw new Error("Sessão inválida.");
  }

  const data: any = await r.json();
  const user = data?.user;

  if (!data?.ok || !user?.id) {
    throw new Error("Sessão inválida.");
  }

  if (
    user.role !== "admin" &&
    !(user.role === "operator" && user.can_issue_nfse === true)
  ) {
    throw new Error("Usuário sem permissão fiscal.");
  }

  return { token, data, user };
}

async function sb(
  req: express.Request,
  path: string,
  init: RequestInit = {}
) {
  const { token } = await session(req);

  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      "x-solar-session": token,
      "content-type": "application/json",
      ...(init.headers || {})
    }
  });

  const txt = await r.text();

  if (!r.ok) {
    throw new Error(txt || `Erro Supabase ${r.status}`);
  }

  return txt ? JSON.parse(txt) : null;
}

async function certMaterial(req: express.Request) {
  const { token, user } = await session(req);

  if (user.role !== "admin") {
    throw new Error(
      "Somente administrador pode acessar o certificado A1."
    );
  }

  const material = await sb(
    req,
    "rpc/so_nfse_material",
    {
      method: "POST",
      body: JSON.stringify({ p_token: token })
    }
  );

  if (!material?.pfx_base64) {
    throw new Error(
      "Certificado A1 não encontrado no backend seguro."
    );
  }

  return material;
}

function validateMaterial(material: any, password: string) {
  const mat = loadPfxFromBuffer(
    Buffer.from(material.pfx_base64, "base64"),
    password
  );

  assertCertificateValidity(mat);
  assertCertificateForProvider(mat, "33958617000173");

  return mat;
}

function cachedCertificate() {
  if (!activeFiscalCertificate) {
    return null;
  }

  try {
    assertCertificateValidity(activeFiscalCertificate);
    assertCertificateForProvider(
      activeFiscalCertificate,
      "33958617000173"
    );

    return activeFiscalCertificate;
  } catch {
    activeFiscalCertificate = null;

    throw new Error(
      "O certificado A1 está vencido ou inválido."
    );
  }
}

// Restaura o certificado usando credenciais privadas do servidor.
// A senha e a chave de serviço nunca são enviadas ao navegador.
async function restoreA1FromServer() {
  const current = cachedCertificate();

  if (current) {
    return current;
  }

  if (!A1_PASSWORD_FROM_RENDER || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  if (restoringCertificate) {
    return restoringCertificate;
  }

  restoringCertificate = (async () => {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/so_nfse_service_material`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          authorization:
            `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "content-type": "application/json"
        },
        body: "{}"
      }
    );

    if (!r.ok) {
      throw new Error(
        "Não foi possível recuperar o A1 no Supabase."
      );
    }

    const material: any = await r.json();

    if (!material?.pfx_base64) {
      throw new Error(
        "Certificado A1 não encontrado no armazenamento privado."
      );
    }

    const mat = validateMaterial(
      material,
      A1_PASSWORD_FROM_RENDER
    );

    activeFiscalCertificate = mat;

    return mat;
  })();

  try {
    return await restoringCertificate;
  } finally {
    restoringCertificate = null;
  }
}

async function certificate(
  req: express.Request,
  password?: string
) {
  const { user } = await session(req);

  const cached = cachedCertificate();

  if (cached) {
    return cached;
  }

  // Restauração automática, inclusive para operador autorizado.
  if (A1_PASSWORD_FROM_RENDER && SUPABASE_SERVICE_ROLE_KEY) {
    const restored = await restoreA1FromServer();

    if (restored) {
      return restored;
    }
  }

  // Modo de compatibilidade: ativação pelo administrador.
  if (user.role !== "admin") {
    throw new Error(
      "A1 não restaurado no servidor. Verifique a configuração fiscal."
    );
  }

  const unlockPassword =
    A1_PASSWORD_FROM_RENDER || password;

  if (!unlockPassword) {
    throw new Error(
      "Configure NFSE_A1_PASSWORD no Render."
    );
  }

  const material = await certMaterial(req);
  const mat = validateMaterial(material, unlockPassword);

  activeFiscalCertificate = mat;

  return mat;
}

function fiscalEnvironment(fs: any) {
  return fs?.environment === "producao"
    ? "producao"
    : DEFAULT_NFSE_ENV;
}

async function getContext(
  req: express.Request,
  nfseId: string
) {
  const [nfRows, fsRows] = await Promise.all([
    sb(
      req,
      `so_nfse?id=eq.${encodeURIComponent(nfseId)}` +
      `&select=*,so_contracts(*,so_clients(*))`
    ),
    sb(req, "so_fiscal_settings?id=eq.1&select=*")
  ]);

  const nf = nfRows?.[0];
  const fs = fsRows?.[0];

  if (!nf) {
    throw new Error("NFS-e não encontrada.");
  }

  if (!fs) {
    throw new Error("Configuração fiscal não encontrada.");
  }

  return { nf, fs };
}

function fiscalErrors(nf: any, fs: any) {
  const c = nf.so_contracts || {};
  const cl = c.so_clients || {};
  const e: string[] = [];

  if (cleanDoc(fs.provider_cnpj).length !== 14) {
    e.push("CNPJ do prestador");
  }

  if (!/^\d{7}$/.test(String(fs.municipality_code || ""))) {
    e.push("código IBGE do município");
  }

  if (!String(fs.service_code || "").trim()) {
    e.push("código de tributação nacional do serviço");
  }

  if (!String(fs.dps_series || "").trim()) {
    e.push("série da DPS");
  }

  if (!String(fs.op_simp_nac || "").trim()) {
    e.push("opção pelo Simples Nacional");
  }

  if (!String(fs.reg_esp_trib || "").trim()) {
    e.push("regime especial de tributação");
  }

  if (!String(fs.trib_issqn || "").trim()) {
    e.push("tributação do ISSQN");
  }

  if (!String(fs.tp_ret_issqn || "").trim()) {
    e.push("retenção do ISSQN");
  }

  if (
    !String(
      nf.service_description ||
      fs.default_service_description ||
      ""
    ).trim()
  ) {
    e.push("descrição fiscal do serviço");
  }

  if (!(Number(nf.amount) > 0)) {
    e.push("valor da NFS-e");
  }

  if (!nf.competence_date) {
    e.push("data de competência");
  }

  const doc = cleanDoc(cl.document);

  if (doc && ![11, 14].includes(doc.length)) {
    e.push("CPF/CNPJ do tomador válido");
  }

  if (doc) {
    if (!nf.tomador_cep) e.push("CEP do tomador");
    if (!nf.tomador_city_code) e.push("código IBGE do município do tomador");
    if (!nf.tomador_street) e.push("logradouro do tomador");
    if (!nf.tomador_number) e.push("número do endereço do tomador");
    if (!nf.tomador_neighborhood) e.push("bairro do tomador");
  }

  if (fs.op_simp_nac === "1") {
    if (
      fs.tot_trib_fed == null ||
      fs.tot_trib_est == null ||
      fs.tot_trib_mun == null
    ) {
      e.push("percentuais de tributos aproximados");
    }
  } else if (fs.op_simp_nac === "2") {
    // MEI: indTotTrib = 0
  } else if (fs.op_simp_nac === "3") {
    if (
      fs.tot_trib_sn == null &&
      fiscalEnvironment(fs) === "producao"
    ) {
      e.push("percentual total do Simples Nacional");
    }
  } else if (fs.op_simp_nac) {
    e.push("opção Simples Nacional válida (1, 2 ou 3)");
  }

  return e;
}

function buildNota(nf: any, fs: any, nDps: number) {
  const c = nf.so_contracts || {};
  const cl = c.so_clients || {};
  const doc = cleanDoc(cl.document);

  const prestador: any = {
    cnpj: cleanDoc(fs.provider_cnpj),
    cLocEmi: String(fs.municipality_code),
    serie: String(fs.dps_series),
    opSimpNac: String(fs.op_simp_nac),
    regEspTrib: String(fs.reg_esp_trib)
  };

  if (fs.reg_ap_trib_sn) {
    prestador.regApTribSN = String(fs.reg_ap_trib_sn);
  }

  const servico: any = {
    cTribNac: String(nf.service_code || fs.service_code),
    xDescServ: String(
      nf.service_description ||
      fs.default_service_description
    ),
    cLocPrestacao: String(fs.municipality_code)
  };

  if (fs.nbs_code) {
    servico.cNBS = String(fs.nbs_code);
  }

  const emissao: any = {
    nDPS: String(nDps),
    dhEmi: nowBr(),
    dCompet: String(nf.competence_date),
    valores: {
      vServ: money(nf.amount)
    },
    tributacaoMunicipal: {
      tribISSQN: String(fs.trib_issqn),
      tpRetISSQN: String(fs.tp_ret_issqn)
    }
  };

  if (
    fs.iss_rate != null &&
    fs.op_simp_nac !== "1"
  ) {
    emissao.tributacaoMunicipal.pAliq =
      Number(fs.iss_rate).toFixed(2);
  }

  if (doc) {
    const tom: any = {
      xNome: String(cl.name || "").trim(),
      end: {
        endNac: {
          cMun: String(nf.tomador_city_code),
          CEP: cleanDoc(nf.tomador_cep)
        },
        xLgr: String(nf.tomador_street),
        nro: String(nf.tomador_number),
        xBairro: String(nf.tomador_neighborhood)
      }
    };

    if (doc.length === 14) {
      tom.CNPJ = doc;
    } else {
      tom.CPF = doc;
    }

    if (nf.tomador_complement) {
      tom.end.xCpl = String(nf.tomador_complement);
    }

    if (cl.phone) {
      tom.fone = cleanDoc(cl.phone);
    }

    if (cl.email) {
      tom.email = String(cl.email);
    }

    emissao.tomador = tom;
  }

  if (fs.piscofins_cst) {
    emissao.tributacaoFederal = {
      piscofins: {
        CST: String(fs.piscofins_cst)
      }
    };
  }

  if (fs.op_simp_nac === "1") {
    emissao.totTrib = {
      pTotTribFed: Number(fs.tot_trib_fed).toFixed(2),
      pTotTribEst: Number(fs.tot_trib_est).toFixed(2),
      pTotTribMun: Number(fs.tot_trib_mun).toFixed(2)
    };
  } else if (fs.op_simp_nac === "2") {
    emissao.totTrib = {
      indTotTrib: "0"
    };
  } else if (fs.op_simp_nac === "3") {
    emissao.totTrib = {
      pTotTribSN: Number(
        fs.tot_trib_sn ?? 0
      ).toFixed(2)
    };
  }

  return {
    ambiente: fiscalEnvironment(fs),
    prestador,
    servico,
    emissao
  };
}

const idSchema = z.string().uuid();

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    service: "solar-opara-fiscal-gateway",
    certificate: {
      automaticRecoveryConfigured: !!(
        A1_PASSWORD_FROM_RENDER &&
        SUPABASE_SERVICE_ROLE_KEY
      )
    },
    defaultEnvironment: DEFAULT_NFSE_ENV
  });
});

app.post("/v1/certificate/test", async (req, res) => {
  try {
    const { user } = await session(req);

    if (user.role !== "admin") {
      throw new Error(
        "Somente administrador pode validar o A1."
      );
    }

    const body = z.object({
      password: z.string().optional()
    }).parse(req.body || {});

    await certificate(req, body.password);

    res.json({
      ok: true,
      valid: true,
      cacheMinutes: null,
      automaticRecoveryConfigured: !!(
        A1_PASSWORD_FROM_RENDER &&
        SUPABASE_SERVICE_ROLE_KEY
      )
    });
  } catch (e: any) {
    res.status(422).json({
      ok: false,
      valid: false,
      error: e?.message || String(e)
    });
  }
});

app.get("/v1/certificate/status", async (req, res) => {
  try {
    await session(req);
  } catch (e: any) {
    return res.status(401).json({
      ok: false,
      active: false,
      error: e?.message || "Sessão inválida."
    });
  }

  try {
    const mat = await certificate(req);

    res.json({
      ok: true,
      active: !!mat,
      passwordRequired: false,
      cacheMinutes: null,
      automaticRecoveryConfigured: !!(
        A1_PASSWORD_FROM_RENDER &&
        SUPABASE_SERVICE_ROLE_KEY
      )
    });
  } catch (e: any) {
    res.json({
      ok: true,
      active: false,
      passwordRequired: !A1_PASSWORD_FROM_RENDER,
      cacheMinutes: null,
      automaticRecoveryConfigured: !!(
        A1_PASSWORD_FROM_RENDER &&
        SUPABASE_SERVICE_ROLE_KEY
      ),
      message: e?.message || "Certificado indisponível"
    });
  }
});

app.get("/v1/nfse/:id/status", async (req, res) => {
  try {
    await session(req);

    const { nf, fs } = await getContext(
      req,
      idSchema.parse(req.params.id)
    );

    const missing = fiscalErrors(nf, fs);

    let sessionActive = false;

    try {
      sessionActive = !!(await certificate(req));
    } catch {}

    res.json({
      ok: true,
      environment: fiscalEnvironment(fs),
      missing,
      ready: missing.length === 0,
      certificate: {
        stored: sessionActive,
        sessionActive,
        passwordRequired: !sessionActive
      },
      fiscalConfirmed: !!fs.confirmed_at
    });
  } catch (e: any) {
    res.status(400).json({
      ok: false,
      error: e?.message || String(e)
    });
  }
});

app.post("/v1/nfse/:id/preview", async (req, res) => {
  try {
    await session(req);

    const { nf, fs } = await getContext(
      req,
      idSchema.parse(req.params.id)
    );

    const missing = fiscalErrors(nf, fs);

    if (missing.length) {
      throw new Error(
        "Campos fiscais pendentes: " + missing.join(", ")
      );
    }

    const n = Number(fs.next_dps_number || 1);
    const nota = buildNota(nf, fs, n);

    const built: any = await buildDpsFromJson(
      nota as any
    );

    res.json({
      ok: true,
      dpsNumber: n,
      dpsId: built?.id || null,
      xml: built?.xml || built,
      environment: fiscalEnvironment(fs)
    });
  } catch (e: any) {
    res.status(422).json({
      ok: false,
      error: e?.message || String(e)
    });
  }
});

app.post("/v1/nfse/:id/emit", async (req, res) => {
  let id: string | undefined;
  let env = "restrita";
  let dpsNumber: number | undefined;

  try {
    const body = z.object({
      confirm: z.literal(true),
      password: z.string().optional()
    }).parse(req.body);

    const { token } = await session(req);

    id = idSchema.parse(req.params.id);

    const { nf, fs } = await getContext(req, id);

    env = fiscalEnvironment(fs);

    if (nf.status !== "ready") {
      throw new Error(
        "A NFS-e precisa estar com status PRONTA antes da emissão."
      );
    }

    const missing = fiscalErrors(nf, fs);

    if (missing.length) {
      throw new Error(
        "Campos fiscais pendentes: " + missing.join(", ")
      );
    }

    if (env === "producao" && !fs.confirmed_at) {
      throw new Error(
        "Produção bloqueada: confirme os parâmetros fiscais antes de emitir."
      );
    }

    const cert = await certificate(req, body.password);

    const nr = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/so_next_dps_number`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          authorization: `Bearer ${SUPABASE_KEY}`,
          "x-solar-session": token,
          "content-type": "application/json"
        },
        body: JSON.stringify({ p_token: token })
      }
    );

    if (!nr.ok) {
      throw new Error(
        "Falha ao reservar número da DPS."
      );
    }

    dpsNumber = Number(await nr.json());

    const nota = buildNota(nf, fs, dpsNumber);

    const result: any = await emitirNfse(
      nota as any,
      cert as any,
      { ambiente: env as any }
    );

    const key = String(
      result?.chaveAcesso || result?.chave || ""
    )
      .replace(/^NFS/i, "")
      .replace(/\s/g, "");

    const nfNumber = String(
      result?.numero || result?.nNFSe || ""
    );

    if (!/^[A-Za-z0-9]{50}$/.test(key)) {
      throw new Error(
        "Resposta sem chave válida de NFS-e (50 posições). " +
        "Consulte a DPS antes de tentar novamente."
      );
    }

    await sb(
      req,
      `so_nfse?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          status: "issued",
          access_key: key || null,
          number_key: key || nfNumber || null,
          nfse_number: nfNumber || null,
          issue_date: new Date().toISOString().slice(0, 10),
          environment: env,
          last_error: null,
          updated_at: new Date().toISOString()
        })
      }
    );

    await sb(req, "so_nfse_attempts", {
      method: "POST",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        nfse_id: id,
        environment: env,
        dps_number: dpsNumber,
        http_status: 200,
        success: true,
        response_excerpt: JSON.stringify({
          chaveAcesso: key,
          numero: nfNumber
        }).slice(0, 4000)
      })
    });

    res.json({
      ok: true,
      environment: env,
      dpsNumber,
      chaveAcesso: key,
      numero: nfNumber
    });
  } catch (e: any) {
    const msg = e?.message || String(e);

    if (id) {
      try {
        await sb(
          req,
          `so_nfse?id=eq.${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: {
              Prefer: "return=minimal"
            },
            body: JSON.stringify({
              status: "rejected",
              last_error: msg.slice(0, 4000),
              updated_at: new Date().toISOString()
            })
          }
        );

        await sb(req, "so_nfse_attempts", {
          method: "POST",
          headers: {
            Prefer: "return=minimal"
          },
          body: JSON.stringify({
            nfse_id: id,
            environment: env,
            dps_number: dpsNumber || null,
            success: false,
            response_excerpt: msg.slice(0, 4000)
          })
        });
      } catch {}
    }

    res.status(422).json({
      ok: false,
      error: msg
    });
  }
});

app.post("/v1/nfse/:id/consult", async (req, res) => {
  try {
    await session(req);

    const body = z.object({
      password: z.string().optional()
    }).parse(req.body || {});

    const id = idSchema.parse(req.params.id);

    const { nf, fs } = await getContext(req, id);

    const key = String(
      nf.access_key || nf.number_key || ""
    ).replace(/\D/g, "");

    if (!key) {
      throw new Error(
        "NFS-e ainda não possui chave de acesso."
      );
    }

    const result: any = await consultarNfse(
      key,
      await certificate(req, body.password),
      fiscalEnvironment(fs) as any
    );

    res.json({
      ok: true,
      result
    });
  } catch (e: any) {
    res.status(422).json({
      ok: false,
      error: e?.message || String(e)
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("Solar Opará Fiscal Gateway ativo.");

  if (A1_PASSWORD_FROM_RENDER && SUPABASE_SERVICE_ROLE_KEY) {
    void restoreA1FromServer()
      .then(() => {
        console.log("A1 restaurado automaticamente.");
      })
      .catch((e) => {
        console.error("Falha na restauração automática do A1:", e?.message || String(e));
        );
      });
  }
});

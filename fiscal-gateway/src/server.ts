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

const app=express();
app.disable("x-powered-by");
app.use(helmet({crossOriginResourcePolicy:false}));
app.use(express.json({limit:"1mb"}));

const PORT=Number(process.env.PORT||8788);
const DEFAULT_NFSE_ENV=process.env.NFSE_ENV==="producao"?"producao":"restrita";
const certCache=new Map<string,{mat:any,expires:number}>();
const SUPABASE_URL=process.env.SUPABASE_URL||"https://bdfojankowlfuezdhdjl.supabase.co";
const SUPABASE_KEY=process.env.SUPABASE_ANON_KEY||"sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
const ALLOWED_ORIGIN=process.env.ALLOWED_ORIGIN||"https://solar-opara-gestao-v4.onrender.com";

app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin===ALLOWED_ORIGIN) res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, X-Solar-Session");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  if(req.method==="OPTIONS") return res.sendStatus(204);
  next();
});

function cleanDoc(v:any){return String(v||"").replace(/\D/g,"");}
function money(v:any){const n=Number(v);if(!Number.isFinite(n)||n<=0)throw new Error("Valor da NFS-e inválido.");return n.toFixed(2);}
function nowBr(){
  const parts=new Intl.DateTimeFormat("sv-SE",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).formatToParts(new Date());
  const g=(t:string)=>parts.find(x=>x.type===t)?.value||"";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}:${g("second")}-03:00`;
}

async function session(req:express.Request){
  if(!SUPABASE_URL||!SUPABASE_KEY) throw new Error("Backend fiscal sem conexão com o banco.");
  const token=String(req.headers["x-solar-session"]||"");
  if(!token) throw new Error("Sessão ausente.");
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/so_local_session`,{
    method:"POST",
    headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${SUPABASE_KEY}`,"content-type":"application/json"},
    body:JSON.stringify({p_token:token})
  });
  if(!r.ok) throw new Error("Sessão inválida.");
  const data:any=await r.json();
  if(!data?.user_id||data?.role!=="admin") throw new Error("Somente administrador pode operar a emissão fiscal.");
  return {token,data};
}

async function sb(req:express.Request,path:string,init:RequestInit={}){
  const {token}=await session(req);
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{
    ...init,
    headers:{
      apikey:SUPABASE_KEY,
      authorization:`Bearer ${SUPABASE_KEY}`,
      "x-solar-session":token,
      "content-type":"application/json",
      ...(init.headers||{})
    }
  });
  const txt=await r.text();
  if(!r.ok) throw new Error(txt||`Erro Supabase ${r.status}`);
  return txt?JSON.parse(txt):null;
}

async function certMaterial(req:express.Request){
  const {token}=await session(req);
  const material=await sb(req,"rpc/so_nfse_material",{
    method:"POST",
    body:JSON.stringify({p_token:token})
  });
  if(!material?.pfx_base64) throw new Error("Certificado A1 não encontrado no backend seguro.");
  return material;
}

async function certificate(req:express.Request,password?:string){
  const {token}=await session(req);
  const cached=certCache.get(token);
  if(cached&&cached.expires>Date.now()) return cached.mat;
  if(!password) throw new Error("Informe a senha do certificado A1.");
  const material=await certMaterial(req);
  const mat=loadPfxFromBuffer(Buffer.from(material.pfx_base64,"base64"),password);
  assertCertificateValidity(mat);
  assertCertificateForProvider(mat,"33958617000173");
  certCache.set(token,{mat,expires:Date.now()+20*60*1000});
  return mat;
}

function fiscalEnvironment(fs:any){
  return fs?.environment==="producao"?"producao":DEFAULT_NFSE_ENV;
}

async function getContext(req:express.Request,nfseId:string){
  const [nfRows,fsRows]=await Promise.all([
    sb(req,`so_nfse?id=eq.${encodeURIComponent(nfseId)}&select=*,so_contracts(*,so_clients(*))`),
    sb(req,"so_fiscal_settings?id=eq.1&select=*")
  ]);
  const nf=nfRows?.[0],fs=fsRows?.[0];
  if(!nf) throw new Error("NFS-e não encontrada.");
  if(!fs) throw new Error("Configuração fiscal não encontrada.");
  return {nf,fs};
}

function fiscalErrors(nf:any,fs:any){
  const c=nf.so_contracts||{},cl=c.so_clients||{};
  const e:string[]=[];
  if(cleanDoc(fs.provider_cnpj).length!==14)e.push("CNPJ do prestador");
  if(!/^\d{7}$/.test(String(fs.municipality_code||"")))e.push("código IBGE do município");
  if(!String(fs.service_code||"").trim())e.push("código de tributação nacional do serviço");
  if(!String(fs.dps_series||"").trim())e.push("série da DPS");
  if(!String(fs.op_simp_nac||"").trim())e.push("opção pelo Simples Nacional");
  if(!String(fs.reg_esp_trib||"").trim())e.push("regime especial de tributação");
  if(!String(fs.trib_issqn||"").trim())e.push("tributação do ISSQN");
  if(!String(fs.tp_ret_issqn||"").trim())e.push("retenção do ISSQN");
  if(!String(nf.service_description||fs.default_service_description||"").trim())e.push("descrição fiscal do serviço");
  if(!(Number(nf.amount)>0))e.push("valor da NFS-e");
  if(!nf.competence_date)e.push("data de competência");
  const doc=cleanDoc(cl.document);
  if(doc&&![11,14].includes(doc.length))e.push("CPF/CNPJ do tomador válido");
  if(doc){
    if(!nf.tomador_cep)e.push("CEP do tomador");
    if(!nf.tomador_city_code)e.push("código IBGE do município do tomador");
    if(!nf.tomador_street)e.push("logradouro do tomador");
    if(!nf.tomador_number)e.push("número do endereço do tomador");
    if(!nf.tomador_neighborhood)e.push("bairro do tomador");
  }
  if(fs.op_simp_nac==="1"){
    if(fs.tot_trib_fed==null||fs.tot_trib_est==null||fs.tot_trib_mun==null)e.push("percentuais de tributos aproximados");
  }else if(fs.op_simp_nac==="2"){
    // MEI usa indTotTrib=0.
  }else if(fs.op_simp_nac==="3"){
    if(fs.tot_trib_sn==null)e.push("percentual total do Simples Nacional");
  }else if(fs.op_simp_nac)e.push("opção Simples Nacional válida (1, 2 ou 3)");
  return e;
}

function buildNota(nf:any,fs:any,nDps:number){
  const c=nf.so_contracts||{},cl=c.so_clients||{};
  const doc=cleanDoc(cl.document);
  const prestador:any={
    cnpj:cleanDoc(fs.provider_cnpj),
    cLocEmi:String(fs.municipality_code),
    serie:String(fs.dps_series),
    opSimpNac:String(fs.op_simp_nac),
    regEspTrib:String(fs.reg_esp_trib)
  };
  if(fs.reg_ap_trib_sn) prestador.regApTribSN=String(fs.reg_ap_trib_sn);
  const servico:any={
    cTribNac:String(nf.service_code||fs.service_code),
    xDescServ:String(nf.service_description||fs.default_service_description),
    cLocPrestacao:String(fs.municipality_code)
  };
  if(fs.nbs_code)servico.cNBS=String(fs.nbs_code);
  const emissao:any={
    nDPS:String(nDps),
    dhEmi:nowBr(),
    dCompet:String(nf.competence_date),
    valores:{vServ:money(nf.amount)},
    tributacaoMunicipal:{
      tribISSQN:String(fs.trib_issqn),
      tpRetISSQN:String(fs.tp_ret_issqn)
    }
  };
  if(fs.iss_rate!=null&&fs.op_simp_nac!=="1")emissao.tributacaoMunicipal.pAliq=Number(fs.iss_rate).toFixed(2);
  if(doc){
    const tom:any={
      xNome:String(cl.name||"").trim(),
      end:{
        endNac:{cMun:String(nf.tomador_city_code),CEP:cleanDoc(nf.tomador_cep)},
        xLgr:String(nf.tomador_street),
        nro:String(nf.tomador_number),
        xBairro:String(nf.tomador_neighborhood)
      }
    };
    if(doc.length===14)tom.CNPJ=doc;else tom.CPF=doc;
    if(nf.tomador_complement)tom.end.xCpl=String(nf.tomador_complement);
    if(cl.phone)tom.fone=cleanDoc(cl.phone);
    if(cl.email)tom.email=String(cl.email);
    emissao.tomador=tom;
  }
  if(fs.piscofins_cst)emissao.tributacaoFederal={piscofins:{CST:String(fs.piscofins_cst)}};
  if(fs.op_simp_nac==="1")emissao.totTrib={
    pTotTribFed:Number(fs.tot_trib_fed).toFixed(2),
    pTotTribEst:Number(fs.tot_trib_est).toFixed(2),
    pTotTribMun:Number(fs.tot_trib_mun).toFixed(2)
  };
  else if(fs.op_simp_nac==="2")emissao.totTrib={indTotTrib:"0"};
  else if(fs.op_simp_nac==="3")emissao.totTrib={pTotTribSN:Number(fs.tot_trib_sn).toFixed(2)};
  return {ambiente:fiscalEnvironment(fs),prestador,servico,emissao};
}

const idSchema=z.string().uuid();
app.get("/health",async(_req,res)=>{
  let cert={configured:!!PFX_BASE64,passwordConfigured:!!PFX_PASSWORD,valid:false,error:null as string|null};
  if(PFX_BASE64&&PFX_PASSWORD){try{pfx();cert.valid=true}catch(e:any){cert.error=e?.message||String(e)}}
  res.json({ok:true,service:"solar-opara-fiscal-gateway",environment:NFSE_ENV,certificate:cert});
});

app.get("/v1/nfse/:id/status",async(req,res)=>{
  try{
    await session(req);
    const {nf,fs}=await getContext(req,idSchema.parse(req.params.id));
    const missing=fiscalErrors(nf,fs);
    let cert:any={configured:!!PFX_BASE64,passwordConfigured:!!PFX_PASSWORD,valid:false};
    if(PFX_BASE64&&PFX_PASSWORD){try{pfx();cert.valid=true}catch(e:any){cert.error=e?.message||String(e)}}
    res.json({ok:true,environment:NFSE_ENV,missing,ready:missing.length===0&&cert.valid,certificate:cert,fiscalConfirmed:!!fs.confirmed_at});
  }catch(e:any){res.status(400).json({ok:false,error:e?.message||String(e)})}
});

app.post("/v1/nfse/:id/preview",async(req,res)=>{
  try{
    await session(req);
    const {nf,fs}=await getContext(req,idSchema.parse(req.params.id));
    const missing=fiscalErrors(nf,fs);if(missing.length)throw new Error("Campos fiscais pendentes: "+missing.join(", "));
    const n=Number(fs.next_dps_number||1);
    const nota=buildNota(nf,fs,n);
    const built:any=await buildDpsFromJson(nota as any);
    res.json({ok:true,dpsNumber:n,dpsId:built?.id||null,xml:built?.xml||built,environment:NFSE_ENV});
  }catch(e:any){res.status(422).json({ok:false,error:e?.message||String(e)})}
});

app.post("/v1/nfse/:id/emit",async(req,res)=>{
  try{
    const body=z.object({confirm:z.literal(true)}).parse(req.body);
    void body;
    const {token}=await session(req);
    const id=idSchema.parse(req.params.id);
    const {nf,fs}=await getContext(req,id);
    if(nf.status!=="ready")throw new Error("A NFS-e precisa estar com status PRONTA antes da emissão.");
    const missing=fiscalErrors(nf,fs);if(missing.length)throw new Error("Campos fiscais pendentes: "+missing.join(", "));
    if(NFSE_ENV==="producao"&&!fs.confirmed_at)throw new Error("Produção bloqueada: configuração fiscal não confirmada.");
    const cert=pfx();
    const n=await (async()=>{
      const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/so_next_dps_number`,{
        method:"POST",headers:{apikey:SUPABASE_KEY,authorization:`Bearer ${SUPABASE_KEY}`,"content-type":"application/json"},
        body:JSON.stringify({p_token:token})
      });if(!r.ok)throw new Error("Falha ao reservar número da DPS.");return Number(await r.json());
    })();
    const nota=buildNota(nf,fs,n);
    const result:any=await emitirNfse(nota as any,cert as any,{ambiente:NFSE_ENV as any});
    const key=String(result?.chaveAcesso||result?.chave||"");
    const nfNumber=String(result?.numero||result?.nNFSe||"");
    await sb(req,`so_nfse?id=eq.${encodeURIComponent(id)}`,{
      method:"PATCH",
      headers:{Prefer:"return=minimal"},
      body:JSON.stringify({status:"issued",access_key:key||null,number_key:key||nfNumber||null,nfse_number:nfNumber||null,issue_date:new Date().toISOString().slice(0,10),environment:NFSE_ENV,last_error:null,updated_at:new Date().toISOString()})
    });
    await sb(req,"so_nfse_attempts",{
      method:"POST",headers:{Prefer:"return=minimal"},
      body:JSON.stringify({nfse_id:id,environment:NFSE_ENV,dps_number:n,http_status:200,success:true,response_excerpt:JSON.stringify({chaveAcesso:key,numero:nfNumber}).slice(0,4000)})
    });
    res.json({ok:true,environment:NFSE_ENV,dpsNumber:n,chaveAcesso:key,numero:nfNumber});
  }catch(e:any){
    const msg=e?.message||String(e);
    res.status(422).json({ok:false,error:msg});
  }
});

app.get("/v1/nfse/:id/consult",async(req,res)=>{
  try{
    await session(req);const id=idSchema.parse(req.params.id);
    const {nf}=await getContext(req,id);
    const key=String(nf.access_key||nf.number_key||"").replace(/\D/g,"");
    if(!key)throw new Error("NFS-e ainda não possui chave de acesso.");
    const result:any=await consultarNfse(key,pfx() as any,NFSE_ENV as any);
    res.json({ok:true,result});
  }catch(e:any){res.status(422).json({ok:false,error:e?.message||String(e)})}
});

app.listen(PORT,"0.0.0.0",()=>console.log("Solar Opará Fiscal Gateway ativo."));
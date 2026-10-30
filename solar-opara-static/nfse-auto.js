(()=>{
const S="https://bdfojankowlfuezdhdjl.supabase.co";
const K="sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
const G="https://solar-opara-nfse-api7.onrender.com";
let busy=false,certOk=false;
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const token=()=>localStorage.getItem("solar_session")||"";
const money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateBR=v=>v?new Date(String(v).slice(0,10)+"T12:00:00").toLocaleDateString("pt-BR"):"—";
async function rest(path,opt={}){
 const r=await fetch(S+path,{...opt,headers:{apikey:K,"x-solar-session":token(),"content-type":"application/json",...(opt.headers||{})}});
 const t=await r.text();if(!r.ok)throw Error(t||"Falha no banco");return t?JSON.parse(t):null;
}
async function gw(path,opt={}){
 const r=await fetch(G+path,{...opt,headers:{"content-type":"application/json","x-solar-session":token(),...(opt.headers||{})}});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||"Falha na integração fiscal");return j;
}
async function session(){
 return rest("/rest/v1/rpc/so_local_session",{method:"POST",body:JSON.stringify({p_token:token()})});
}
const total=c=>Number(c?.rental_value||0)+Number(c?.cleaning_fee||0)+Number(c?.additional_value||0);
const label=s=>({draft:"RASCUNHO",ready:"PRONTA",issued:"EMITIDA",rejected:"REJEITADA",error:"ERRO",cancelled:"CANCELADA"})[s]||String(s||"").toUpperCase();
const badge=s=>s==="issued"?"paid":s==="ready"?"ready":s==="rejected"||s==="error"?"late":"";
const val=(o,k)=>o?.[k]??"";
const num=v=>v===""||v==null?null:Number(v);
function fiscalForm(fs){
 const sel=(v,x)=>String(v??"")===String(x)?" selected":"";
 return `<div class="card"><div class="top"><div><div class="page-kicker">Configuração</div><h2>Parâmetros fiscais</h2><p class="muted">O código nacional 030301 corresponde à exploração de salão de festas para eventos. Revise o enquadramento tributário antes da produção.</p></div></div>
 <form id="nfa-fiscal" class="form">
 <label>CNPJ<input value="33.958.617/0001-73" disabled></label><label>Município<input value="Pirapora/MG · 3151206" disabled></label>
 <label>Inscrição municipal<input name="municipal_registration" value="${esc(val(fs,"municipal_registration"))}"></label>
 <label>Série DPS<input name="dps_series" required value="${esc(val(fs,"dps_series")||"1601")}"></label>
 <label>Código nacional<input name="service_code" required value="${esc(val(fs,"service_code")||"030301")}"></label>
 <label>NBS (se aplicável)<input name="nbs_code" value="${esc(val(fs,"nbs_code"))}"></label>
 <label>Simples Nacional<select name="op_simp_nac" required><option value="">Selecione</option><option value="1"${sel(fs.op_simp_nac,1)}>1 — Não optante</option><option value="2"${sel(fs.op_simp_nac,2)}>2 — MEI</option><option value="3"${sel(fs.op_simp_nac,3)}>3 — Simples ME/EPP</option></select></label>
 <label>Regime apuração SN<select name="reg_ap_trib_sn"><option value="">Não se aplica</option><option value="1"${sel(fs.reg_ap_trib_sn,1)}>1 — Federais e ISS pelo Simples</option><option value="2"${sel(fs.reg_ap_trib_sn,2)}>2 — Federais pelo Simples, ISS fora</option><option value="3"${sel(fs.reg_ap_trib_sn,3)}>3 — Tributos fora do Simples</option></select></label>
 <label>Regime especial<select name="reg_esp_trib"><option value="0"${sel(fs.reg_esp_trib,0)}>0 — Nenhum</option><option value="1"${sel(fs.reg_esp_trib,1)}>1 — Ato cooperado</option><option value="2"${sel(fs.reg_esp_trib,2)}>2 — Estimativa</option><option value="3"${sel(fs.reg_esp_trib,3)}>3 — Microempresa municipal</option><option value="4"${sel(fs.reg_esp_trib,4)}>4 — Notário/registrador</option><option value="5"${sel(fs.reg_esp_trib,5)}>5 — Autônomo</option><option value="6"${sel(fs.reg_esp_trib,6)}>6 — Sociedade de profissionais</option></select></label>
 <label>ISSQN<select name="trib_issqn"><option value="1"${sel(fs.trib_issqn,1)}>1 — Operação tributável</option><option value="2"${sel(fs.trib_issqn,2)}>2 — Imunidade</option><option value="3"${sel(fs.trib_issqn,3)}>3 — Exportação</option><option value="4"${sel(fs.trib_issqn,4)}>4 — Não incidência</option></select></label>
 <label>Retenção ISSQN<select name="tp_ret_issqn"><option value="1"${sel(fs.tp_ret_issqn,1)}>1 — Não retido</option><option value="2"${sel(fs.tp_ret_issqn,2)}>2 — Retido pelo tomador</option><option value="3"${sel(fs.tp_ret_issqn,3)}>3 — Retido pelo intermediário</option></select></label>
 <label>Alíquota ISS (%)<input name="iss_rate" type="number" step=".01" value="${esc(val(fs,"iss_rate"))}"></label>
 <label>Alíquota nominal Simples (%)<input name="tot_trib_sn" type="number" step=".01" value="${esc(val(fs,"tot_trib_sn"))}"></label>
 <label>Tributos federais aprox. (%)<input name="tot_trib_fed" type="number" step=".01" value="${esc(val(fs,"tot_trib_fed"))}"></label>
 <label>Tributos estaduais aprox. (%)<input name="tot_trib_est" type="number" step=".01" value="${esc(val(fs,"tot_trib_est"))}"></label>
 <label>Tributos municipais aprox. (%)<input name="tot_trib_mun" type="number" step=".01" value="${esc(val(fs,"tot_trib_mun"))}"></label>
 <label>CST PIS/COFINS (opcional)<input name="piscofins_cst" value="${esc(val(fs,"piscofins_cst"))}"></label>
 <label>Ambiente<select name="environment"><option value="restrita"${sel(fs.environment,"restrita")}>Teste / produção restrita</option><option value="producao"${sel(fs.environment,"producao")}>Produção — efeito fiscal</option></select></label>
 <label class="full">Descrição padrão<textarea name="default_service_description">${esc(val(fs,"default_service_description")||"Exploração de salão de festas e espaço para realização de eventos.")}</textarea></label>
 <div class="full row"><button class="btn">Salvar parâmetros</button><button type="button" class="btn gray" id="nfa-confirm">Confirmar configuração</button></div>
 </form></div>`;
}
function draftForm(n,fs){
 const c=n.so_contracts||{},cl=c.so_clients||{},amount=n.amount??total(c),comp=n.competence_date||c.event_date||"";
 return `<div class="card"><div class="top"><div><h2>Dados da NFS-e</h2><p class="muted">Informações enviadas ao Ambiente Nacional.</p></div><button class="btn gray" id="nfa-close">Fechar</button></div>
 <div class="nf-party"><div><span>Tomador</span><b>${esc(cl.name||"—")}</b></div><div><span>CPF/CNPJ</span><b>${esc(cl.document||"—")}</b></div><div><span>E-mail</span><b>${esc(cl.email||"—")}</b></div><div><span>Evento</span><b>${esc(c.event_name||"—")}</b></div></div>
 <form id="nfa-draft" class="form"><input type="hidden" name="id" value="${n.id}">
 <label>Competência<input type="date" name="competence_date" required value="${esc(comp)}"></label>
 <label>Valor<input type="number" step=".01" min=".01" name="amount" required value="${Number(amount||0).toFixed(2)}"></label>
 <label class="full">Descrição do serviço<textarea name="service_description" required>${esc(n.service_description||fs.default_service_description||"")}</textarea></label>
 <label>Código nacional<input name="service_code" required value="${esc(n.service_code||fs.service_code||"030301")}"></label>
 <label>CEP do tomador<input name="tomador_cep" inputmode="numeric" value="${esc(n.tomador_cep||"")}"></label>
 <label>Código IBGE município<input name="tomador_city_code" inputmode="numeric" value="${esc(n.tomador_city_code||"")}"></label>
 <label>Logradouro<input name="tomador_street" value="${esc(n.tomador_street||"")}"></label>
 <label>Número<input name="tomador_number" value="${esc(n.tomador_number||"")}"></label>
 <label>Bairro<input name="tomador_neighborhood" value="${esc(n.tomador_neighborhood||"")}"></label>
 <label>Complemento<input name="tomador_complement" value="${esc(n.tomador_complement||"")}"></label>
 <label class="full">Observações internas<textarea name="notes">${esc(n.notes||"")}</textarea></label>
 <div class="full row"><button class="btn gray" name="intent" value="draft">Salvar rascunho</button><button class="btn" name="intent" value="ready">Marcar como pronta</button></div></form></div>`;
}
async function render(){
 if(busy)return;
 const main=$(".main"),h=main?.querySelector("h1");
 if(!main||!h||h.textContent.trim()!=="NFS-e"||main.dataset.nfseAuto==="1")return;
 busy=true;
 try{
  const [sess,rows,fsRows]=await Promise.all([
   session(),
   rest("/rest/v1/so_nfse?select=*,so_contracts(event_name,event_date,rental_value,cleaning_fee,additional_value,so_clients(name,email,document,address,phone))&order=created_at.desc"),
   rest("/rest/v1/so_fiscal_settings?id=eq.1&select=*")
  ]);
  const fs=fsRows?.[0]||{},admin=sess?.user?.role==="admin",env=fs.environment==="producao"?"PRODUÇÃO":"TESTE / PRODUÇÃO RESTRITA";
  window.__nfaRows=rows||[];window.__nfaFs=fs;
  const draft=(rows||[]).filter(x=>x.status==="draft").length,ready=(rows||[]).filter(x=>x.status==="ready").length,issued=(rows||[]).filter(x=>(x.status==="issued"&&x.environment==="producao")).length,issuedValue=(rows||[]).filter(x=>x.status==="issued").reduce((a,x)=>a+Number(x.amount||0),0);
  main.dataset.nfseAuto="1";
  main.innerHTML=`<style>.nf-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:14px 0}.nf-kpis .card{margin:0}.nf-kpis span{display:block;color:#817c72;font-size:12px}.nf-kpis b{display:block;font-size:25px;margin-top:5px}.nf-party{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:8px 0 18px}.nf-party>div{background:#faf7f1;border:1px solid #e8dfd2;border-radius:10px;padding:10px}.nf-party span{display:block;color:#888277;font-size:11px;text-transform:uppercase}.nf-actions{display:flex;gap:6px;flex-wrap:wrap}.badge.ready{background:#fff1c9;color:#7a5311}.badge.late{background:#fde0dc;color:#9b3025}.nf-num{font-family:ui-monospace,Consolas,monospace;font-size:12px;word-break:break-all}.nfa-cert{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.nfa-cert label{flex:1;min-width:220px}@media(max-width:850px){.nf-kpis,.nf-party{grid-template-columns:1fr 1fr}}</style>
  <div class="top"><div><div class="page-kicker">Fiscal automático</div><h1>NFS-e</h1><p class="muted">Emissão integrada ao Ambiente Nacional usando o A1 no backend.</p></div></div>
  <div class="card"><b>API fiscal conectada · ${env}</b><br><span class="muted">Certificado guardado no backend privado. A senha só fica na sessão fiscal temporária.</span></div>
  ${admin?`<div class="card"><h2>Ativar A1</h2><div class="nfa-cert"><label>Senha do certificado<input id="nfa-pass" type="password" autocomplete="off"></label><button class="btn" id="nfa-test">Validar A1</button><span id="nfa-cert-state" class="muted">${certOk?"A1 validado nesta sessão.":"Ainda não validado nesta sessão."}</span></div></div>`:""}
  <div class="nf-kpis"><div class="card"><span>Rascunhos</span><b>${draft}</b></div><div class="card"><span>Prontas</span><b>${ready}</b></div><div class="card"><span>Emitidas</span><b>${issued}</b></div><div class="card"><span>Valor emitido</span><b>${money(issuedValue)}</b></div></div>
  ${admin?fiscalForm(fs):""}
  <div class="card"><h2>Notas e rascunhos</h2>${rows?.length?`<div style="overflow:auto"><table><tr><th>Evento</th><th>Tomador</th><th>Competência</th><th>Valor</th><th>Status</th><th>NFS-e / chave</th><th>Ações</th></tr>${rows.map(x=>{const c=x.so_contracts||{},cl=c.so_clients||{},amount=x.amount??total(c),comp=x.competence_date||c.event_date||"",emit=fs.environment==="producao"?"Emitir NFS-e":"Emitir teste";return `<tr><td><b>${esc(c.event_name||"—")}</b></td><td>${esc(cl.name||"—")}<br><span class="muted">${esc(cl.document||"CPF/CNPJ não informado")}</span></td><td>${dateBR(comp)}</td><td>${money(amount)}</td><td><span class="badge ${badge(x.status)}">${label(x.status)}</span>${x.last_error?`<br><small class="muted">${esc(x.last_error).slice(0,100)}</small>`:""}</td><td><span class="nf-num">${esc(x.nfse_number||"—")}</span>${x.access_key?`<br><span class="muted nf-num">${esc(x.access_key)}</span>`:""}</td><td><div class="nf-actions">${x.status!=="issued"?`<button class="btn small gray" data-edit="${x.id}">Editar</button><button class="btn small gray" data-preview="${x.id}">Validar DPS</button>${x.status==="ready"?`<button class="btn small" data-emit="${x.id}">${emit}</button>`:""}`:`<button class="btn small gray" data-consult="${x.id}">Consultar API</button>`}</div></td></tr>`}).join("")}</table></div>`:'<div class="empty">Nenhuma NFS-e.</div>'}</div><div id="nfa-form"></div>`;
  bind(admin,fs,sess);
 }catch(e){main.insertAdjacentHTML("afterbegin",`<div class="warnbox">${esc(e.message)}</div>`)}
 finally{busy=false}
}
function find(id){return (window.__nfaRows||[]).find(x=>String(x.id)===String(id))}
function bind(admin,fs,sess){
 if($("#nfa-test"))$("#nfa-test").onclick=async()=>{const p=$("#nfa-pass").value;if(!p)return alert("Informe a senha do certificado.");const b=$("#nfa-test");b.disabled=true;b.textContent="Validando...";try{await gw("/v1/certificate/test",{method:"POST",body:JSON.stringify({password:p})});certOk=true;$("#nfa-pass").value="";$("#nfa-cert-state").textContent="A1 validado. Sessão fiscal ativa por 20 minutos.";b.textContent="A1 validado"}catch(e){alert(e.message);b.disabled=false;b.textContent="Validar A1"}};
 if($("#nfa-fiscal"))$("#nfa-fiscal").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),o={};for(const [k,v] of f.entries())o[k]=String(v).trim()===""?null:String(v).trim();["iss_rate","tot_trib_sn","tot_trib_fed","tot_trib_est","tot_trib_mun"].forEach(k=>o[k]=num(o[k]));o.confirmed_at=null;o.confirmed_by=null;o.updated_at=new Date().toISOString();await rest("/rest/v1/so_fiscal_settings?id=eq.1",{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(o)});alert("Parâmetros salvos. Confirme a configuração antes da produção.");refresh()};
 if($("#nfa-confirm"))$("#nfa-confirm").onclick=async()=>{if(!confirm("Confirmar que os parâmetros fiscais foram revisados e estão corretos?"))return;await rest("/rest/v1/so_fiscal_settings?id=eq.1",{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({confirmed_at:new Date().toISOString(),confirmed_by:sess.user?.id||null,updated_at:new Date().toISOString()})});alert("Configuração fiscal confirmada.");refresh()};
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const n=find(b.dataset.edit);$("#nfa-form").innerHTML=draftForm(n,fs);$("#nfa-form").scrollIntoView({behavior:"smooth"});$("#nfa-close").onclick=()=>$("#nfa-form").innerHTML="";$("#nfa-draft").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),id=f.get("id"),intent=e.submitter?.value||"draft",o={competence_date:f.get("competence_date"),amount:Number(f.get("amount")||0),service_description:String(f.get("service_description")||"").trim(),service_code:String(f.get("service_code")||"").trim(),tomador_cep:String(f.get("tomador_cep")||"").trim()||null,tomador_city_code:String(f.get("tomador_city_code")||"").trim()||null,tomador_street:String(f.get("tomador_street")||"").trim()||null,tomador_number:String(f.get("tomador_number")||"").trim()||null,tomador_neighborhood:String(f.get("tomador_neighborhood")||"").trim()||null,tomador_complement:String(f.get("tomador_complement")||"").trim()||null,notes:String(f.get("notes")||"").trim(),status:intent==="ready"?"ready":"draft",last_error:null,updated_at:new Date().toISOString()};await rest("/rest/v1/so_nfse?id=eq."+id,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(o)});alert(o.status==="ready"?"NFS-e pronta para validar/emissão.":"Rascunho salvo.");refresh()}});
 document.querySelectorAll("[data-preview]").forEach(b=>b.onclick=async()=>{const btn=b;btn.disabled=true;btn.textContent="Validando...";try{const r=await gw("/v1/nfse/"+b.dataset.preview+"/preview",{method:"POST",body:"{}"});alert("DPS válida no ambiente "+r.environment+". Número previsto: "+r.dpsNumber)}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent="Validar DPS"}});
 document.querySelectorAll("[data-emit]").forEach(b=>b.onclick=async()=>{const prod=fs.environment==="producao";const msg=prod?"ATENÇÃO: isto enviará uma NFS-e REAL ao Ambiente Nacional e terá efeito fiscal. Confirmar emissão?":"Emitir uma NFS-e de TESTE no ambiente restrito?";if(!confirm(msg))return;const btn=b;btn.disabled=true;btn.textContent="Emitindo...";try{const r=await gw("/v1/nfse/"+b.dataset.emit+"/emit",{method:"POST",body:JSON.stringify({confirm:true})});alert((prod?"NFS-e emitida.":"Teste emitido.")+" Chave: "+(r.chaveAcesso||"retornada pelo ambiente"));refresh()}catch(e){alert(e.message);btn.disabled=false;btn.textContent=prod?"Emitir NFS-e":"Emitir teste"}});
 document.querySelectorAll("[data-consult]").forEach(b=>b.onclick=async()=>{const btn=b;btn.disabled=true;btn.textContent="Consultando...";try{const r=await gw("/v1/nfse/"+b.dataset.consult+"/consult",{method:"POST",body:"{}"});alert("Consulta realizada com sucesso. A NFS-e foi localizada no Ambiente Nacional.")}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent="Consultar API"}});
}
function refresh(){const m=$(".main");if(m){m.dataset.nfseAuto="";}setTimeout(render,0)}
new MutationObserver(()=>{const h=$(".main h1");if(h&&h.textContent.trim()==="NFS-e"&&$(".main")?.dataset.nfseAuto!=="1")setTimeout(render,0)}).observe(document.documentElement,{subtree:true,childList:true});
setTimeout(render,400);
})();
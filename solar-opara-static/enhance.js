(()=>{
const SB="https://bdfojankowlfuezdhdjl.supabase.co";
const KEY="sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
const FONT_KEY="solar_font_size";
let busy=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const brDate=v=>{if(!v)return "—";const [y,m,d]=String(v).split("-");return d+"/"+m+"/"+y};
const token=()=>sessionStorage.getItem("solar_session")||"";
async function getTable(table,order){
  const headers={apikey:KEY,"x-solar-session":token()};
  let url=SB+"/rest/v1/"+table+"?select=*";
  if(order)url+="&order="+order;
  const r=await fetch(url,{headers});
  if(!r.ok)return [];
  return await r.json();
}
function applyFont(n){
  n=["1","2","3"].includes(String(n))?String(n):"2";
  document.body.classList.remove("so-f1","so-f2","so-f3");
  document.body.classList.add("so-f"+n);
  localStorage.setItem(FONT_KEY,n);
  document.querySelectorAll(".so-font-btn").forEach(b=>b.classList.toggle("on",b.dataset.soFont===n));
}
function addControls(){
  const side=document.querySelector(".side");
  if(!side||side.querySelector(".so-font-box"))return;
  const logout=side.querySelector("#logout");
  const wrap=document.createElement("div");
  wrap.className="so-font-box";
  wrap.innerHTML='<span class="so-font-title">Tamanho da fonte</span><div class="so-font-row"><button class="so-font-btn" data-so-font="1">A</button><button class="so-font-btn" data-so-font="2">A+</button><button class="so-font-btn" data-so-font="3">A++</button></div>';
  (logout||side).before(wrap);
  wrap.querySelectorAll("[data-so-font]").forEach(b=>b.onclick=()=>applyFont(b.dataset.soFont));
  applyFont(localStorage.getItem(FONT_KEY)||"2");
}
function addArchiveButton(){
  const side=document.querySelector(".side");
  if(!side||side.querySelector("#soArchiveBtn"))return;
  const logout=side.querySelector("#logout");
  const b=document.createElement("button");
  b.id="soArchiveBtn";
  b.innerHTML='<span class="nav-icon">▣</span><span>Arquivo planilha</span>';
  b.onclick=showArchive;
  (logout||side).before(b);
}
async function showArchive(){
  if(busy)return;busy=true;
  try{
    document.querySelectorAll(".side button").forEach(x=>x.classList.remove("active"));
    document.querySelector("#soArchiveBtn")?.classList.add("active");
    const main=document.querySelector(".main");if(!main)return;
    main.innerHTML='<div class="card"><h2>Carregando arquivo da planilha…</h2></div>';
    const [events,notes]=await Promise.all([
      getTable("so_legacy_events","event_date.asc"),
      getTable("so_legacy_notes","id.asc")
    ]);
    const years={2025:0,2026:0,2027:0};
    events.forEach(x=>{const y=String(x.event_date).slice(0,4);if(years[y]!==undefined)years[y]++});
    main.innerHTML='<div class="top"><div><div class="page-kicker">Arquivo histórico</div><h1>Planilha importada</h1><p class="muted">Dados preservados como estavam no arquivo enviado. Eles não foram convertidos automaticamente em contratos ou pagamentos.</p></div></div>'+
    '<div class="so-grid"><div class="card"><span class="muted">Eventos importados</span><b>'+events.length+'</b></div><div class="card"><span class="muted">Anotações</span><b>'+notes.length+'</b></div><div class="card"><span class="muted">Período</span><b>2025–2027</b></div></div>'+
    '<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">Compromissos</h2><input id="soLegacySearch" style="max-width:360px" placeholder="Pesquisar na planilha..."></div><p class="muted">2025: '+years[2025]+' · 2026: '+years[2026]+' · 2027: '+years[2027]+'</p><div class="so-table-wrap"><table><tr><th>Data</th><th>Descrição original</th><th>Origem</th></tr>'+events.map(x=>'<tr data-so-row><td>'+brDate(x.event_date)+'</td><td>'+esc(x.description)+'</td><td><span class="so-imported">'+esc(x.source_sheet)+'</span></td></tr>').join("")+'</table></div></div>'+
    '<div class="card"><h2>Anotações originais</h2><div class="so-table-wrap"><table><tr><th>#</th><th>Anotação</th><th>Origem</th></tr>'+notes.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(x.note_text)+'</td><td><span class="so-imported">'+esc(x.source_sheet)+'</span></td></tr>').join("")+'</table></div></div>';
    const q=document.querySelector("#soLegacySearch");
    if(q)q.oninput=e=>{const s=e.target.value.toLowerCase().trim();document.querySelectorAll("[data-so-row]").forEach(r=>r.style.display=!s||r.textContent.toLowerCase().includes(s)?"":"none")};
  }finally{busy=false}
}
async function enhanceAgenda(){
  const main=document.querySelector(".main");
  if(!main||main.dataset.soAgenda==="1")return;
  const h1=main.querySelector("h1");
  if(!h1||h1.textContent.trim()!=="Agenda")return;
  main.dataset.soAgenda="1";
  const events=await getTable("so_legacy_events","event_date.asc");
  if(!events.length)return;
  const card=document.createElement("div");
  card.className="card";
  card.innerHTML='<div class="top"><div><h2 style="margin:0">Eventos importados da planilha</h2><p class="muted">'+events.length+' registros históricos preservados de 2025 a 2027.</p></div><button class="btn gray" id="soOpenArchive">Abrir arquivo completo</button></div><div class="so-table-wrap"><table><tr><th>Data</th><th>Evento</th><th>Origem</th></tr>'+events.map(x=>'<tr><td>'+brDate(x.event_date)+'</td><td>'+esc(x.description)+'</td><td><span class="so-imported">IMPORTADO</span></td></tr>').join("")+'</table></div>';
  main.appendChild(card);
  card.querySelector("#soOpenArchive").onclick=showArchive;
}
function run(){addControls();addArchiveButton();enhanceAgenda();applyFont(localStorage.getItem(FONT_KEY)||"2")}
const obs=new MutationObserver(()=>setTimeout(run,0));
obs.observe(document.documentElement,{childList:true,subtree:true});
run();
})();
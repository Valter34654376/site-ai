(()=>{
const SB="https://bdfojankowlfuezdhdjl.supabase.co";
const KEY="sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
const FONT_KEY="solar_font_size";
let busy=false;
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const brDate=v=>{if(!v)return "—";const [y,m,d]=String(v).split("-");return d+"/"+m+"/"+y};
const token=()=>localStorage.getItem("solar_session")||"";
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

(()=>{
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const dateBR=v=>{if(!v)return "________________";const d=new Date(String(v).length===10?v+"T12:00:00":v);return isNaN(d)?"________________":d.toLocaleDateString("pt-BR")};
const dtBR=v=>{if(!v)return "________________";const d=new Date(v);return isNaN(d)?"________________":d.toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})};
const sbUrl="https://bdfojankowlfuezdhdjl.supabase.co";
const sbKey="sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
const session=()=>localStorage.getItem("solar_session")||"";
async function getContract(id){
 const r=await fetch(sbUrl+"/rest/v1/so_contracts?id=eq."+encodeURIComponent(id)+"&select=*,so_clients(*)",{headers:{apikey:sbKey,"x-solar-session":session()}});
 if(!r.ok)throw new Error("Não foi possível carregar o contrato.");
 const a=await r.json(); if(!a[0])throw new Error("Contrato não encontrado."); return a[0];
}
const baseStyle=`
<style>
@page{size:A4;margin:16mm}
*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#111;max-width:900px;margin:24px auto;line-height:1.45;font-size:12px}
h1{text-align:center;font-size:20px;margin:6px 0}h2{text-align:center;font-size:15px;margin:4px 0 12px}h3{font-size:13px;margin:20px 0 8px}
p{margin:6px 0;text-align:justify}.toolbar{position:sticky;top:0;background:#fff;border:1px solid #ddd;padding:10px;margin-bottom:16px;display:flex;gap:8px;z-index:5}
button{border:0;background:#c98d2f;color:#fff;padding:9px 13px;border-radius:7px;font-weight:bold;cursor:pointer}
table{width:100%;border-collapse:collapse;margin:8px 0 14px}td,th{border:1px solid #999;padding:6px;vertical-align:top}th{background:#f2f2f2}
.summary td:first-child{width:30%;font-weight:bold}.center{text-align:center}.sig{margin-top:28px;text-align:center}.sigline{display:inline-block;min-width:330px;border-top:1px solid #111;padding-top:5px;margin:22px 12px 0}
.pagebreak{page-break-before:always}.check td{text-align:center}.check td:first-child{text-align:left}.muted{color:#555;font-size:11px}
@media print{.toolbar{display:none}body{margin:0;max-width:none}}
</style>`;
function contractHtml(c){
 const cl=c.so_clients||{},total=Number(c.rental_value||0)+Number(c.cleaning_fee||0)+Number(c.additional_value||0);
 return `<!doctype html><html><head><meta charset="utf-8"><title>Contrato Solar Opará - ${esc(c.event_name)}</title>${baseStyle}</head><body>
 <div class="toolbar"><button onclick="print()">Imprimir / Salvar PDF</button></div>
 <h1>CONTRATO DE LOCAÇÃO DE ESPAÇO PARA EVENTOS</h1><h2>SOLAR OPARÁ</h2>
 <p class="center"><b>MODELO PROFISSIONAL – CONTRATO + QUADRO-RESUMO + TERMO DE VISTORIA + CHECKLIST</b></p>
 <h3>QUADRO-RESUMO DA CONTRATAÇÃO</h3>
 <table class="summary">
 <tr><td>LOCADOR</td><td>SOLAR OPARÁ TURISMO E HOTEIS – CNPJ 33.958.617/0001-73</td></tr>
 <tr><td>REPRESENTANTE</td><td>FLAVIA TATIANA RIBEIRO DE OLIVEIRA – CPF 004.310.306-50</td></tr>
 <tr><td>LOCATÁRIO(A)</td><td>${esc(cl.name)}</td></tr>
 <tr><td>CPF/CNPJ</td><td>${esc(cl.document)}</td></tr>
 <tr><td>ENDEREÇO</td><td>${esc(cl.address)}</td></tr>
 <tr><td>EVENTO</td><td>${esc(c.event_name)}</td></tr>
 <tr><td>DATA DO EVENTO</td><td>${dateBR(c.event_date)}</td></tr>
 <tr><td>MONTAGEM / ENTREGA</td><td>${dtBR(c.setup_at)}</td></tr>
 <tr><td>INÍCIO DO EVENTO HORA</td><td>${dtBR(c.start_at)}</td></tr>
 <tr><td>TÉRMINO DO EVENTO</td><td>${dtBR(c.end_at)}</td></tr>
 <tr><td>DESMONTAGEM / DEVOLUÇÃO</td><td>${dtBR(c.teardown_at)}</td></tr>
 <tr><td>CAPACIDADE MÁXIMA</td><td>${esc(c.capacity||"")} pessoas, observadas as regras de segurança e capacidade legal</td></tr>
 <tr><td>VALOR DA LOCAÇÃO</td><td>${money(c.rental_value)}</td></tr>
 <tr><td>TAXA DE LIMPEZA PÓS-EVENTO</td><td>${money(c.cleaning_fee)}</td></tr>
 <tr><td>SERVIÇOS ADICIONAIS</td><td>${esc(c.additional_services)}</td></tr>
 <tr><td>VALOR TOTAL</td><td>${money(total)}</td></tr>
 <tr><td>CAUÇÃO / GARANTIA</td><td>${esc(c.guarantee_text)}</td></tr>
 <tr><td>FORMA DE PAGAMENTO</td><td>${esc(c.payment_terms)}</td></tr>
 <tr><td>OBSERVAÇÕES</td><td>${esc(c.observations)}</td></tr>
 </table>
 <p>Este Quadro-Resumo integra o contrato e deverá ser conferido e preenchido antes da assinatura. Em caso de divergência, prevalecerá a informação expressamente confirmada e assinada pelas partes.</p>

 <h3>CONTRATO DE LOCAÇÃO DE ESPAÇO PARA EVENTOS</h3>
 <p><b>LOCADOR:</b> SOLAR OPARÁ TURISMO E HOTEIS, estabelecida na Rua Homero Nunes Macedo, nº 1208, Bairro Sagrada Família, Pirapora/MG, CEP 39.270-000, CNPJ nº 33.958.617/0001-73, neste ato representada por sua proprietária, Sra. FLAVIA TATIANA RIBEIRO DE OLIVEIRA, brasileira, solteira, CPF nº 004.310.306-50.</p>
 <p><b>LOCATÁRIO(A):</b> ${esc(cl.name)}, CPF/CNPJ nº ${esc(cl.document)}, endereço ${esc(cl.address)}, telefone ${esc(cl.phone)}, e-mail ${esc(cl.email)}.</p>
 <p>As partes celebram o presente contrato, regido pela legislação civil aplicável e, quando caracterizada relação de consumo, pelas normas do Código de Defesa do Consumidor, mediante as cláusulas seguintes.</p>

 <h3>CLÁUSULA 1 – DO OBJETO E DA FINALIDADE</h3>
 <p>1.1. O objeto é a locação temporária do Espaço de Festa SOLAR OPARÁ, compreendendo as áreas interna e externa, banheiros masculino e feminino, área da cozinha, área livre do gramado e altar, conforme a contratação.</p>
 <p>1.2. O espaço destina-se exclusivamente ao evento identificado no Quadro-Resumo, sendo vedada finalidade diversa sem autorização prévia e escrita do LOCADOR.</p>
 <p>1.3. A capacidade máxima contratada é de ${esc(c.capacity||"________")} pessoas, incluindo convidados, fornecedores, prestadores e demais participantes simultaneamente presentes, sem prejuízo das exigências legais e de segurança.</p>

 <h3>CLÁUSULA 2 – DO PREÇO, PAGAMENTO E GARANTIA</h3>
 <p>2.1. Os valores serão os indicados no Quadro-Resumo e nos comprovantes de contratação.</p>
 <p>2.2. O pagamento deverá ser realizado na forma e nos prazos acordados. O comprovante deverá ser encaminhado ao LOCADOR.</p>
 <p>2.3. A título de garantia, poderá ser exigido cheque nominal e cruzado ou outra modalidade previamente acordada, no valor indicado no Quadro-Resumo. A garantia será devolvida após a vistoria final, descontados somente valores correspondentes a obrigações vencidas, danos materiais ou custos de reparação comprovados.</p>
 <p>2.4. Havendo débito superior à garantia, o(a) LOCATÁRIO(A) deverá pagar a diferença no prazo de 5 (cinco) dias após comunicação acompanhada da respectiva apuração.</p>
 <p>2.5. O atraso no pagamento sujeitará o valor vencido à multa moratória de 2%, juros de 1% ao mês pro rata die e atualização monetária pelo índice legalmente aplicável, sem prejuízo das demais medidas cabíveis.</p>
 <p>2.6. Dados para Pagamento DADOS BANCARIOS AGENCIA:4133 CONTA CORRENTE : 914.762-4 CHAVE PIX CNPJ: 33.958.617/0001-73</p>

 <h3>CLÁUSULA 3 – DA ENTREGA, MONTAGEM, EVENTO E DESMONTAGEM</h3>
 <p>3.1. A entrega do espaço para montagem ocorrerá na data e horário do Quadro-Resumo.</p>
 <p>3.2. O início e término do evento observarão os horários contratados. Qualquer prorrogação dependerá de autorização prévia e escrita do LOCADOR e pagamento antecipado do valor aplicável.</p>
 <p>3.3. A prorrogação, quando autorizada, será cobrada à razão de R$ 500,00 (quinhentos reais) por hora ou fração, salvo valor diverso expressamente indicado no Quadro-Resumo.</p>
 <p>3.4. Na área do gramado, somente serão permitidas estruturas previamente autorizadas. É vedado causar pisoteio excessivo, compactação, perfuração ou qualquer dano ao gramado.</p>
 <p>3.5. Durante a montagem, os aparelhos de ar-condicionado permanecerão desligados, salvo autorização para uso antecipado, que poderá gerar cobrança adicional de R$ 300,00 por hora.</p>
 <p>3.6. A infraestrutura elétrica disponibilizada será utilizada dentro de sua capacidade. Equipamentos que exijam demanda superior deverão utilizar gerador e instalação adequada, às expensas do(a) LOCATÁRIO(A), com profissional habilitado quando necessário.</p>
 <p>3.7. É proibida a utilização de pregos, parafusos, grampos, colas ou outros meios capazes de danificar paredes, teto, colunas, pisos e demais estruturas.</p>
 <p>3.8. Estruturas, mesas, cadeiras e equipamentos deverão possuir proteção nos pontos de contato com o piso. Danos serão ressarcidos pelo custo necessário à reparação ou substituição, mediante comprovação.</p>

 <h3>CLÁUSULA 4 – DA DESOCUPAÇÃO E DAS PENALIDADES</h3>
 <p>4.1. O espaço deverá ser integralmente desocupado no prazo de desmontagem indicado no Quadro-Resumo, com retirada de materiais, equipamentos, resíduos e objetos do(a) LOCATÁRIO(A) e de seus fornecedores.</p>
 <p>4.2. O atraso na desocupação acarretará multa de R$ 200,00 (duzentos reais) por hora ou fração, sem prejuízo de danos adicionais comprovados quando houver.</p>
 <p>4.3. Materiais ou objetos deixados após o prazo serão retirados pelo(a) LOCATÁRIO(A) mediante solicitação do LOCADOR. Se a retirada exigir contratação de terceiros, o custo poderá ser cobrado do(a) LOCATÁRIO(A).</p>
 <p>4.4. Penalidades deverão ser aplicadas de forma proporcional ao descumprimento, observada a legislação aplicável.</p>

 <h3>CLÁUSULA 5 – DAS RESPONSABILIDADES DO(A) LOCATÁRIO(A)</h3>
 <p>5.1. O(A) LOCATÁRIO(A) responde pela organização do evento e deverá orientar convidados, fornecedores e prestadores sobre as regras do espaço.</p>
 <p>5.2. O(A) LOCATÁRIO(A) responderá pelos danos materiais comprovadamente causados por si, seus convidados, fornecedores, prestadores ou pessoas sob sua responsabilidade.</p>
 <p>5.3. Licenças, autorizações, direitos autorais (quando aplicáveis), segurança, decoração, som, iluminação, gerador, mão de obra e demais serviços contratados pelo(a) LOCATÁRIO(A) serão de sua responsabilidade.</p>
 <p>5.4. A relação de fornecedores e prestadores deverá ser enviada com antecedência mínima de 2 dias, contendo apenas os dados necessários ao controle e à segurança, em observância à legislação de proteção de dados.</p>
 <p>5.5. Prestadores deverão permanecer nas áreas autorizadas, respeitar funcionários e patrimônio do LOCADOR e cumprir as orientações de segurança.</p>
 <p>5.6. O(A) LOCATÁRIO(A) providenciará os materiais de consumo necessários ao evento, salvo aqueles expressamente incluídos em serviço contratado.</p>
 <p>5.7. O LOCADOR não responde por bens pessoais, equipamentos, objetos de decoração ou mercadorias deixados no local, salvo se comprovada responsabilidade direta do LOCADOR.</p>

 <h3>CLÁUSULA 6 – DA LIMPEZA, JARDINS E ENTREGA DA POSSE</h3>
 <p>6.1. A partir da entrega e liberação do espaço ao(à) LOCATÁRIO(A), decorador(a), cerimonial, buffet ou qualquer fornecedor/prestador por ele(a) contratado para iniciar montagem ou preparação, a limpeza e conservação decorrentes dessas atividades passam a ser responsabilidade do(a) LOCATÁRIO(A).</p>
 <p>6.2. Durante montagem, decoração, realização e desmontagem, o LOCADOR não terá obrigação de realizar limpeza contínua decorrente das atividades do evento, incluindo caixas, embalagens, plásticos, restos de materiais, flores, folhagens, alimentos e resíduos produzidos pelos fornecedores.</p>
 <p>6.3. A taxa de limpeza pós-evento, quando contratada, corresponde exclusivamente ao escopo descrito no Quadro-Resumo ou em documento complementar e não significa disponibilização contínua de funcionário durante a montagem ou evento.</p>
 <p>6.4. A manutenção ordinária dos jardins e áreas externas será realizada pelo funcionário do LOCADOR de segunda a sexta-feira em horário comercial e aos sábados até as 12h00.</p>
 <p>6.5. Após esse horário, não haverá obrigação de o funcionário permanecer no local para limpeza ou manutenção contínua, inclusive para recolhimento de folhas, flores, pequenos galhos e outros resíduos naturais que venham a cair posteriormente.</p>
 <p>6.6. Por se tratar de área externa arborizada, a queda natural de folhas, flores e pequenos resíduos vegetais poderá ocorrer a qualquer tempo por condições climáticas ou naturais e, isoladamente, não caracteriza falta de limpeza ou defeito na prestação.</p>
 <p>6.7. Limpeza adicional ou manutenção externa fora do horário regular do funcionário poderá ser contratada ou providenciada pelo(a) LOCATÁRIO(A), às suas expensas.</p>

 <h3>CLÁUSULA 7 – DA VISTORIA E DEVOLUÇÃO</h3>
 <p>7.1. Será realizado Termo de Vistoria de Entrada antes da montagem, preferencialmente acompanhado de fotografias.</p>
 <p>7.2. Ao final, será realizada vistoria de saída. O(A) LOCATÁRIO(A) deverá devolver o espaço nas condições em que o recebeu, ressalvado o desgaste normal e o serviço de limpeza expressamente contratado.</p>
 <p>7.3. A ausência do(a) LOCATÁRIO(A) na vistoria final não impede o LOCADOR de documentar as condições encontradas, inclusive por fotografias, devendo encaminhar a apuração ao(à) LOCATÁRIO(A).</p>
 <p>7.4. Danos deverão ser descritos e, quando possível, acompanhados de orçamento, nota fiscal ou outro elemento que permita demonstrar o custo da reparação.</p>

 <h3>CLÁUSULA 8 – DO CANCELAMENTO, REMARCAÇÃO E RESCISÃO</h3>
 <p>8.1. O cancelamento pelo(a) LOCATÁRIO(A) observará as condições comerciais expressamente preenchidas no Quadro-Resumo, respeitando a legislação aplicável e a proporcionalidade entre retenções e prejuízos.</p>
 <p>8.2. Nenhuma disposição deste contrato implica renúncia a direito legalmente assegurado ao consumidor, quando aplicável.</p>
 <p>8.3. Em caso de impedimento legal ou fato de força maior que torne objetivamente impossível a realização do evento, as partes buscarão de boa-fé a remarcação ou solução financeira adequada, considerando valores já pagos e serviços efetivamente prestados.</p>
 <p>8.4. O contrato poderá ser rescindido por inadimplemento relevante, observadas as consequências legais e contratuais cabíveis.</p>

 <h3>CLÁUSULA 9 – DA RESPONSABILIDADE CIVIL</h3>
 <p>9.1. Cada parte responderá pelos danos que causar por ação ou omissão, nos termos da legislação aplicável.</p>
 <p>9.2. O LOCADOR não responderá por danos decorrentes exclusivamente de atos do(a) LOCATÁRIO(A), convidados, fornecedores ou prestadores, nem por fatos externos aos quais não tenha dado causa, ressalvadas as responsabilidades que a lei não permita excluir ou limitar.</p>
 <p>9.3. Nenhuma cláusula deste contrato afasta responsabilidade legal do LOCADOR por ato próprio quando a lei determinar sua responsabilidade.</p>

 <h3>CLÁUSULA 10 – DA PROTEÇÃO DE DADOS</h3>
 <p>10.1. Os dados pessoais fornecidos serão tratados na medida necessária à execução, segurança, organização e comprovação das obrigações contratuais, observada a Lei Geral de Proteção de Dados Pessoais.</p>
 <p>10.2. O(A) LOCATÁRIO(A) deverá fornecer aos seus fornecedores informação adequada sobre o compartilhamento dos dados necessários ao controle de acesso e segurança.</p>

 <h3>CLÁUSULA 11 – DAS DISPOSIÇÕES GERAIS E DO FORO</h3>
 <p>11.1. O Quadro-Resumo, Termo de Vistoria, checklist e eventuais termos de serviços adicionais integram este contrato.</p>
 <p>11.2. Alterações de data, horário, valores, serviços ou condições deverão ser formalizadas por escrito.</p>
 <p>11.3. Em caso de conflito entre documentos, prevalecerá a versão mais recente assinada pelas partes, desde que específica quanto ao ponto alterado.</p>
 <p>11.4. Fica eleito o foro legalmente competente para dirimir controvérsias, respeitadas as regras de competência que não possam ser afastadas por convenção.</p>

 <h3>ASSINATURAS</h3><p class="center">Pirapora/MG, ____ de __________________ de ______.</p>
 <div class="sig"><span class="sigline">LOCADOR: SOLAR OPARÁ TURISMO E HOTEIS</span><br><span class="sigline">LOCATÁRIO(A): ${esc(cl.name)}</span></div>
 <p>TESTEMUNHA 1 – Nome: __________________________ CPF: __________________________</p>
 <p>TESTEMUNHA 2 – Nome: __________________________ CPF: __________________________</p>

 <div class="pagebreak"></div><h1>ANEXO I – TERMO DE VISTORIA DE ENTRADA E SAÍDA</h1>
 <p>Este Termo integra o Contrato de Locação de Espaço para Eventos e deverá ser preenchido na entrega para montagem e na devolução do espaço.</p>
 <table class="summary"><tr><td>DATA/HORA DA VISTORIA DE ENTRADA</td><td>____/____/______ às ______h</td></tr><tr><td>DATA/HORA DA VISTORIA DE SAÍDA</td><td>____/____/______ às ______h</td></tr><tr><td>RESPONSÁVEL PELO LOCADOR</td><td>________________________________________</td></tr><tr><td>RESPONSÁVEL PELO LOCATÁRIO</td><td>________________________________________</td></tr><tr><td>DECORADOR / CERIMONIAL</td><td>________________________________________</td></tr></table>
 <h3>CONDIÇÕES DO ESPAÇO – MARCAR E DESCREVER</h3>
 <table><tr><th>Item</th><th>Entrada</th><th>Saída</th><th>Observações / danos</th></tr>
 ${["Piso/porcelanato","Paredes, pintura e colunas","Teto","Portas e fechaduras","Janelas/vidros","Banheiros","Cozinha e bancadas","Instalações elétricas","Ar-condicionado","Gramado","Jardins e áreas externas","Mobiliário/equipamentos do LOCADOR","Iluminação","Limpeza geral","Outros"].map(x=>`<tr><td>${x}</td><td>( ) OK ( ) Avaria</td><td>( ) OK ( ) Avaria</td><td></td></tr>`).join("")}</table>
 <p>REGISTRO FOTOGRÁFICO: ( ) realizado na entrada ( ) realizado na saída ( ) não realizado</p>
 <p>OBSERVAÇÕES COMPLEMENTARES:</p><p>_______________________________________________________________________________</p><p>_______________________________________________________________________________</p><p>_______________________________________________________________________________</p>
 <p>Declara-se que as condições registradas acima correspondem ao estado do espaço na data e horário indicados, sem prejuízo dos direitos legalmente assegurados.</p>
 <div class="sig"><span class="sigline">LOCADOR / REPRESENTANTE</span><span class="sigline">LOCATÁRIO(A) / REPRESENTANTE</span></div>

 <div class="pagebreak"></div><h1>ANEXO II – CHECKLIST DE ENTREGA E DEVOLUÇÃO</h1>
 <p>Preencher na entrada para montagem e novamente na saída. O checklist é instrumento de conferência e não substitui o Termo de Vistoria.</p>
 <table class="check"><tr><th>Conferência</th><th>ENTREGA</th><th>DEVOLUÇÃO</th><th>Observações</th></tr>
 ${["Horário de entrega conferido","Chaves/controles entregues","Pisos sem danos aparentes","Paredes/colunas sem danos aparentes","Banheiros conferidos","Cozinha conferida","Pontos elétricos conferidos","Ar-condicionado conferido","Gramado conferido","Jardins conferidos","Mobiliário do LOCADOR conferido","Fotografias realizadas","Materiais do evento retirados","Resíduos do evento retirados","Equipamentos de fornecedores retirados","Objetos pessoais retirados","Portas/janelas fechadas","Chaves/controles devolvidos","Danos identificados e registrados","Limpeza pós-evento: serviço contratado","Limpeza adicional: necessária","Caução/garantia: situação registrada"].map(x=>`<tr><td>${x}</td><td>☐</td><td>☐</td><td></td></tr>`).join("")}</table>
 <h3>OCORRÊNCIAS NA DEVOLUÇÃO</h3><p>_______________________________________________________________________________</p><p>_______________________________________________________________________________</p><p>Responsável pela conferência: ______________________________________</p><p>Data: ____/____/______</p><div class="sig"><span class="sigline">Assinatura LOCADOR</span><span class="sigline">Assinatura LOCATÁRIO(A)</span></div>

 <div class="pagebreak"></div><h1>ANEXO III – REGRAS OPERACIONAIS PARA FORNECEDORES E PRESTADORES</h1>
 <p>1. O acesso para montagem somente ocorrerá dentro do horário contratado.</p>
 <p>2. A partir da entrega para montagem, os fornecedores deverão manter suas áreas de trabalho organizadas e recolher os resíduos produzidos por seus serviços.</p>
 <p>3. É proibido perfurar, colar, parafusar ou danificar paredes, teto, colunas, pisos, gramado ou jardins.</p>
 <p>4. Equipamentos e estruturas deverão ser transportados e instalados de modo a evitar danos ao piso.</p>
 <p>5. O uso de equipamentos elétricos deverá respeitar a capacidade disponibilizada. Equipamentos de maior demanda poderão exigir gerador.</p>
 <p>6. O gramado não poderá ser utilizado para estruturas não autorizadas, veículos ou atividades que causem dano.</p>
 <p>7. Após o horário regular do funcionário do LOCADOR, não haverá serviço ordinário de recolhimento de folhas ou limpeza natural das áreas externas.</p>
 <p>8. O LOCATÁRIO é responsável por comunicar estas regras aos seus fornecedores, decoradores, cerimonial, buffet, músicos, fotógrafos e demais prestadores.</p>
 <p>9. O descumprimento que causar dano poderá gerar obrigação de ressarcimento pelo custo comprovado da reparação.</p>
 <p>Declaro que recebi e compreendi as regras acima e me comprometo a transmiti-las aos fornecedores e prestadores do evento.</p>
 <p>LOCATÁRIO(A): ______________________________________________</p><p>DATA: ____/____/______</p><p>RESPONSÁVEL PELO FORNECEDOR/CERIMONIAL: ________________________________</p>
 </body></html>`;
}
function manualHtml(c){
 const cl=c.so_clients||{};
 const sections=[
 ["1. ENTREGA E LIBERAÇÃO DO ESPAÇO",["1.1. O espaço será entregue na data e horário previstos no Quadro-Resumo do contrato.","1.2. A partir da entrega e liberação do espaço para montagem ou preparação, toda sujeira, resíduo, embalagem, material ou descarte produzido pelo(a) LOCATÁRIO(A) ou por seus fornecedores e prestadores será de responsabilidade do(a) LOCATÁRIO(A).","1.3. A entrada antecipada ou permanência além do horário contratado depende de autorização prévia do Solar Opará e poderá gerar cobrança adicional.","1.4. O acesso de fornecedores deverá ocorrer somente dentro dos horários autorizados e conforme as orientações da equipe do Solar Opará."]],
 ["2. MONTAGEM E DESMONTAGEM",["2.1. Montagem, instalação e desmontagem deverão ser realizadas dentro dos horários contratados.","2.2. Todos os materiais, estruturas, caixas, embalagens, ferramentas e equipamentos utilizados na montagem deverão ser retirados dentro do prazo de desmontagem.","2.3. Não é permitido deixar materiais, equipamentos ou objetos do evento no espaço após o horário de devolução sem autorização expressa.","2.4. O transporte de estruturas, mesas, cadeiras e equipamentos deverá ser feito de forma a não danificar pisos, paredes, portas, jardins ou demais instalações.","2.5. Os fornecedores deverão manter suas áreas de trabalho organizadas e recolher os resíduos produzidos por seus serviços."]],
 ["3. DECORAÇÃO",["3.1. É proibido utilizar pregos, parafusos, grampos, colas, fitas ou qualquer método de fixação que possa danificar paredes, teto, colunas, portas, pisos ou demais estruturas, salvo autorização expressa e orientação da equipe.","3.2. Decorações suspensas, estruturas, painéis, iluminação decorativa e demais instalações deverão ser previamente informadas e autorizadas quando houver possibilidade de interferência na estrutura do imóvel.","3.3. É proibida qualquer alteração permanente ou intervenção na estrutura, pintura, paisagismo ou instalações do Solar Opará.","3.4. O decorador deverá utilizar proteção adequada nos pontos de contato de estruturas e mobiliários com o piso."]],
 ["4. PISOS E CONSERVAÇÃO DAS ESTRUTURAS",["4.1. É obrigatório proteger o piso durante montagem e desmontagem, especialmente sob estruturas metálicas, móveis, equipamentos e objetos pesados.","4.2. Não é permitido arrastar móveis, equipamentos ou estruturas diretamente sobre o piso.","4.3. Danos ao piso, paredes, teto, portas, vidros, mobiliário ou demais bens serão registrados na vistoria e poderão gerar cobrança dos custos comprovadamente necessários à reparação ou substituição.","4.4. Quando a reparação exigir procedimento técnico específico ou substituição de conjunto de peças para preservação do padrão do acabamento, o custo será apurado conforme o serviço efetivamente necessário e comprovado."]],
 ["5. JARDINS, GRAMADO E PAISAGISMO",["5.1. O gramado e as áreas ajardinadas fazem parte do patrimônio do Solar Opará e deverão ser preservados.","5.2. É proibido estacionar ou circular com veículos sobre o gramado ou em áreas não autorizadas.","5.3. É proibido instalar estruturas, tendas, equipamentos, móveis ou objetos no gramado sem autorização prévia e indicação do local pela equipe do Solar Opará.","5.4. É proibido perfurar o solo, fixar objetos em árvores, amarrar estruturas na vegetação, cortar ou podar plantas, deslocar vasos ou alterar o paisagismo.","5.5. É proibido jogar arroz, confetes, papéis, sementes, glitter, serpentinas ou outros materiais no jardim ou gramado sem autorização expressa.","5.6. Qualquer dano ao gramado, plantas, árvores, vasos ou demais elementos paisagísticos será registrado e poderá gerar cobrança do custo comprovado de recuperação.","5.7. A manutenção ordinária dos jardins é realizada pelo funcionário do Solar Opará de segunda a sexta-feira em horário comercial e aos sábados até as 12h00.","5.8. Após o horário de trabalho do funcionário, não haverá serviço ordinário de limpeza ou manutenção contínua das áreas externas, inclusive para recolhimento de folhas, flores, pequenos galhos e outros resíduos naturais que venham a cair posteriormente.","5.9. Por se tratar de área externa arborizada, a queda natural de folhas, flores e pequenos resíduos vegetais poderá ocorrer em razão de vento, chuva e outras condições naturais e, isoladamente, não caracteriza falta de limpeza.","5.10. Caso o(a) LOCATÁRIO(A) necessite de limpeza ou manutenção externa adicional fora do horário regular, deverá providenciar equipe própria ou serviço previamente autorizado pelo Solar Opará, às suas expensas."]],
 ["6. ENERGIA ELÉTRICA E EQUIPAMENTOS",["6.1. O espaço disponibiliza a infraestrutura elétrica existente no imóvel, dentro de sua capacidade técnica.","6.2. O(A) LOCATÁRIO(A) deverá informar previamente equipamentos de maior potência que serão utilizados, incluindo som, iluminação, cozinha, refrigeração e outros.","6.3. Equipamentos cuja demanda exceda a capacidade disponibilizada deverão utilizar gerador adequado, providenciado e custeado pelo(a) LOCATÁRIO(A), com instalação segura e profissional habilitado quando necessário.","6.4. É proibido realizar alterações no quadro elétrico, disjuntores, tomadas ou instalações do Solar Opará sem autorização.","6.5. O Solar Opará não responderá por danos decorrentes de instalações inadequadas, sobrecarga, equipamentos defeituosos, ligações realizadas por terceiros ou uso incompatível com a capacidade disponibilizada, ressalvadas as responsabilidades que a legislação não permita excluir."]],
 ["7. AR-CONDICIONADO",["7.1. Durante a montagem, os aparelhos de ar-condicionado permanecerão desligados, salvo autorização específica.","7.2. O funcionamento ordinário ocorrerá conforme o horário estabelecido no contrato.","7.3. O uso antecipado poderá ser autorizado mediante cobrança do valor previsto no contrato.","7.4. É proibido alterar configurações técnicas, desligar disjuntores ou manipular componentes dos equipamentos."]],
 ["8. FREEZERS E EQUIPAMENTOS DO ESPAÇO",["8.1. Os freezers e demais equipamentos disponibilizados pelo Solar Opará deverão permanecer no local e não poderão ser deslocados sem autorização.","8.2. Devem ser utilizados conforme a voltagem e orientação indicadas no equipamento.","8.3. É proibido desligar, mudar a tomada, conectar equipamentos inadequados ou realizar qualquer intervenção elétrica.","8.4. Problemas ou falhas deverão ser comunicados imediatamente à equipe do Solar Opará."]],
 ["9. COZINHA, BUFFET E MANIPULAÇÃO DE ALIMENTOS",["9.1. A cozinha e seus equipamentos deverão ser utilizados exclusivamente para a finalidade autorizada.","9.2. O buffet e seus profissionais deverão manter a área organizada e recolher os resíduos produzidos.","9.3. É proibido despejar restos de alimentos, óleo ou gordura em pias, ralos ou vasos sanitários.","9.4. Materiais de consumo, utensílios e equipamentos não incluídos expressamente na locação deverão ser providenciados pelo(a) LOCATÁRIO(A).","9.5. O buffet e demais fornecedores deverão respeitar as orientações da equipe quanto a circulação e áreas de apoio."]],
 ["10. LIMPEZA E RESÍDUOS",["10.1. A limpeza decorrente da montagem, decoração, instalação de equipamentos, realização e desmontagem do evento é responsabilidade do(a) LOCATÁRIO(A), ressalvado o serviço de limpeza pós-evento expressamente contratado.","10.2. O serviço de limpeza pós-evento não significa disponibilização de funcionário para limpeza contínua durante montagem, festa ou desmontagem.","10.3. Caixas, embalagens, plásticos, flores, folhagens, restos de materiais, alimentos e demais resíduos produzidos pelo evento deverão ser recolhidos e acondicionados adequadamente.","10.4. O(A) LOCATÁRIO(A) deverá providenciar equipe de limpeza adicional quando a dimensão do evento ou a atividade dos fornecedores exigir manutenção contínua.","10.5. O descarte deverá ser realizado nos locais indicados pelo Solar Opará."]],
 ["11. GARRAFAS, VIDROS E OBJETOS FRÁGEIS",["11.1. Garrafas, copos, recipientes e demais objetos de vidro deverão ser manuseados e recolhidos com segurança.","11.2. Garrafas e recipientes de vidro não poderão ser abandonados em jardins, gramados, áreas de circulação ou locais não destinados ao descarte.","11.3. Quando previsto no contrato ou Quadro-Resumo, a não realização do recolhimento adequado poderá gerar a cobrança do valor correspondente ao serviço adicional.","11.4. Quebras ou danos causados por convidados ou fornecedores serão registrados e poderão gerar cobrança do custo de reparação ou substituição."]],
 ["12. SEGURANÇA E CONTROLE DO EVENTO",["12.1. O(A) LOCATÁRIO(A) deverá observar as exigências legais aplicáveis ao evento e providenciar os serviços de segurança necessários ao seu porte.","12.2. É proibido bloquear saídas, corredores, acessos, equipamentos de segurança ou rotas de circulação.","12.3. É proibido armazenar materiais inflamáveis ou perigosos no espaço, salvo quando legalmente permitido e previamente autorizado.","12.4. Equipamentos de som, iluminação e estruturas deverão ser instalados de modo seguro e por profissionais capacitados quando necessário.","12.5. A equipe do Solar Opará poderá orientar a interrupção de atividade que represente risco imediato ao patrimônio ou às pessoas, sem prejuízo das providências legalmente cabíveis."]],
 ["13. CRIANÇAS E PLAYGROUND",["13.1. Crianças deverão permanecer sob supervisão de seus pais, responsáveis ou adultos designados pelos organizadores.","13.2. O playground e demais áreas recreativas não possuem vigilância individualizada pelo Solar Opará.","13.3. É proibido acessar áreas técnicas, cozinha, depósitos ou locais restritos.","13.4. É proibido subir em árvores, estruturas, mesas, cadeiras ou elementos que não sejam destinados a essa finalidade."]],
 ["14. ESTACIONAMENTO E CIRCULAÇÃO DE VEÍCULOS",["14.1. Veículos deverão permanecer somente nas áreas autorizadas.","14.2. É proibido estacionar ou circular sobre gramados, jardins, áreas de emergência, acessos ou locais indicados como proibidos.","14.3. O Solar Opará não se responsabiliza por objetos deixados no interior de veículos, ressalvada responsabilidade legal comprovada do próprio estabelecimento.","14.4. Fornecedores deverão observar os horários e locais definidos para carga e descarga."]],
 ["15. HORÁRIOS",["15.1. Os horários de montagem, evento e desmontagem são os constantes do Quadro-Resumo do contrato.","15.2. A permanência no espaço fora do horário contratado depende de autorização prévia.","15.3. A prorrogação autorizada será cobrada conforme o contrato.","15.4. O cumprimento do horário de desmontagem é obrigatório para permitir a organização e utilização do espaço em eventos posteriores."]],
 ["16. OBJETOS PESSOAIS, MATERIAIS E EQUIPAMENTOS",["16.1. O(A) LOCATÁRIO(A) e seus fornecedores são responsáveis pela guarda de seus objetos, equipamentos, materiais e mercadorias.","16.2. O Solar Opará não assume guarda de bens deixados no local, salvo ajuste expresso ou responsabilidade legal comprovada.","16.3. Todos os materiais deverão ser retirados no prazo de desmontagem."]],
 ["17. FORNECEDORES E PRESTADORES",["17.1. O(A) LOCATÁRIO(A) deverá comunicar previamente ao Solar Opará a relação de fornecedores e prestadores que terão acesso ao espaço.","17.2. O(A) LOCATÁRIO(A) deverá entregar a estes profissionais uma cópia deste Manual ou comunicar integralmente suas regras.","17.3. O descumprimento das regras por fornecedor ou prestador não afasta a responsabilidade contratual do(a) LOCATÁRIO(A) perante o Solar Opará, quando cabível.","17.4. O Solar Opará poderá restringir o acesso de fornecedor que não esteja autorizado ou que descumpra regras de segurança, sem prejuízo das consequências contratuais."]],
 ["18. DANOS AO PATRIMÔNIO",["18.1. Danos serão registrados no Termo de Vistoria e, sempre que possível, documentados por fotografias.","18.2. O(A) LOCATÁRIO(A) responderá pelos danos materiais comprovadamente causados por si, convidados, fornecedores, prestadores ou pessoas sob sua responsabilidade.","18.3. A apuração considerará o custo efetivamente necessário e comprovado para limpeza extraordinária, reparação ou substituição.","18.4. A cobrança de qualquer valor não impede a utilização da garantia/caução nos termos do contrato, nem a cobrança de eventual saldo remanescente."]],
 ["19. VISTORIA E DEVOLUÇÃO",["19.1. A vistoria de entrada será realizada antes da montagem, preferencialmente com registro fotográfico.","19.2. A vistoria de saída será realizada após a desocupação e retirada dos materiais.","19.3. O checklist de entrega e devolução integra este Manual e deverá ser utilizado para conferência.","19.4. O espaço deverá ser devolvido nas condições em que foi entregue, ressalvado o desgaste normal e os serviços expressamente contratados."]],
 ["20. DESCUMPRIMENTO DAS REGRAS",["20.1. O descumprimento deste Manual poderá caracterizar descumprimento contratual e gerar as consequências previstas no contrato.","20.2. Quando houver dano ou serviço extraordinário, o custo deverá ser apurado e comprovado de forma razoável e proporcional.","20.3. As regras deste Manual não afastam direitos ou responsabilidades que sejam assegurados pela legislação aplicável."]]
 ];
 return `<!doctype html><html><head><meta charset="utf-8"><title>Manual Solar Opará - ${esc(c.event_name)}</title>${baseStyle}</head><body>
 <div class="toolbar"><button onclick="print()">Imprimir / Salvar PDF</button></div>
 <h1>MANUAL DE REGRAS E ORIENTAÇÕES</h1><h2>PARA UTILIZAÇÃO DO ESPAÇO SOLAR OPARÁ</h2>
 <p class="center">Documento integrante do Contrato de Locação de Espaço para Eventos<br><b>SOLAR OPARÁ TURISMO E HOTEIS</b><br>Rua Homero Nunes Macedo, nº 1208 – Bairro Sagrada Família – Pirapora/MG</p>
 <h3>FINALIDADE DESTE MANUAL</h3>
 <p>Este Manual estabelece as regras operacionais para utilização do espaço SOLAR OPARÁ durante montagem, decoração, realização e desmontagem de eventos. Ele integra o Contrato de Locação de Espaço para Eventos e deverá ser observado pelo(a) LOCATÁRIO(A), seus convidados, fornecedores, decoradores, cerimonial, buffet, músicos, fotógrafos e demais prestadores contratados para o evento.</p>
 <p>O(A) LOCATÁRIO(A) é responsável por comunicar estas regras aos seus fornecedores e prestadores e por zelar para que sejam cumpridas.</p>
 ${sections.map(([t,ps])=>`<h3>${t}</h3>${ps.map(p=>`<p>${p}</p>`).join("")}`).join("")}
 <h3>21. DECLARAÇÃO DE CIÊNCIA</h3>
 <p>Declaro que recebi, li e compreendi este Manual de Regras e Orientações para Utilização do Espaço Solar Opará, comprometendo-me a cumprir suas disposições e a repassá-las aos fornecedores, prestadores e demais pessoas sob minha responsabilidade.</p>
 <p><b>Nome do(a) LOCATÁRIO(A):</b> ${esc(cl.name)}</p><p><b>CPF/CNPJ:</b> ${esc(cl.document)}</p><p><b>Evento:</b> ${esc(c.event_name)}</p><p><b>Data:</b> ${dateBR(c.event_date)}</p>
 <p>Assinatura: ________________________________________</p>
 <div class="pagebreak"></div><h1>CHECKLIST DE CIÊNCIA DOS FORNECEDORES</h1>
 <p>Recomenda-se que o(a) LOCATÁRIO(A) entregue este Manual aos fornecedores abaixo e registre a ciência dos responsáveis.</p>
 <table><tr><th>Fornecedor / Serviço</th><th>Responsável</th><th>Telefone</th><th>Ciência / Assinatura</th></tr>${Array.from({length:8},()=>"<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>").join("")}</table>
 <p class="muted">Observação: a assinatura do fornecedor não substitui a responsabilidade contratual do(a) LOCATÁRIO(A), quando aplicável.</p>
 <div class="pagebreak"></div><h1>TERMO DE CIÊNCIA – REGRAS ESSENCIAIS</h1>
 <ul><li>A responsabilidade pela limpeza decorrente da montagem começa com a entrega do espaço para preparação do evento.</li><li>Fornecedores e prestadores devem manter suas áreas organizadas e recolher os resíduos produzidos por seus serviços.</li><li>O funcionário do Solar Opará realiza manutenção ordinária dos jardins de segunda a sexta em horário comercial e aos sábados até 12h00.</li><li>Após esse horário não existe serviço ordinário de recolhimento de folhas ou outros resíduos naturais que venham a cair posteriormente.</li><li>Danos ao gramado, jardins, pisos, paredes, equipamentos e demais bens poderão ser cobrados conforme o custo comprovado de reparação ou substituição.</li><li>Montagem, decoração, estruturas e instalações não podem danificar o imóvel.</li><li>Equipamentos elétricos de alta potência devem ser informados previamente e poderão exigir gerador.</li><li>O horário de desmontagem e devolução deve ser rigorosamente observado.</li><li>As regras devem ser repassadas a todos os fornecedores e prestadores.</li></ul>
 <p><b>LOCATÁRIO(A):</b> ${esc(cl.name)}</p><p>ASSINATURA: ______________________________________________</p><p>DATA: ____/____/________</p>
 </body></html>`;
}
async function openFullDoc(id,manual){
 try{
  const c=await getContract(id),w=window.open("","_blank");
  if(!w)throw new Error("O navegador bloqueou a nova janela.");
  w.document.open();w.document.write(manual?manualHtml(c):contractHtml(c));w.document.close();
 }catch(e){alert(e.message||String(e))}
}
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-doc],[data-manual]"); if(!b)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 openFullDoc(b.dataset.doc||b.dataset.manual,!!b.dataset.manual);
},true);
})();
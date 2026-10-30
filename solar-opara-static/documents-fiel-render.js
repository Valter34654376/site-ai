(()=>{
const F=window.SolarDocFiel;if(!F)return;
F.money=v=>Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
F.masterCache=null;
F.loadMaster=async()=>{
 if(F.masterCache)return F.masterCache;
 const r=await fetch(F.MASTER,{cache:"force-cache"});
 if(!r.ok)throw new Error("Molde do contrato não encontrado.");
 F.masterCache=new Uint8Array(await r.arrayBuffer());
 return F.masterCache;
};
F.loading=()=>{
 let o=document.getElementById("solarPdfOverlay");
 if(!o){o=document.createElement("div");o.id="solarPdfOverlay";o.innerHTML='<div class="solar-pdf-card"><div class="solar-spinner"></div><h3>Gerando contrato...</h3><p>Preparando o PDF no modelo Solar Opará.</p></div>';document.body.appendChild(o)}
 o.innerHTML='<div class="solar-pdf-card"><div class="solar-spinner"></div><h3>Gerando contrato...</h3><p>Preparando o PDF no modelo Solar Opará.</p></div>';
 return o;
};
F.preview=(url,name)=>{
 const o=document.getElementById("solarPdfOverlay")||F.loading();
 o.innerHTML='<div class="solar-pdf-preview"><div class="solar-pdf-toolbar"><strong>Contrato pronto</strong><div><a class="btn small" target="_blank" rel="noopener" href="'+url+'">Abrir PDF</a><a class="btn small gray" download="'+name+'" href="'+url+'">Baixar PDF</a><button class="btn small gray" id="solarPdfClose">Fechar</button></div></div><iframe src="'+url+'" title="Prévia do contrato"></iframe></div>';
 document.getElementById("solarPdfClose").onclick=()=>o.remove();
};
F.generate=async id=>{
 const [L,c,master]=await Promise.all([F.ensurePdfLib(),F.getContract(id),F.loadMaster()]);
 const cl=c.so_clients||{},pdf=await L.PDFDocument.load(master),font=await pdf.embedFont(L.StandardFonts.Helvetica),p=pdf.getPages();
 const d=(pg,t,x,y,w,s,opt)=>F.drawTop(pg,t||"",x,y,w,s,font,opt||{});
 const total=Number(c.rental_value||0)+Number(c.cleaning_fee||0)+Number(c.additional_value||0);
 const extra=[c.additional_services,Number(c.additional_value||0)>0?F.money(c.additional_value):""].filter(Boolean).join(" - ");
 d(p[0],cl.name,297.5,204.7,224,10.25,{maxLines:2,minSize:7});
 d(p[0],cl.document,297.5,235.5,224,10,{maxLines:1,minSize:7});
 d(p[0],cl.address,297.5,251.2,224,9.3,{maxLines:1,minSize:6.8});
 d(p[0],c.event_name,297.5,265.2,224,9.5,{maxLines:1,minSize:6.8});
 d(p[0],F.brDate(c.event_date),297.5,279.4,224,10,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.setup_at),297.5,295.2,224,8.9,{maxLines:2,minSize:6.7,lineHeight:10});
 d(p[0],F.brDateTime(c.start_at),297.5,321.6,224,9.5,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.end_at),297.5,337.2,224,9.5,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.teardown_at),297.5,352.8,224,9.1,{maxLines:1,minSize:6.8});
 d(p[0],c.capacity?c.capacity+" pessoas, observadas as regras de segurança e capacidade legal":"",297.5,366.7,224,8.2,{maxLines:2,minSize:6.2,lineHeight:9});
 d(p[0],F.money(c.rental_value),297.5,389.4,224,8.4,{maxLines:1,minSize:6.2});
 d(p[0],F.money(c.cleaning_fee),297.5,402.5,224,8.4,{maxLines:1,minSize:6.2});
 d(p[0],extra,297.5,416.5,224,8.2,{maxLines:1,minSize:6.1});
 d(p[0],F.money(total),297.5,430.5,224,8.4,{maxLines:1,minSize:6.2});
 d(p[0],c.guarantee_text,297.5,445.5,224,8.2,{maxLines:1,minSize:6.1});
 d(p[0],c.payment_terms||"PIX",297.5,459.6,224,8.4,{maxLines:1,minSize:6.2});
 d(p[0],c.observations,297.5,475.6,224,8.2,{maxLines:1,minSize:6.1});
 const tenant="LOCATÁRIO(A): "+(cl.name||"")+", CPF/CNPJ nº "+(cl.document||"")+", endereço "+(cl.address||"")+", telefone "+(cl.phone||"")+", e-mail "+(cl.email||"")+".";
 d(p[0],tenant,70.9,606,448,9.5,{maxLines:3,minSize:7,lineHeight:10.7});
 if(c.capacity)d(p[1],String(c.capacity),263.2,65.4,126,8.4,{maxLines:1,minSize:6.8});
 d(p[3],F.signingDate(),70.9,332,210,9.5,{maxLines:1,minSize:7.5});
 d(p[3],"LOCATÁRIO(A): "+String(cl.name||"").toUpperCase(),106.4,441.2,369,9.5,{maxLines:1,minSize:6.8});
 const bytes=await pdf.save(),blob=new Blob([bytes],{type:"application/pdf"}),url=URL.createObjectURL(blob);
 const name="contrato-solar-opara-"+F.safeName(c.event_name)+".pdf";
 return {url,name};
};
document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-doc]");if(!b)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 F.loading();
 try{const r=await F.generate(b.dataset.doc);F.preview(r.url,r.name)}
 catch(err){document.getElementById("solarPdfOverlay")?.remove();alert(err.message||String(err))}
},true);
const style=document.createElement("style");
style.textContent='#solarPdfOverlay{position:fixed;inset:0;background:rgba(20,19,16,.72);z-index:100000;display:grid;place-items:center;padding:20px;backdrop-filter:blur(4px)}.solar-pdf-card{width:min(390px,92vw);background:#fff;border:1px solid #eadfce;border-radius:18px;padding:30px;text-align:center;box-shadow:0 30px 80px #0005}.solar-pdf-card h3{margin:15px 0 6px;font:700 24px "Playfair Display",serif}.solar-pdf-card p{margin:0;color:#777}.solar-spinner{width:42px;height:42px;border:4px solid #eee4d4;border-top-color:#c98d2f;border-radius:50%;margin:auto;animation:solarSpin .7s linear infinite}@keyframes solarSpin{to{transform:rotate(360deg)}}.solar-pdf-preview{width:min(1100px,96vw);height:min(92vh,900px);background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px #0007;display:flex;flex-direction:column}.solar-pdf-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;background:#f8f4ec;border-bottom:1px solid #eadfce}.solar-pdf-toolbar>div{display:flex;gap:7px;flex-wrap:wrap}.solar-pdf-preview iframe{border:0;width:100%;flex:1;background:#e8e8e8}@media(max-width:650px){.solar-pdf-toolbar{align-items:flex-start;flex-direction:column}}';
document.head.appendChild(style);
const warm=()=>{F.ensurePdfLib().catch(()=>{});F.loadMaster().catch(()=>{})};
if("requestIdleCallback" in window)requestIdleCallback(warm,{timeout:2500});else setTimeout(warm,1200);
})();
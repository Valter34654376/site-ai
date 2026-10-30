(()=>{
const F=window.SolarDocFiel;if(!F)return;
F.money=function(v){return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})};
F.loadMaster=async function(){
 const r=await fetch(F.MASTER,{cache:"no-store"});
 if(!r.ok)throw new Error("Molde do contrato não encontrado.");
 return new Uint8Array(await r.arrayBuffer());
};
F.generate=async function(id,tab){
 const L=await F.ensurePdfLib(),c=await F.getContract(id),cl=c.so_clients||{};
 const pdf=await L.PDFDocument.load(await F.loadMaster()),font=await pdf.embedFont(L.StandardFonts.Helvetica),p=pdf.getPages();
 const d=(pg,t,x,y,w,s,opt)=>F.drawTop(pg,t||"",x,y,w,s,font,opt||{});
 const total=Number(c.rental_value||0)+Number(c.cleaning_fee||0)+Number(c.additional_value||0);
 const extra=[c.additional_services,F.money(c.additional_value||0)!=="R$ 0,00"&&Number(c.additional_value||0)>0?F.money(c.additional_value):""].filter(Boolean).join(" - ");
 d(p[0],cl.name,297.5,204.7,224,10.5,{maxLines:2,minSize:7});
 d(p[0],cl.document,297.5,235.5,224,10.5,{maxLines:1,minSize:7});
 d(p[0],cl.address,297.5,251.2,224,9.75,{maxLines:1,minSize:7});
 d(p[0],c.event_name,297.5,265.2,224,9.75,{maxLines:1,minSize:7});
 d(p[0],F.brDate(c.event_date),297.5,279.4,224,10.5,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.setup_at),297.5,295.5,224,9.5,{maxLines:2,minSize:7});
 d(p[0],F.brDateTime(c.start_at),297.5,321.6,224,10,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.end_at),297.5,337.2,224,10,{maxLines:1,minSize:7});
 d(p[0],F.brDateTime(c.teardown_at),297.5,352.8,224,9.5,{maxLines:1,minSize:7});
 d(p[0],c.capacity?c.capacity+" pessoas, observadas as regras de segurança e capacidade legal":"",297.5,366.7,224,9,{maxLines:2,minSize:6.5});
 d(p[0],F.money(c.rental_value),297.5,389.4,224,9,{maxLines:1,minSize:6.5});
 d(p[0],F.money(c.cleaning_fee),297.5,402.5,224,9.5,{maxLines:1,minSize:6.5});
 d(p[0],extra,297.5,416.5,224,9,{maxLines:1,minSize:6.5});
 d(p[0],F.money(total),297.5,430.5,224,9.5,{maxLines:1,minSize:6.5});
 d(p[0],c.guarantee_text,297.5,445.5,224,9,{maxLines:1,minSize:6.5});
 d(p[0],c.payment_terms,297.5,459.6,224,9,{maxLines:1,minSize:6.5});
 d(p[0],c.observations,297.5,475.6,224,9,{maxLines:1,minSize:6.5});
 const tenant="LOCATÁRIO(A): "+(cl.name||"")+", CPF/CNPJ nº "+(cl.document||"")+", endereço "+(cl.address||"")+", telefone "+(cl.phone||"")+", e-mail "+(cl.email||"")+".";
 d(p[0],tenant,70.9,606,448,10,{maxLines:3,minSize:7.5,lineHeight:11.4});
 if(c.capacity)d(p[1],String(c.capacity),263.2,65.4,126,8.75,{maxLines:1,minSize:7});
 d(p[3],F.signingDate(),70.9,332,210,10,{maxLines:1,minSize:8});
 d(p[3],"LOCATÁRIO(A): "+String(cl.name||"").toUpperCase(),106.4,441.2,369,10,{maxLines:1,minSize:7});
 const bytes=await pdf.save(),blob=new Blob([bytes],{type:"application/pdf"}),url=URL.createObjectURL(blob);
 if(tab){tab.location.href=url}else{const a=document.createElement("a");a.href=url;a.download="contrato-solar-opara-"+F.safeName(c.event_name)+".pdf";a.click()}
 setTimeout(()=>URL.revokeObjectURL(url),120000);
};
document.addEventListener("click",function(e){
 const b=e.target.closest("[data-doc]");if(!b)return;
 e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
 const tab=window.open("","_blank");
 if(tab){tab.document.write("<title>Gerando contrato...</title><p style='font-family:Arial;padding:24px'>Gerando contrato fiel ao modelo Solar Opará...</p>")}
 F.generate(b.dataset.doc,tab).catch(err=>{if(tab)tab.close();alert(err.message||String(err))});
},true);
})();
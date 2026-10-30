(()=>{
const F=window.SolarDocFiel=window.SolarDocFiel||{};
F.MASTER="/CONTRATO_SOLAR_OPARA_MASTER.pdf";
F.SB="https://bdfojankowlfuezdhdjl.supabase.co";
F.KEY="sb_publishable_mHNwZ6rrplQy9P-0o3wfnQ_iRC_AvYY";
F.session=()=>localStorage.getItem("solar_session")||"";
F.ensurePdfLib=async()=>{
 if(window.PDFLib)return window.PDFLib;
 await new Promise((ok,no)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js";s.onload=ok;s.onerror=()=>no(new Error("Não foi possível carregar o gerador de PDF."));document.head.appendChild(s)});
 return window.PDFLib;
};
F.getContract=async id=>{
 const r=await fetch(F.SB+"/rest/v1/so_contracts?id=eq."+encodeURIComponent(id)+"&select=*,so_clients(*)",{headers:{apikey:F.KEY,"x-solar-session":F.session()}});
 if(!r.ok)throw new Error("Não foi possível carregar o contrato.");
 const a=await r.json();if(!a[0])throw new Error("Contrato não encontrado.");return a[0];
};
F.brDate=v=>{
 if(!v)return "";
 const s=String(v).slice(0,10),m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 return m?m[3]+"/"+m[2]+"/"+m[1]:s;
};
F.brDateTime=v=>{
 if(!v)return "";
 const d=new Date(v);if(isNaN(d))return String(v);
 const p=new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(d);
 const g=t=>p.find(x=>x.type===t)?.value||"";
 return g("day")+"/"+g("month")+"/"+g("year")+" - "+g("hour")+":"+g("minute")+"h";
};
F.signingDate=()=>{
 const ms=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
 const d=new Date(),p=new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric"}).formatToParts(d);
 const g=t=>p.find(x=>x.type===t)?.value||"";
 return "Pirapora/MG, "+Number(g("day"))+" de "+ms[Number(g("month"))-1]+" de "+g("year")+".";
};
F.wrap=(text,font,size,width)=>{
 const words=String(text??"").trim().split(/\s+/).filter(Boolean),out=[];let line="";
 for(const w of words){const t=line?line+" "+w:w;if(font.widthOfTextAtSize(t,size)<=width)line=t;else{if(line)out.push(line);line=w}}
 if(line)out.push(line);return out.length?out:[""];
};
F.drawTop=(page,text,x,top,width,size,font,opt={})=>{
 const maxLines=opt.maxLines||1,lineHeight=opt.lineHeight||size*1.15,min=opt.minSize||6;
 let fs=size,lines=F.wrap(text,font,fs,width);
 while((lines.length>maxLines||lines.some(v=>font.widthOfTextAtSize(v,fs)>width))&&fs>min){fs-=.25;lines=F.wrap(text,font,fs,width)}
 lines=lines.slice(0,maxLines);
 for(let i=0;i<lines.length;i++)page.drawText(lines[i],{x,y:page.getHeight()-top-fs-i*lineHeight,size:fs,font,color:window.PDFLib.rgb(0,0,0)});
};
F.safeName=s=>String(s||"contrato").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase();
})();
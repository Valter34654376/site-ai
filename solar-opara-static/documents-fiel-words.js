(()=>{
const F=window.SolarDocFiel;if(!F||!F.generate)return;
let writer=null;
async function ensureWriter(){
 if(writer)return writer;
 const m=await import("https://esm.unpkg.com/written-number@0.11.1?target=es2022");
 writer=m.default||m;
 return writer;
}
function moneyWords(text,w){
 const m=String(text||"").match(/R\$\s*([\d.]+,\d{2})/);
 if(!m)return text;
 const n=Number(m[1].replace(/\./g,"").replace(",","."));
 if(!Number.isFinite(n))return text;
 const reais=Math.floor(n),cent=Math.round((n-reais)*100);
 let ext=w(reais,{lang:"pt"})+" "+(reais===1?"real":"reais");
 if(cent)ext+=" e "+w(cent,{lang:"pt"})+" "+(cent===1?"centavo":"centavos");
 return text+" ("+ext+")";
}
const oldGenerate=F.generate;
F.generate=async function(id,tab){
 const w=await ensureWriter(),oldDraw=F.drawTop;
 F.drawTop=function(page,text,x,top,width,size,font,opt){
  if([389.4,402.5,430.5].some(v=>Math.abs(top-v)<0.2))text=moneyWords(text,w);
  if(Math.abs(x-263.2)<0.2&&Math.abs(top-65.4)<0.2&&/^\d+$/.test(String(text||"")))text=text+" ("+w(Number(text),{lang:"pt"})+")";
  return oldDraw(page,text,x,top,width,size,font,opt);
 };
 try{return await oldGenerate(id,tab)}finally{F.drawTop=oldDraw}
};
})();
(()=>{if(document.querySelector('script[data-nfse-auto]'))return;const x=document.createElement('script');x.src='/nfse-auto.js';x.dataset.nfseAuto='1';x.defer=true;document.head.appendChild(x)})();

const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const n=parseInt(process.argv[2]);const base=process.argv[3]||'.';const out=base+'/png';fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
await p.setContent('<html><body style="margin:0"><div id="s"></div></body></html>');
for(let i=0;i<n;i++){const svg=fs.readFileSync(base+`/svg/f${String(i).padStart(4,'0')}.svg`,'utf8');
 await p.evaluate(s=>{document.getElementById('s').innerHTML=s},svg);
 await p.screenshot({path:`${out}/f${String(i).padStart(4,'0')}.png`,clip:{x:0,y:0,width:1080,height:1920}});}
await b.close();})();

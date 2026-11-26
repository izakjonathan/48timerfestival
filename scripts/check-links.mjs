// Read-only crawler. Usage: node scripts/check-links.mjs https://your-deployed-site [--external]
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {load} from 'cheerio';
const exec=promisify(execFile);
const base=process.argv[2]||'http://127.0.0.1:4328';
const origin=new URL(base).origin;
const external=process.argv.includes('--external');
const curl=async(url)=>{try{return (await exec('curl',['-sS','-L','--max-time','14',url],{maxBuffer:10*1024*1024})).stdout;}catch{return '';}};
const pageData=JSON.parse(await curl(origin+'/api/editor'));
const links=new Set(pageData.pages.map(path=>origin+path));
for(const path of pageData.pages){
 const html=await curl(origin+path),$=load(html);
 $('a[href]').each((_,el)=>{try{const url=new URL($(el).attr('href'),origin+path);url.hash='';if(['https:','http:'].includes(url.protocol)&&(external||url.origin===origin))links.add(url.href);}catch{}});
}
const queue=[...links],results=[];
await Promise.all(Array.from({length:6},async()=>{while(queue.length){
 const url=queue.shift();let status;
 try{const r=await exec('curl',['-sS','-L','--max-time','14','-o','/dev/null','-w','%{http_code}',url]);status=Number(r.stdout);}catch{status=0;}
 results.push({url,status,internal:new URL(url).origin===origin});
}}));
const broken=results.filter(r=>[404,410].includes(r.status));const uncertain=results.filter(r=>r.status===0||r.status>=400&&!broken.includes(r));
console.log(JSON.stringify({checked:results.length,ok:results.filter(r=>r.status>=200&&r.status<400).length,broken,uncertain},null,2));
if(broken.some(r=>r.internal))process.exitCode=1;

import {get,put} from '@vercel/blob';
import {mkdir,readFile,rename,writeFile} from 'node:fs/promises';
import {hasBlobStore} from './editor.js';
import pages from './pages.js';
export const validPath=path=>typeof path==='string'&&(Object.hasOwn(pages,path)||/^\/(?:en\/)?program\/event\/[a-f0-9-]{36}\/$/.test(path));
export const dayKey=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Copenhagen',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export async function readDay(day){
 if(hasBlobStore()){
  const result=await get('48timerfestival/analytics/'+day+'.json',{access:'private',useCache:false});
  return result?{counts:await new Response(result.stream).json(),etag:result.blob.etag}:{counts:{}};
 }
 if(process.env.VERCEL)return {counts:{}};
 try{return {counts:JSON.parse(await readFile('.festival-analytics/'+day+'.json','utf8'))};}catch(e){if(e.code==='ENOENT')return {counts:{}};throw e;}
}
let queue=Promise.resolve();
export async function increment(path){
 const day=dayKey();
 if(hasBlobStore()){
  for(let attempt=0;attempt<4;attempt++){
   const {counts,etag}=await readDay(day);
   if(!Object.hasOwn(counts,path)&&Object.keys(counts).length>=1050)return;
   counts[path]=(counts[path]??0)+1;
   try{await put('48timerfestival/analytics/'+day+'.json',JSON.stringify(counts),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:Boolean(etag),...(etag?{ifMatch:etag}:{})});return;}catch(e){if(attempt===3)throw e;await new Promise(resolve=>setTimeout(resolve,20*(attempt+1)));}
  }
 }else if(!process.env.VERCEL){
  const task=queue.then(async()=>{const {counts}=await readDay(day);counts[path]=(counts[path]??0)+1;await mkdir('.festival-analytics',{recursive:true});const temp='.festival-analytics/'+crypto.randomUUID();await writeFile(temp,JSON.stringify(counts));await rename(temp,'.festival-analytics/'+day+'.json');});
  queue=task.catch(()=>{});return task;
 }
}
export async function lastWeek(){
 const now=Date.now(),dates=Array.from({length:7},(_,i)=>dayKey(new Date(now-i*86400000))).reverse(),records=await Promise.all(dates.map(readDay));
 const totals={},days=dates.map((date,i)=>{let total=0;for(const [path,n] of Object.entries(records[i].counts)){totals[path]=(totals[path]??0)+n;total+=n;}return {date,total};});
 return {days,total:days.reduce((n,d)=>n+d.total,0),pages:Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,30)};
}

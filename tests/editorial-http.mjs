// Run only against a local isolated Next.js server. Never use production.
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import sharp from 'sharp';
import {newBlock} from '../lib/editorial.js';
const base='http://127.0.0.1:'+ (process.env.TEST_PORT||4328);
const req=async(path,body,form=false)=>{
 const r=await fetch(base+path,body?{method:'POST',headers:{origin:base,'content-type':form?'application/x-www-form-urlencoded':'application/json'},body:form?new URLSearchParams(body):JSON.stringify(body)}:{});
 return [r,(r.headers.get('content-type')??'').includes('application/json')?await r.json():await r.text()];
};
const [,initial]=await req('/api/editor');
assert.equal(initial.pages.length,28);
const bitmap=await sharp({create:{width:320,height:240,channels:3,background:'#ff533d'}}).png().toBuffer();
const uploadForm=new FormData();uploadForm.set('image',new Blob([bitmap],{type:'image/png'}),'test-upload.png');
const upload=await fetch(base+'/api/editor',{method:'POST',headers:{origin:base},body:uploadForm});assert.equal(upload.status,200);
const asset=await upload.json();assert.equal(asset.width,320);assert.equal(asset.height,240);assert.match(asset.url,/^\/media\//);
const assetResponse=await fetch(base+asset.url);assert.equal(assetResponse.status,200);assert.equal(assetResponse.headers.get('content-type'),'image/webp');
const route='/en/',block={...newBlock('split'),heading:'TEST BLOCK',body:'TEST DESCRIPTION',position:'bottom',image:asset.url,alt:'Test image',focus:{x:10,y:70}};
const dates=initial.draft.festivalDates??initial.defaultDates;
const eventId='00000000-0000-0000-0000-000000000000';
const event={day:dates.start,start:'19:00',end:'21:00',category:'music',titleDa:'Test dansk',titleEn:'Test event',venue:'Example venue',address:'Blågårds Plads 2, København N',descriptionDa:'Dansk test',descriptionEn:'English test',link:''};
const draft={...initial.draft,mediaLibrary:{...initial.draft.mediaLibrary,[asset.url]:'Test image'},mediaDimensions:{...initial.draft.mediaDimensions,[asset.url]:{width:asset.width,height:asset.height}},blocks:{[route]:[block]},seo:{[route]:{title:'TEST SEO',description:'TEST META',image:asset.url}},programEvents:{[eventId]:event}};
const [invalid]=await req('/api/editor',{action:'save',revision:initial.revision,draft:{...draft,blocks:{[route]:[{...block,href:'javascript:alert(1)'}]}}});assert.equal(invalid.status,400);
const [preview,payload]=await req('/api/editor',{path:route,draft:JSON.stringify(draft)},true);assert.equal(preview.status,200);assert.match(payload,/festival-draft-preview/);
const [savedResponse,saved]=await req('/api/editor',{action:'save',revision:initial.revision,draft});assert.equal(savedResponse.status,200,JSON.stringify(saved));
const [pubResponse,pub]=await req('/api/editor',{action:'publish',revision:saved.revision,draft:saved.draft});assert.equal(pubResponse.status,200,JSON.stringify(pub));
assert(pub.history.length>=1);
const [stale]=await req('/api/editor',{action:'publish',revision:saved.revision,draft});assert.equal(stale.status,409);
const internal=new Set(), external=new Set();
for(const path of initial.pages){
 const [r,html]=await req(path);assert.equal(r.status,200,path);const $=load(html);
 assert.equal($('.fn-native').length,1,path);assert.equal($('main').length,1,path);assert.ok($('main h1').length>=1,path);assert.equal($('img:not([alt])').length,0,path);assert.ok($('.fn-skip').length===1,path);assert.ok($('meta[name=description]').attr('content'),path);
 assert.equal(new URL($('link[rel=canonical]').attr('href')).pathname,path,path);
 assert.equal($('link[rel=alternate][hreflang=da-DK]').length,1,path);
 assert.equal($('link[rel=alternate][hreflang=en-GB]').length,1,path);
 assert.ok($('meta[property="og:image"]').attr('content'),path);
 if(path===route){assert.match($('title').text(),/TEST SEO/);assert.equal($('meta[name=description]').attr('content'),'TEST META');assert.match($('.fn-custom-block').text(),/TEST BLOCK/);assert.match($('.fn-block-photo img').attr('style'),/10% 70%/);assert.equal($('.fn-block-photo img').attr('alt'),'Test image');}
 if(path==='/')assert.equal($('.fn-custom-block').length,0);
 if(path.endsWith('/bliv-aktoer/'))assert.match($('.festival-registration').attr('action'),/docs.google.com\/forms/);
 $('a[href]').each((_,el)=>{const h=$(el).attr('href');if(h.startsWith('/')&&!h.startsWith('//')&&!h.startsWith('/media/')&&!h.startsWith('/festival-'))internal.add(h.split(/[?#]/)[0]);else if(/^https?:/.test(h))external.add(h);});
}
const eventPath='/en/program/event/'+eventId+'/';
const [ep,html]=await req(eventPath);assert.equal(ep.status,200);const $=load(html);
const schema=JSON.parse($('script[type="application/ld+json"]').text());assert.equal(schema['@type'],'Event');assert.equal(schema.name,'Test event');assert.equal(schema.location.address.name,event.address);assert.match(schema.startDate,/T19:00:00\+02:00$/);
const [sitemap,xml]=await req('/sitemap.xml');assert.equal(sitemap.status,200);assert(xml.includes(eventPath)&&xml.includes('hreflang="da-DK"'));
const image=await fetch(base+'/social-image?path=%2Fen%2F');assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert((await image.arrayBuffer()).byteLength>5000);
const [,statsBefore]=await req('/api/analytics');
const noTrack=await fetch(base+'/api/analytics',{method:'POST',headers:{origin:base,dnt:'1','content-type':'application/json'},body:JSON.stringify({path:route})});assert.equal(noTrack.status,204);
const [,noTrackStats]=await req('/api/analytics');assert.equal(noTrackStats.total,statsBefore.total);
const [analytics]=await req('/api/analytics',{path:route});assert.equal(analytics.status,204);
const [,stats]=await req('/api/analytics');assert.equal(stats.total,statsBefore.total+1);assert(stats.pages.some(([p])=>p===route));
const broken=[];for(const path of internal){const response=await fetch(base+path,{redirect:'follow'});if(!response.ok)broken.push([path,response.status]);}
const [restore,restored]=await req('/api/editor',{action:'restore',revision:pub.revision,historyId:pub.history[0].id});assert.equal(restore.status,200);assert.deepEqual(restored.published,initial.published);assert(restored.history.length>=2);
console.log('Internal link check:',internal.size,'links; broken:',JSON.stringify(broken));
console.log('External links discovered:',external.size);
console.log('All 28 routes, bilingual metadata, OG image, sitemap, blocks, history, publish, restore, event details and aggregate analytics passed.');
if(broken.length)process.exitCode=2;

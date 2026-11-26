import {ImageResponse} from 'next/og';
import {get} from '@vercel/blob';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {hasBlobStore} from '../../lib/editor.js';
import {publicDocument} from '../../lib/public-page-cache.js';
import {defaultSEO,eventAt} from '../../lib/seo.js';
import {isMedia} from '../../lib/editorial.js';
import pages from '../../lib/pages.js';
import {festivalDates,formatDates} from '../../lib/festival-dates.js';
export const dynamic='force-dynamic';
export async function GET(request){
 const route=new URL(request.url).searchParams.get('path')||'/';
 const doc=await publicDocument(),event=eventAt(route,doc);
 if(!Object.hasOwn(pages,route)&&!event)return new Response(null,{status:404});
 const en=route.startsWith('/en/'),defaults=defaultSEO(route,doc),seo=doc.seo?.[route]??{};
 const title=event?(en?event.titleEn:event.titleDa):seo.title||defaults.title;
 const media=seo.image||defaults.image;
 let img;
 try{
  if(isMedia(media)){
   let bytes;
   if(media.startsWith('/festival-media/'))bytes=await readFile('public'+media);
   else if(hasBlobStore()){const result=await get('48timerfestival/media/'+media.split('/').at(-1),{access:'private'});if(result)bytes=Buffer.from(await new Response(result.stream).arrayBuffer());}
   else bytes=await readFile('.festival-media/'+media.split('/').at(-1));
   if(bytes)img='data:image/png;base64,'+(await sharp(bytes).resize(640,560,{fit:'inside'}).png().toBuffer()).toString('base64');
  }
 }catch{}
 const clean=title.replace(/\s*\|\s*48TIMER Festival$/i,'').slice(0,100);
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',background:'#ff533d',color:'#222453',padding:42,gap:44,fontFamily:'sans-serif'}}>
 <div style={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:'100%',flex:1,minWidth:0}}><div style={{fontSize:26,fontWeight:700}}>48TIMER FESTIVAL · NØRREBRO</div><div style={{display:'flex',fontSize:clean.length>60?48:64,lineHeight:1.05,fontWeight:700,wordBreak:'break-word'}}>{clean}</div><div style={{display:'flex',alignSelf:'flex-start',background:'#fff642',padding:'15px 24px',fontSize:30,fontWeight:700}}>{formatDates(festivalDates(doc),en?'en':'da')}</div></div>
 {img&&<div style={{display:'flex',width:530,height:546,alignItems:'center',justifyContent:'center',background:'#47c2c3'}}><img src={img} width={530} height={546} style={{objectFit:'contain'}}/></div>}
 </div>,{width:1200,height:630,headers:{'Cache-Control':'public, max-age=300, s-maxage=300'}});
}

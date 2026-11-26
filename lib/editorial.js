import { sectionColors } from './design.js';
export const blockTypes={text:'Text',image:'Image',split:'Image and text',cta:'Call to action',quote:'Quote'};
export const isRecord=value=>Boolean(value&&typeof value==='object'&&!Array.isArray(value));
export const isMedia=value=>typeof value==='string'&&(/^\/media\/[0-9a-f-]{36}\.webp$/.test(value)||/^\/festival-media\/press\/(48-Logo-Hvid|48-Logo-Sort-Emblem|48-Logo-Sort)\.png$/.test(value));
export const isLink=value=>typeof value==='string'&&value.length<=2000&&(!value||(/^(https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(value)&&!/[\u0000-\u001f\\]/.test(value)));
export const validFocus=value=>isRecord(value)&&Object.keys(value).length===2&&['x','y'].every(k=>Number.isFinite(value[k])&&value[k]>=0&&value[k]<=100);
export const focusStyle=value=>validFocus(value)?{objectPosition:value.x+'% '+value.y+'%'}:undefined;
export function newBlock(type){return {id:crypto.randomUUID(),type,color:'#47c2c3',heading:'',body:'',image:'',alt:'',href:'',button:'',focus:{x:50,y:50},position:'bottom'};}
export function validBlocks(blocks,routes){
 return isRecord(blocks)&&Object.entries(blocks).every(([path,list])=>routes.includes(path)&&Array.isArray(list)&&list.length<=30&&new Set(list.map(b=>b?.id)).size===list.length&&list.every(b=>isRecord(b)&&Object.keys(b).every(k=>Object.hasOwn(newBlockShape,k))&&/^[a-f0-9-]{36}$/.test(b.id)&&Object.hasOwn(blockTypes,b.type)&&Object.hasOwn(sectionColors,b.color)&&['top','bottom'].includes(b.position)&&['heading','body','alt','button'].every(k=>typeof b[k]==='string'&&b[k].length<=(k==='body'?10000:300))&&typeof b.image==='string'&&(!b.image||isMedia(b.image))&&isLink(b.href)&&validFocus(b.focus)));
}
const newBlockShape={id:1,type:1,color:1,heading:1,body:1,image:1,alt:1,href:1,button:1,focus:1,position:1};
export function completeBlock(b){return Boolean(b.heading.trim()||b.body.trim()||(b.image&&['image','split'].includes(b.type))||(b.button.trim()&&b.href));}
export function validSEO(seo,routes){return isRecord(seo)&&Object.entries(seo).every(([route,v])=>routes.includes(route)&&isRecord(v)&&Object.keys(v).every(k=>['title','description','image'].includes(k))&&Object.entries(v).every(([k,x])=>typeof x==='string'&&(k==='title'?x.length<=120:k==='description'?x.length<=320:!x||isMedia(x))));}
export function validLibrary(library){return isRecord(library)&&Object.keys(library).length<=1000&&Object.entries(library).every(([url,label])=>isMedia(url)&&typeof label==='string'&&label.length<=200);}
export function mediaLibrary(images,draft){
 const all={};
 for(const page of Object.values(images??{}))for(const [key,item] of Object.entries(page)){
   if(isMedia(item.value))all[item.value]=item.label;
   if(isMedia(draft.images?.[key]))all[draft.images[key]]=item.label+' · replacement';
 }
 return {...all,...draft.mediaLibrary};
}
export function historyList(state){
 if(Array.isArray(state.history))return state.history;
 return state.previous?[{id:'legacy-previous',at:null,revision:null,document:state.previous}]:[];
}
export function recordPublication(state,next,now=new Date().toISOString()){
 if(JSON.stringify(state.published)===JSON.stringify(next))return false;
 const history=historyList(state);
 state.history=[{id:crypto.randomUUID(),revision:state.publishedRevision??null,at:state.publishedAt??null,document:state.published},...history].slice(0,20);
 state.previous=state.published;state.published=next;state.publishedAt=now;state.publishedRevision=state.revision+1;return true;
}
export function historySummary(state){return historyList(state).map(({id,revision,at})=>({id,revision,at}));}
export function clientState(state){const {history,...rest}=state;return {...rest,history:historySummary(state)};}

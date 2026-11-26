import {increment,lastWeek,validPath} from '../../../lib/analytics.js';
const headers={'Cache-Control':'no-store'};
export async function GET(){try{return Response.json(await lastWeek(),{headers});}catch{return Response.json({error:'Analytics unavailable'},{status:503,headers});}}
export async function POST(request){
 try{
  const origin=request.headers.get('origin');
  if(!origin||new URL(origin).host!==request.headers.get('host'))return new Response(null,{status:403});
  if(request.headers.get('dnt')==='1'||request.headers.get('sec-gpc')==='1')return new Response(null,{status:204});
  const body=await request.text();if(body.length>350)return new Response(null,{status:400});
  const {path}=JSON.parse(body);if(!validPath(path))return new Response(null,{status:400});
  await increment(path);return new Response(null,{status:204});
 }catch{return new Response(null,{status:503});}
}

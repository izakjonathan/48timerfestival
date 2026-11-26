import { imageKey } from '../../../lib/appearance.js';
import archivedMedia from '../../../content/archived-media.json';

export async function GET(request,{params}) {
  const {asset}=await params;
  const path='/festival-assets/'+asset.map(encodeURIComponent).join('/');
  const url=archivedMedia[imageKey(path)]??archivedMedia[imageKey('/festival-assets/'+asset.join('/'))];
  if(!url)return new Response('Media not found',{status:404});
  return Response.redirect(new URL(url,request.url),308);
}

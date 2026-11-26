import pages from '../lib/pages.js';
import {publicDocument} from '../lib/public-page-cache.js';
import {absolute,alternateRoutes,eventRoute,eventAt} from '../lib/seo.js';
import {publishedEvents} from '../lib/program.js';
export const dynamic='force-dynamic';
export default async function sitemap(){
 const doc=await publicDocument();
 const routes=[...Object.keys(pages),...publishedEvents(doc.programEvents).flatMap(e=>[eventRoute(e.id),eventRoute(e.id,'en')])];
 return routes.map(route=>{const {da,en}=alternateRoutes(route);return {url:absolute(route),alternates:{languages:{'da-DK':absolute(da),'en-GB':absolute(en)}},changeFrequency:route.includes('program')?'daily':'weekly'};});
}

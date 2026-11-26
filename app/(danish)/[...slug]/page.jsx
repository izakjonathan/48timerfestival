import {metadataFor,eventAt} from '../../../lib/seo.js';
import {publicDocument} from '../../../lib/public-page-cache.js';
import NativePage from '../../../lib/native-page.jsx';
import pages from '../../../lib/pages.js';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}) {
  const {slug}=await params;
  const route='/'+slug.join('/')+'/';
  const doc=await publicDocument();
  if(!Object.hasOwn(pages,route)&&!eventAt(route,doc))return {robots:{index:false,follow:false}};
  return metadataFor(route,doc);
}
export default async function Page({params}) {
  const {slug}=await params;
  const route='/'+slug.join('/')+'/';
  if(route.startsWith('/en/')||(!Object.hasOwn(pages,route)&&!eventAt(route,await publicDocument())))notFound();
  return <NativePage route={route}/>;
}

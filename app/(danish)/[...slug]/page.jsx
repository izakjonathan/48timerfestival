import NativePage from '../../../lib/native-page.jsx';
import pages from '../../../lib/pages.js';
import {notFound} from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}) {
  const {slug}=await params;
  const route='/'+slug.join('/')+'/';
  return {title:pages[route]?.title??'48TIMER Festival'};
}
export default async function Page({params}) {
  const {slug}=await params;
  const route='/'+slug.join('/')+'/';
  if(!Object.hasOwn(pages,route)||route.startsWith('/en/'))notFound();
  return <NativePage route={route}/>;
}

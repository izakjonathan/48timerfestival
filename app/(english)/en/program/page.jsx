import {metadataFor,eventAt} from '../../../../lib/seo.js';
import {publicDocument} from '../../../../lib/public-page-cache.js';
import NativePage from '../../../../lib/native-page.jsx';
export const dynamic = 'force-dynamic';
export async function generateMetadata(){return metadataFor('/en/program/',await publicDocument());}
export default function Page() { return <NativePage route="/en/program/"/>; }

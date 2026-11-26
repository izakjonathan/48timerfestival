import { NativeContent } from './native-site.jsx';
import { publicDocument } from './public-page-cache.js';

export default async function NativePage({ route }) {
  return <NativeContent route={route} document={await publicDocument()}/>;
}

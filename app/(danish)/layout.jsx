import {browserThemeColor} from '../../lib/appearance.js';
import {publicDocument} from '../../lib/public-page-cache.js';
export async function generateViewport(){return {themeColor:browserThemeColor(await publicDocument())};}
export default function Layout({children}) {
  return <html lang="da"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="/festival-native.css"/></head><body style={{margin:0}}>{children}</body></html>;
}

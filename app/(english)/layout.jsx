import Script from 'next/script';
export default function Layout({children}) {
  return <html lang="en"><head><link rel="stylesheet" href="/festival-native.css"/></head><body style={{margin:0}}>{children}<Script src="/festival-native.js" strategy="afterInteractive"/></body></html>;
}

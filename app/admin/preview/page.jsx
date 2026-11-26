'use client';
import { useEffect, useState } from 'react';
import { NativeContent } from '../../../lib/native-site.jsx';

export default function PreviewPage() {
  const [preview,setPreview] = useState(null);
  useEffect(() => {
    try {
      const data = JSON.parse(sessionStorage.getItem('festival-draft-preview'));
      if (data?.route && data?.document) {
        document.documentElement.lang = data.route.startsWith('/en/') ? 'en' : 'da';
        document.body.style.margin = '0';
        setPreview(data);
      }
    }
    catch { setPreview(null); }
  }, []);
  if (!preview) return <p>Open a draft preview from the editor.</p>;
  return <><link rel="stylesheet" href="/festival-native.css"/><NativeContent route={preview.route} document={preview.document}/></>;
}

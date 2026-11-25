import { readFile } from 'node:fs/promises';
import { stylesheets, themeStylesheet } from '../../../lib/site-render.js';

export async function GET(request, { params }) {
  const { asset } = await params;
  const path = '/' + asset.join('/');
  if (!stylesheets.has(path)) return new Response(null, { status: 404 });
  let css;
  try {
    css = await readFile('public/festival-assets' + path, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const origin = await fetch('https://www.48timerfestival.dk' + path, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (!origin?.ok) return Response.redirect(new URL('/festival-assets' + path, request.url));
    css = await origin.text();
  }
  try { css = themeStylesheet(css, path); } catch {
    return Response.redirect(new URL('/festival-assets' + path, request.url));
  }
  return new Response(css, {
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}

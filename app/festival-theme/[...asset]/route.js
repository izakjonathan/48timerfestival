import { stylesheetSnapshot, themeStylesheet } from '../../../lib/site-render.js';

export async function GET(request, { params }) {
  const { asset } = await params;
  const path = '/' + asset.join('/');
  const source = path === '/external/leaflet.css' ? 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' : path;
  if (!Object.hasOwn(stylesheetSnapshot, source)) return new Response(null, { status: 404 });
  const original = stylesheetSnapshot[source];
  let css = original;
  try { css = themeStylesheet(original, source); } catch (error) { console.error('Unable to theme', source, error.message); }
  return new Response(css, {
    headers: { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}

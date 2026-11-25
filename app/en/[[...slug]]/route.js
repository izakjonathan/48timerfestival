import { readState } from '../../../lib/editor.js';
import { renderPage } from '../../../lib/site-render.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug = [] } = await params;
  const route = '/en/' + (slug.length ? slug.join('/') + '/' : '');
  const { state } = await readState();
  const source = renderPage(route, state.published);
  if (!source) return new Response('Page not found', { status: 404 });
  return new Response(source, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

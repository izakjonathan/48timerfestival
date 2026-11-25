import { readState } from '../../lib/editor.js';
import pages from '../../lib/pages.js';
import { renderPage } from '../../lib/site-render.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug = [] } = await params;
  const route = slug.length ? '/' + slug.join('/') + '/' : '/';
  if (!Object.hasOwn(pages, route)) return new Response('Page not found', { status: 404 });
  const { state } = await readState();
  const source = renderPage(route, state.published);
  return new Response(source, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

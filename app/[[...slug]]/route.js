import { publicPage } from '../../lib/public-page-cache.js';
import pages from '../../lib/pages.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug = [] } = await params;
  const route = slug.length ? '/' + slug.join('/') + '/' : '/';
  if (!Object.hasOwn(pages, route)) return new Response('Page not found', { status: 404 });
  const source = await publicPage(route);
  return new Response(source, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

import { load } from 'cheerio';
import pages from '../../../content/pages.json';
import { readState } from '../../../lib/editor.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const { slug = [] } = await params;
  const route = '/en/' + (slug.length ? slug.join('/') + '/' : '');
  const page = pages[route];
  if (!page) return new Response('Page not found', { status: 404 });
  const { state } = await readState();
  const edits = state.published[route] ?? {};
  let source = page.html;
  if (Object.keys(edits).length) {
    const $ = load(source);
    for (const [key, edit] of Object.entries(edits)) {
      const node = $('[data-edit-key="' + key + '"]');
      if (page.fields[key].kind === 'image') {
        if (edit.value) node.attr('src', edit.value).removeAttr('srcset').removeAttr('sizes');
      } else {
        if (edit.value !== undefined) node.text(edit.value);
        if (edit.href !== undefined) node.attr('href', edit.href);
      }
    }
    source = $.html();
  }
  return new Response(source, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

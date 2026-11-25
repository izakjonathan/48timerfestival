import { unstable_cache } from 'next/cache';
import { readState } from './editor.js';
import { renderPage } from './site-render.js';

export const publicPageTag = 'festival-public-pages';
const renderPublished = async (route) => {
  const { state } = await readState();
  return renderPage(route, state.published);
};
const cachedPage = unstable_cache(renderPublished, ['festival-html-v1'], {
  revalidate: 300, tags: [publicPageTag],
});

export function publicPage(route) {
  return process.env.VERCEL ? cachedPage(route) : renderPublished(route);
}

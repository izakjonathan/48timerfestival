import { unstable_cache } from 'next/cache';
import { readState } from './editor.js';
export const publicPageTag = 'festival-public-pages';
const cachedDocument = unstable_cache(async () => (await readState()).state.published,
  ['festival-native-document', process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'],
  { revalidate: 300, tags: [publicPageTag] });

export async function publicDocument() {
  return process.env.VERCEL ? cachedDocument() : (await readState()).state.published;
}

import { readFile, writeFile, rename } from 'node:fs/promises';
import { get, put } from '@vercel/blob';

const file = '.festival-editor.json';
const blob = '48timerfestival/editor.json';
const empty = () => ({ revision: 0, draft: {}, published: {}, previous: null });

export const hasBlobStore = () => Boolean(
  process.env.BLOB_READ_WRITE_TOKEN ||
  (process.env.BLOB_STORE_ID && (process.env.VERCEL || process.env.VERCEL_OIDC_TOKEN))
);
export const canWrite = () => hasBlobStore() || !process.env.VERCEL;

export async function readState() {
  if (hasBlobStore()) {
    const result = await get(blob, { access: 'private', useCache: false, headers: { 'Accept-Encoding': 'identity' } });
    if (!result) return { state: empty() };
    return { state: await new Response(result.stream).json(), etag: result.blob.etag };
  }
  if (process.env.VERCEL) return { state: empty() };
  try {
    return { state: JSON.parse(await readFile(file, 'utf8')) };
  } catch (error) {
    if (error.code === 'ENOENT') return { state: empty() };
    throw error;
  }
}

export async function saveState(state, etag) {
  if (hasBlobStore()) {
    await put(blob, JSON.stringify(state), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
      allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
    });
    return;
  }
  const temporary = file + '.' + crypto.randomUUID();
  await writeFile(temporary, JSON.stringify(state));
  await rename(temporary, file);
}

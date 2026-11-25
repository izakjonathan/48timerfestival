import { renderCanvas } from '../../../lib/editor-canvas.js';
import { colorRoles } from '../../../lib/color-roles.js';
import { revalidateTag } from 'next/cache';
import { publicPageTag } from '../../../lib/public-page-cache.js';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import pages from '../../../lib/pages.js';
import { canWrite, hasBlobStore, readState, saveState } from '../../../lib/editor.js';

import { listColorElements, pageImages, palette, renderPage, validAppearance } from '../../../lib/site-render.js';

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET(request) {
  const { state } = await readState();
  const path = new URL(request.url).searchParams.get('elements');
  if (path !== null) {
    if (!Object.hasOwn(pages, path)) return json({ error: 'Unknown page.' }, 404);
    return json({ elements: listColorElements(path, state.draft) });
  }
  return json({
    ...state, writable: canWrite(), palette, images: pageImages,
    pages: Object.fromEntries(Object.entries(pages).map(([path, page]) => [path, page.fields])),
  });
}

function safeUrl(value) {
  return /^(https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(value) && !/[\u0000-\u001f]/.test(value);
}

function validate(draft) {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  return Object.entries(draft).every(([route, edits]) => {
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return false;
    if (route === 'colorRoles') return Object.entries(edits).every(([role, swatch]) =>
      Object.hasOwn(colorRoles, role) && typeof swatch === 'string' && Object.hasOwn(palette, swatch)
    );
    if (route === 'elementColors') return Object.entries(edits).every(([path, assignments]) =>
      Object.hasOwn(pages, path) && assignments && typeof assignments === 'object' && !Array.isArray(assignments) &&
      Object.entries(assignments).every(([id, values]) =>
        /^element-\d{1,5}$/.test(id) && values && typeof values === 'object' && !Array.isArray(values) &&
        Object.entries(values).every(([property, swatch]) =>
          ['color', 'background-color'].includes(property) && typeof swatch === 'string' && Object.hasOwn(palette, swatch)
        )
      )
    );
    if (route === 'colors' || route === 'images') return validAppearance(route, edits);
    if (!Object.hasOwn(pages, route)) return false;
    return Object.entries(edits).every(([key, edit]) => {
      const fields = pages[route].fields;
      if (!Object.hasOwn(fields, key) || !edit || typeof edit !== 'object' || Array.isArray(edit)) return false;
      return Object.entries(edit).every(([name, value]) => {
        if (typeof value !== 'string' || value.length > 10000) return false;
        if (name === 'href') return fields[key].kind === 'link' && safeUrl(value);
        return name === 'value' && (fields[key].kind !== 'image' || safeUrl(value));
      });
    });
  });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || new URL(origin).host !== host) return json({ error: 'Invalid origin.' }, 403);
  if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    return uploadImage(request);
  }
  const body = await request.text();
  const previewTab = request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded');
  if (body.length > (previewTab ? 1500000 : 500000)) return json({ error: 'Draft is too large.' }, 413);
  let input;
  try {
    if (previewTab) {
      const form = new URLSearchParams(body);
      input = { action: 'preview', path: form.get('path'), draft: JSON.parse(form.get('draft')) };
    } else input = JSON.parse(body);
  } catch { return json({ error: 'Invalid JSON.' }, 400); }
  if (input?.action === 'canvas') {
    if (!Object.hasOwn(pages, input.path) || !validate(input.draft) ||
        typeof input.instance !== 'string' || !/^[0-9a-f-]{36}$/.test(input.instance)) {
      return json({ error: 'Invalid editing view.' }, 400);
    }
    return new Response(renderCanvas(input.path, input.draft, origin, input.instance), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });
  }
  if (input?.action === 'preview') {
    if (!Object.hasOwn(pages, input.path) || !validate(input.draft)) return json({ error: 'Invalid preview.' }, 400);
    return new Response(renderPage(input.path, input.draft, { preview: true }), {
      headers: { 'Content-Type': (previewTab ? 'text/html' : 'text/plain') + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });
  }
  if (!canWrite()) return json({ error: 'Connect a private Vercel Blob store to enable publishing.' }, 503);
  if (!input || !['save', 'publish', 'restore'].includes(input.action)) return json({ error: 'Unknown action.' }, 400);
  const { state, etag } = await readState();
  if (input.revision !== state.revision) return json({ error: 'A newer revision exists. Reload before saving.' }, 409);
  if (input.action === 'restore') {
    if (!state.previous) return json({ error: 'There is no previous publication.' }, 409);
    [state.published, state.previous] = [state.previous, state.published];
    state.draft = state.published;
  } else {
    if (!validate(input.draft)) return json({ error: 'Invalid edit. Use an absolute URL or a site-relative path for links and images.' }, 400);
    state.draft = input.draft;
    if (input.action === 'publish' && JSON.stringify(state.draft) !== JSON.stringify(state.published)) {
      state.previous = state.published;
      state.published = state.draft;
    }
  }
  state.revision++;
  try {
    await saveState(state, etag);
  } catch (error) {
    console.error('Editor save failed', error);
    return json({ error: 'Save failed. Reload to check for a newer revision.' }, 409);
  }
  if (input.action !== 'save') revalidateTag(publicPageTag, { expire: 0 });
  return json(state);
}

async function uploadImage(request) {
  if (!canWrite()) return json({ error: 'Connect a private Blob store to upload images.' }, 503);
  if (Number(request.headers.get('content-length')) > 4200000) return json({ error: 'Choose an image under 4 MB.' }, 413);
  const image = (await request.formData()).get('image');
  if (!(image instanceof File) || image.size > 4000000) return json({ error: 'Choose an image under 4 MB.' }, 400);
  let data;
  try {
    data = await sharp(Buffer.from(await image.arrayBuffer()), { limitInputPixels: 40000000 })
      .rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 87 }).toBuffer();
  } catch {
    return json({ error: 'Choose a supported image such as JPEG, PNG or WebP.' }, 400);
  }
  const name = crypto.randomUUID() + '.webp';
  if (hasBlobStore()) {
    await put('48timerfestival/media/' + name, data, { access: 'private', contentType: 'image/webp' });
  } else {
    await mkdir('.festival-media', { recursive: true });
    await writeFile('.festival-media/' + name, data, { flag: 'wx' });
  }
  return json({ url: '/media/' + name });
}

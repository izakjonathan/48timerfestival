import {defaultSEO} from '../../../lib/seo.js';
import { validBlocks, completeBlock, validSEO, validLibrary, validFocus, isMedia, clientState, historyList, recordPublication } from '../../../lib/editorial.js';
import { fontRoles, googleFonts, sectionColors, validTypography } from '../../../lib/design.js';
import archivedMedia from '../../../content/archived-media.json';
import { contentRoutes, getContentCatalog, validContent } from '../../../lib/content-copy.js';
import { validFestivalDates, festivalDates, defaultDates } from '../../../lib/festival-dates.js';
import { completeEvent, validEvents } from '../../../lib/program.js';
import { getSectionsByPage, validSectionColors } from '../../../lib/sections.js';
import { revalidateTag } from 'next/cache';
import { publicPageTag } from '../../../lib/public-page-cache.js';
import { put } from '@vercel/blob';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import pages from '../../../lib/pages.js';
import { canWrite, hasBlobStore, readState, saveState } from '../../../lib/editor.js';

import { palette } from '../../../lib/appearance.js';
const pageImages = Object.fromEntries(Object.entries(pages).map(([route,page])=>[route,Object.fromEntries(Object.entries(page.images).map(([key,image])=>[key,{...image,value:archivedMedia[key]??image.value}]))]));
const imageKeys = new Set(Object.values(pageImages).flatMap(Object.keys));
function validAppearance(key,edits) {
  return Object.entries(edits).every(([id,value])=>typeof value==='string' && (key==='colors'?Object.hasOwn(palette,id)&&/^#[\da-f]{6}$/i.test(value):imageKeys.has(id)&&isMedia(value)));
}

const json = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  const { state } = await readState();
  return json({
    ...clientState(state), writable: canWrite(), images: pageImages,
    sections: getSectionsByPage(), sectionColors, fontRoles, googleFonts: Object.keys(googleFonts),
    pages: Object.keys(pages), seoDefaults:Object.fromEntries(Object.keys(pages).map(route=>[route,defaultSEO(route,state.draft)])), contentCatalog: Object.fromEntries(contentRoutes.map(route=>[route,getContentCatalog(route)])), defaultDates,
  });
}

function safeUrl(value) {
  return /^(https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(value) && !/[\u0000-\u001f]/.test(value);
}

function validate(draft) {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return false;
  return Object.entries(draft).every(([route, edits]) => {
    if (!edits || typeof edits !== 'object' || Array.isArray(edits)) return false;
    if (route === 'sectionBackgrounds') return validSectionColors(edits);
    if (route === 'programEvents') return validEvents(edits, festivalDates(draft));
    if (route === 'content') return validContent(edits);
    if (route === 'blocks') return validBlocks(edits,Object.keys(pages));
    if (route === 'seo') return validSEO(edits,Object.keys(pages));
    if (route === 'mediaLibrary') return validLibrary(edits);
    if (route === 'mediaDimensions') return Object.entries(edits).every(([url,size])=>isMedia(url)&&size&&['width','height'].every(k=>Number.isInteger(size[k])&&size[k]>0&&size[k]<=2400));
    if (route === 'imageFocus') return Object.entries(edits).every(([key,focus])=>imageKeys.has(key)&&validFocus(focus));
    if (route === 'festivalDates') return validFestivalDates(edits);
    if (route === 'typography') return validTypography(draft.fonts ?? {}, edits);
    if (route === 'fonts') return Object.entries(edits).every(([role, family]) =>
      Object.hasOwn(fontRoles, role) && typeof family === 'string' && Object.hasOwn(googleFonts, family)
    );
    if (route === 'colorRoles' || route === 'elementColors') return true;
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
  if (input?.action === 'preview') {
    if (!Object.hasOwn(pages, input.path) || !validate(input.draft)) return json({ error: 'Invalid preview.' }, 400);
    const payload = JSON.stringify({ route: input.path, document: input.draft }).replace(/</g, '\\u003c');
    const html = '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"><title>Draft preview</title></head><body><script>sessionStorage.setItem("festival-draft-preview", ' + JSON.stringify(payload).replace(/</g,'\\u003c') + ');location.replace("/admin/preview");</script></body></html>';
    return new Response(html, { headers: { 'Content-Type': (previewTab ? 'text/html' : 'text/plain') + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  if (!canWrite()) return json({ error: 'Connect a private Vercel Blob store to enable publishing.' }, 503);
  if (!input || !['save', 'publish', 'restore'].includes(input.action)) return json({ error: 'Unknown action.' }, 400);
  const { state, etag } = await readState();
  if (input.revision !== state.revision) return json({ error: 'A newer revision exists. Reload before saving.' }, 409);
  if (input.action === 'restore') {
    const selected=input.historyId?historyList(state).find(entry=>entry.id===input.historyId)?.document:state.previous;
    if (!selected) return json({ error: 'Publication not found.' }, 409);
    const library={...state.published.mediaLibrary,...state.draft.mediaLibrary,...selected.mediaLibrary};
    const dimensions={...state.published.mediaDimensions,...state.draft.mediaDimensions,...selected.mediaDimensions};
    recordPublication(state,selected);
    state.draft = {...state.published,...(Object.keys(library).length?{mediaLibrary:library}:{}),...(Object.keys(dimensions).length?{mediaDimensions:dimensions}:{})};
  } else {
    if (!validate(input.draft)) return json({ error: 'Invalid edit. Use an absolute URL or a site-relative path for links and images.' }, 400);
    if(input.action==='publish'&&Object.values(input.draft.blocks??{}).flat().some(b=>!completeBlock(b)))return json({error:'Fill or remove empty content blocks before publishing.'},400);
    if (input.action === 'publish' && !validEvents(input.draft.programEvents ?? {},festivalDates(input.draft),true)) return json({error:'All events must fall within the festival dates before publishing.'},400);
    if (input.action === 'publish' && Object.values(input.draft.programEvents ?? {}).some(event => !completeEvent(event))) {
      return json({ error: 'Complete the Danish and English titles, venue and start time for every event before publishing.' }, 400);
    }
    const { colors, colorRoles, elementColors, ...draft } = input.draft;
    state.draft = { ...draft, ...(state.draft.colors ? { colors: state.draft.colors } : {}) };
    if (input.action === 'publish') recordPublication(state,state.draft);
  }
  state.revision++;
  try {
    await saveState(state, etag);
  } catch (error) {
    console.error('Editor save failed', error);
    return json({ error: 'Save failed. Reload to check for a newer revision.' }, 409);
  }
  if (input.action !== 'save') revalidateTag(publicPageTag, { expire: 0 });
  return json(clientState(state));
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
  const {width,height}=await sharp(data).metadata();
  return json({ url: '/media/' + name, width, height });
}

'use client';

import { useEffect, useState } from 'react';
import { googleFonts, resolveTypography, typographyLimits } from '../../lib/design.js';

const weightNames = { 100: 'Thin', 200: 'Extra light', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'Semibold', 700: 'Bold', 800: 'Extra bold', 900: 'Black' };
const numberOptions = (min, max, step, current, defaultValue) => [...new Set([
  ...Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => Number((min + index * step).toFixed(3))),
  current, defaultValue,
])].sort((a, b) => a - b);

const languageFor = (path) => path.startsWith('/en/') ? 'English' : 'Dansk';
const labelFor = (path) => {
  if (path === '/en/') return 'Home';
  if (path === '/') return 'Forside';
  return path.split('/').filter(Boolean).at(-1).replaceAll('-', ' ');
};
const messages = { save: 'Draft saved.', publish: 'Published.', restore: 'Previous publication restored.' };

export default function Editor() {
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState({});
  const [path, setPath] = useState('/en/');
  const [status, setStatus] = useState('Loading editor…');
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState('');
  const [tab, setTab] = useState('sections');

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/editor');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setState(data);
        setDraft(data.draft);
        setStatus(data.writable ? '' : 'Connect a private Vercel Blob store to save and publish.');
      } catch (error) {
        setStatus(error.message);
      }
    }
    load();
  }, []);

  function updateAppearance(group, key, value) {
    setDraft((previous) => {
      const edits = { ...previous[group] };
      if (value) edits[key] = value;
      else delete edits[key];
      return { ...previous, [group]: edits };
    });
  }

  function updateFont(role, family) {
    setDraft(previous => {
      const fonts = { ...previous.fonts };
      if (family) fonts[role] = family;
      else delete fonts[role];
      const typography = { ...previous.typography, [role]: { ...previous.typography?.[role] } };
      const { weight } = resolveTypography(role, fonts, typography);
      if (typography[role].weight !== undefined) typography[role].weight = weight;
      return { ...previous, fonts, typography };
    });
  }

  function updateTypography(role, property, value) {
    setDraft(previous => ({
      ...previous,
      typography: { ...previous.typography, [role]: { ...previous.typography?.[role], [property]: Number(value) } },
    }));
  }

  async function submit(action) {
    setPending(true);
    setStatus('');
    try {
      const response = await fetch('/api/editor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, revision: state.revision, draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState({ ...state, ...data });
      setDraft(data.draft);
      setStatus(messages[action]);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  async function upload(key, file) {
    if (!file) return;
    setPending(true);
    setStatus('Uploading image…');
    try {
      const body = new FormData();
      body.set('image', await prepareImage(file));
      const response = await fetch('/api/editor', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      updateAppearance('images', key, data.url);
      setStatus('Image uploaded. Publish to apply it to the live page.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  const images = Object.entries(state?.images[path] ?? {}).filter(([, image]) =>
    image.label.toLowerCase().includes(filter.toLowerCase())
  ).sort(([, first], [, second]) => {
    const priority = (name) => name.startsWith('Main poster') ? 0 : 1;
    return priority(first.label) - priority(second.label) || first.label.localeCompare(second.label);
  });
  const disabled = !state?.writable || pending;
  return <main className="editor">
    <header className="editor-header">
      <div><p>48 Timer Festival</p><h1>Site editor</h1></div>
      <a href={path} target="_blank" rel="noreferrer">View live site ↗</a>
    </header>
    <div className="editor-status" role="status">{status}</div>
    {state && <>
      <fieldset disabled={pending} className="editor-workspace" aria-label="Site settings">
        <section className="editor-fields">
          <nav aria-label="Editor sections" className="editor-tabs">
            {Object.entries({ sections: 'Section backgrounds', fonts: 'Fonts', images: 'Images' }).map(([key, title]) =>
              <button key={key} type="button" aria-pressed={tab === key}
                onClick={() => { setTab(key); setFilter(''); }}>{title}</button>
            )}
          </nav>
          {tab !== 'fonts' && <label>Page<select value={path} onChange={(event) => { setPath(event.target.value); setFilter(''); }}>
            {['English', 'Dansk'].map((language) => <optgroup key={language} label={language}>
              {state.pages.filter((route) => languageFor(route) === language).map((route) =>
                <option key={route} value={route}>{labelFor(route)}</option>)}
            </optgroup>)}
          </select></label>}
          {tab === 'sections' && <div className="editor-settings">
            {(state.sections[path] ?? []).map(({ id, name, shared }) => {
              const color = draft.sectionBackgrounds?.[id] ?? '';
              return <label className="editor-setting" key={id}>
                <span>{name}{shared && <small>Sitewide</small>}</span>
                <span className="editor-color-picker">
                  {color && <span className="editor-swatch" style={{ backgroundColor: color }} aria-hidden="true" />}
                  <select value={color} onChange={(event) => updateAppearance('sectionBackgrounds', id, event.target.value)}>
                    <option value="">Use site background</option>
                    {Object.entries(state.sectionColors).map(([hex, label]) =>
                      <option key={hex} value={hex}>{label}</option>
                    )}
                  </select>
                </span>
              </label>;
            })}
          </div>}
          {tab === 'fonts' && <div className="editor-settings">
            {Object.entries(state.fontRoles).map(([id, role]) => {
              const settings = resolveTypography(id, draft.fonts, draft.typography);
              const available = googleFonts[settings.family].weights;
              return <fieldset className="editor-font-card" key={id}>
                <legend>{role.label}</legend>
                <label>Font family
                  <select value={draft.fonts?.[id] ?? ''} onChange={event => updateFont(id, event.target.value)}>
                    <option value="">Default · {role.defaultFamily}</option>
                    {state.googleFonts.map(family => <option value={family} key={family}>{family}</option>)}
                  </select>
                </label>
                <div className="editor-font-metrics">
                  <label>Font weight
                    <select value={settings.weight} onChange={event => updateTypography(id, 'weight', event.target.value)}>
                      {available.map(weight => <option value={weight} key={weight}>{weight} · {weightNames[weight]}</option>)}
                    </select>
                  </label>
                  <label>Line height
                    <select value={settings.lineHeight} onChange={event => updateTypography(id, 'lineHeight', event.target.value)}>
                      {numberOptions(typographyLimits.lineHeight.min, typographyLimits.lineHeight.max, .05, settings.lineHeight, role.lineHeight).map(value =>
                        <option value={value} key={value}>{value.toFixed(2)}{value === role.lineHeight ? ' · Default' : ''}</option>)}
                    </select>
                  </label>
                  <label>Letter spacing
                    <select value={settings.letterSpacing} onChange={event => updateTypography(id, 'letterSpacing', event.target.value)}>
                      {numberOptions(typographyLimits.letterSpacing.min, typographyLimits.letterSpacing.max, .005, settings.letterSpacing, role.letterSpacing).map(value =>
                        <option value={value} key={value}>{Number((value * 100).toFixed(1))}%{value === role.letterSpacing ? ' · Default' : ''}</option>)}
                    </select>
                  </label>
                </div>
              </fieldset>;
            })}
          </div>}
          {tab === 'images' && <>
          <label>Find an image<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
          {images.map(([key, image]) => <details key={path + key}>
            <summary>{image.label}</summary>
            <img className="editor-image" src={draft.images?.[key] ?? image.value} alt="" loading="lazy" />
            <label>Replace image<input type="file" accept="image/*" disabled={disabled}
              onChange={(event) => {
                const file = event.target.files[0];
                event.target.value = '';
                upload(key, file);
              }} /></label>
            {draft.images?.[key] && <button type="button"
              onClick={() => updateAppearance('images', key)}>Restore original image</button>}
          </details>)}
          </>}
        </section>
      </fieldset>
      <footer className="editor-actions">
        <form action="/api/editor" method="post" target="_blank" rel="noopener">
          <input type="hidden" name="path" value={path} />
          <input type="hidden" name="draft" value={JSON.stringify(draft)} />
          <button type="submit">Preview draft ↗</button>
        </form>
        <button disabled={disabled || !state.previous} onClick={() => submit('restore')}>Restore previous</button>
        <button disabled={disabled} onClick={() => submit('save')}>Save draft</button>
        <button className="primary" disabled={disabled} onClick={() => submit('publish')}>Publish</button>
      </footer>
    </>}
  </main>;
}

async function prepareImage(file) {
  if (file.size <= 4000000) return file;
  let bitmap;
  try { bitmap = await createImageBitmap(file); } catch {
    throw new Error('Choose a JPEG, PNG or WebP image the browser can open.');
  }
  try {
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const image = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
    if (!image || image.size > 4000000) throw new Error('Choose a smaller image.');
    return new File([image], 'image.webp', { type: image.type });
  } finally {
    bitmap.close();
  }
}

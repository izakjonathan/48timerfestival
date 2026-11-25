'use client';

import { useEffect, useRef, useState } from 'react';

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
  const [tab, setTab] = useState('content');
  const [preview, setPreview] = useState('');
  const [selected, setSelected] = useState(null);
  const frame = useRef(null);
  const scroll = useRef(0);

  function showSelection(doc, element) {
    const previous = doc.querySelector('[data-festival-selected]');
    previous?.removeAttribute('data-festival-selected');
    element?.setAttribute('data-festival-selected', '');
  }

  function preparePreview(event) {
    const iframe = event.currentTarget;
    const doc = iframe.contentDocument;
    if (!doc?.querySelector('[data-festival-element]')) return;
    const styles = doc.createElement('style');
    styles.textContent = 'html[data-festival-pick] [data-festival-element]:hover{cursor:crosshair} html[data-festival-pick] [data-festival-selected]{outline:2px solid #5769ff!important;outline-offset:2px}';
    doc.head.append(styles);
    doc.documentElement.toggleAttribute('data-festival-pick', iframe.dataset.mode === 'visual');
    if (selected) showSelection(doc, doc.querySelector('[data-festival-element="' + selected.id + '"]'));
    iframe.contentWindow.scrollTo(0, scroll.current);
    doc.addEventListener('scroll', () => { scroll.current = iframe.contentWindow.scrollY; }, { passive: true });
    doc.addEventListener('click', (click) => {
      if (iframe.dataset.mode !== 'visual') return;
      click.preventDefault();
      const element = click.target.closest('[data-festival-element]');
      if (!element) return;
      const name = element.textContent.trim().replace(/\s+/g, ' ').slice(0, 70) || element.tagName.toLowerCase();
      setSelected({ id: element.dataset.festivalElement, name });
      showSelection(doc, element);
    }, true);
  }

  function updateElementColor(property, swatch) {
    setDraft((previous) => {
      const assignments = { ...previous.elementColors?.[path] };
      const colors = { ...assignments[selected.id] };
      if (swatch) colors[property] = swatch;
      else delete colors[property];
      if (Object.keys(colors).length) assignments[selected.id] = colors;
      else delete assignments[selected.id];
      return { ...previous, elementColors: { ...previous.elementColors, [path]: assignments } };
    });
  }

  useEffect(() => {
    frame.current?.contentDocument?.documentElement.toggleAttribute('data-festival-pick', tab === 'visual');
  }, [tab]);

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

  useEffect(() => {
    if (!state) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/editor', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'preview', path, draft }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Preview unavailable.');
        setPreview(await response.text());
      } catch (error) {
        if (error.name !== 'AbortError') setStatus('Preview unavailable.');
      }
    }, 300);
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [draft, path, state]);

  function updateAppearance(group, key, value) {
    setDraft((previous) => {
      const edits = { ...previous[group] };
      if (value) edits[key] = value;
      else delete edits[key];
      return { ...previous, [group]: edits };
    });
  }

  function update(key, name, value) {
    setDraft((previous) => ({
      ...previous,
      [path]: { ...previous[path], [key]: { ...previous[path]?.[key], [name]: value } },
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

  const fields = Object.entries(state?.pages[path] ?? {}).filter(([, field]) =>
    (field.label + ' ' + field.value).toLowerCase().includes(filter.toLowerCase())
  );
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
      <div className={'editor-workspace' + (tab === 'visual' ? ' editor-workspace-visual' : '')}>
        <section className="editor-fields" aria-label="Page content">
          <nav aria-label="Editor sections" className="editor-tabs">
            {Object.entries({ content: 'Content', visual: 'Visual colors', colors: 'Site colors', images: 'Images' }).map(([key, title]) =>
              <button key={key} type="button" aria-pressed={tab === key}
                onClick={() => { setTab(key); setFilter(''); }}>{title}</button>
            )}
          </nav>
          <label>Preview page<select value={path} onChange={(event) => { setPath(event.target.value); setFilter(''); setSelected(null); scroll.current = 0; }}>
            {['English', 'Dansk'].map((language) => <optgroup key={language} label={language}>
              {Object.keys(state.pages).filter((route) => languageFor(route) === language).map((route) =>
                <option key={route} value={route}>{labelFor(route)}</option>)}
            </optgroup>)}
          </select></label>
          {tab === 'visual' ? <div className="editor-visual-controls">
            {selected ? <>
              <p className="editor-visual-selected">{selected.name}</p>
              {Object.entries({ color: 'Text color', 'background-color': 'Background color' }).map(([property, label]) =>
                <label key={property}>{label}
                  <select value={draft.elementColors?.[path]?.[selected.id]?.[property] ?? ''}
                    onChange={(event) => updateElementColor(property, event.target.value)}>
                    <option value="">Use site style</option>
                    {Object.entries(state.palette).map(([key, name]) =>
                      <option key={key} value={key}>{name} · {draft.colors?.[key] ?? '#' + key}</option>)}
                  </select>
                </label>
              )}
            </> : <p>Click a heading, button, text block or section in the preview.</p>}
          </div> : tab === 'colors' ? <div className="editor-palette">
            {Object.entries(state.palette).map(([key, label]) => {
              const value = draft.colors?.[key] ?? '#' + key;
              return <div key={key} className="editor-color">
                <label>{label}<input type="color" value={value}
                  onChange={(event) => updateAppearance('colors', key, event.target.value)} /></label>
                <span>{value.toUpperCase()}</span>
                <button type="button" disabled={!draft.colors?.[key]} onClick={() => updateAppearance('colors', key)}>Reset</button>
              </div>;
            })}
          </div> : <>
          <label>Find a field<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
          {tab === 'images' ? images.map(([key, image]) => <details key={path + key}>
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
          </details>) : fields.filter(([, field]) => field.kind !== 'image').map(([key, field]) => {
            const edit = draft[path]?.[key];
            const value = edit?.value ?? field.value;
            return <details key={path + key}>
              <summary>{value.slice(0, 100) || field.label}</summary>
              <label>Text
                <textarea value={value} rows={value.length > 100 ? 5 : 2}
                  onChange={(event) => update(key, 'value', event.target.value)} />
              </label>
              {field.kind === 'link' && <label>Link destination
                <input value={edit?.href ?? field.href} onChange={(event) => update(key, 'href', event.target.value)} />
              </label>}
            </details>;
          })}
          </>}
        </section>
        <section className="editor-preview" aria-label="Page preview">
          <iframe ref={frame} title="Page preview" src={path} srcDoc={preview || undefined} sandbox="allow-same-origin" data-mode={tab} onLoad={preparePreview} />
        </section>
      </div>
      <footer className="editor-actions">
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

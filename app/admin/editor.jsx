'use client';

import { useEffect, useRef, useState } from 'react';

const labelFor = (path) => path === '/en/' ? 'Home' : path.split('/').filter(Boolean).at(-1).replaceAll('-', ' ');
const messages = { save: 'Draft saved.', publish: 'Published.', restore: 'Previous publication restored.' };

export default function Editor() {
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState({});
  const [path, setPath] = useState('/en/');
  const [status, setStatus] = useState('Loading editor…');
  const [pending, setPending] = useState(false);
  const [filter, setFilter] = useState('');
  const preview = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/editor');
        if (response.status === 401) throw new Error('Sign in with username editor and reload.');
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

  function refreshPreview() {
    const frame = preview.current?.contentDocument;
    if (!frame || !state?.pages[path]) return;
    if (frame.location.pathname.replace(/\/$/, '') !== path.replace(/\/$/, '')) return;
    for (const [key, field] of Object.entries(state.pages[path])) {
      const node = frame.querySelector('[data-edit-key="' + key + '"]');
      if (!node) continue;
      const edit = draft[path]?.[key];
      const saved = state.published[path]?.[key];
      if (!edit && !saved) continue;
      const value = edit?.value ?? field.value;
      if (field.kind === 'image') {
        if (node.getAttribute('src') !== value) {
          node.src = value;
          node.removeAttribute('srcset');
        }
      } else {
        node.textContent = value;
        if (field.kind === 'link') node.setAttribute('href', edit?.href ?? field.href);
      }
    }
  }

  useEffect(refreshPreview, [draft, path, state]);

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
      body.set('image', file);
      const response = await fetch('/api/editor', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      update(key, 'value', data.url);
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
  const disabled = !state?.writable || pending;
  return <main className="editor">
    <header className="editor-header">
      <div><p>48 Timer Festival</p><h1>Site editor</h1></div>
      <a href={path} target="_blank" rel="noreferrer">View live site ↗</a>
    </header>
    <div className="editor-status" role="status">{status}</div>
    {state && <>
      <div className="editor-workspace">
        <section className="editor-fields" aria-label="Page content">
          <label>Page<select value={path} onChange={(event) => { setPath(event.target.value); setFilter(''); }}>
            {Object.keys(state.pages).map((route) => <option key={route} value={route}>{labelFor(route)}</option>)}
          </select></label>
          <label>Find a field<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
          {fields.map(([key, field]) => {
            const edit = draft[path]?.[key];
            const value = edit?.value ?? field.value;
            return <details key={path + key}>
              <summary>{field.kind === 'image' ? field.label || 'Image' : value.slice(0, 100) || field.label}</summary>
              <label>{field.kind === 'image' ? 'Image URL' : 'Text'}
                {field.kind === 'image'
                  ? <input value={value} onChange={(event) => update(key, 'value', event.target.value)} />
                  : <textarea value={value} rows={value.length > 100 ? 5 : 2} onChange={(event) => update(key, 'value', event.target.value)} />}
              </label>
              {field.kind === 'image' && <label>Upload image
                <input type="file" accept="image/*" disabled={pending} onChange={(event) => upload(key, event.target.files[0])} />
              </label>}
              {field.kind === 'link' && <label>Link destination
                <input value={edit?.href ?? field.href} onChange={(event) => update(key, 'href', event.target.value)} />
              </label>}
            </details>;
          })}
        </section>
        <section className="editor-preview" aria-label="Page preview">
          <iframe ref={preview} title="Page preview" src={path} onLoad={refreshPreview} sandbox="allow-same-origin" />
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

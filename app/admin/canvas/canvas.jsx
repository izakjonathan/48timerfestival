'use client';

import { useEffect, useRef, useState } from 'react';
import { colorRoles, swatchName } from '../../../lib/color-roles.js';

const channel = 'festival-canvas';
const pageName = (path) => path === '/' ? 'Forside' : path === '/en/' ? 'Home'
  : path.split('/').filter(Boolean).at(-1).replaceAll('-', ' ');

export default function Canvas() {
  const [state, setState] = useState(null);
  const [draft, setDraft] = useState({});
  const [page, setPage] = useState('/en/');
  const [document, setDocument] = useState(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [scope, setScope] = useState('item');
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const frame = useRef(null);
  const initialized = Boolean(state);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/editor', { signal: controller.signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setState(data);
      setDraft(data.draft);
    }).catch((error) => {
      if (!controller.signal.aborted) setStatus(error.message);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const controller = new AbortController();
    const instance = crypto.randomUUID();
    setDocument(null);
    setReady(false);
    setSelected(null);
    setMenuOpen(false);
    fetch('/api/editor', {
      method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'canvas', path: page, instance, draft: draftRef.current }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('Could not open this page.');
      const html = await response.text();
      if (!controller.signal.aborted) setDocument({ html, instance });
    }).catch((error) => {
      if (!controller.signal.aborted) setStatus(error.message);
    });
    return () => controller.abort();
  }, [initialized, page]);

  useEffect(() => {
    function receive(event) {
      const data = event.data;
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' ||
          !document || data?.instance !== document.instance || data.channel !== channel) return;
      if (data.type === 'ready') setReady(true);
      if (data.type !== 'selected') return;
      const roles = Array.isArray(data.roles) ? data.roles.filter((key) => Object.hasOwn(colorRoles, key)) : [];
      const id = typeof data.id === 'string' && /^element-\d{1,5}$/.test(data.id) ? data.id : '';
      if (!id && !roles.length) return;
      setSelected({ id, roles, name: typeof data.name === 'string' ? data.name : '' });
      const named = roles.findLast((key) => key !== 'body-text');
      setScope(named ?? (id ? 'item' : roles[0]));
    }
    addEventListener('message', receive);
    return () => removeEventListener('message', receive);
  }, [document]);

  useEffect(() => {
    if (!ready || !document) return;
    frame.current?.contentWindow.postMessage({
      channel, instance: document.instance, type: 'colors', menuOpen,
      colors: draft.colors, roles: draft.colorRoles, elements: draft.elementColors?.[page],
    }, '*');
  }, [document, ready, draft, page, menuOpen]);

  function changeColor(value) {
    if (!selected) return;
    setDraft((previous) => {
      if (scope !== 'item') {
        const roles = { ...previous.colorRoles };
        if (value) roles[scope] = value;
        else delete roles[scope];
        return { ...previous, colorRoles: roles };
      }
      const assignments = { ...previous.elementColors?.[page] };
      const element = { ...assignments[selected.id] };
      if (value) element.color = value;
      else delete element.color;
      if (Object.keys(element).length) assignments[selected.id] = element;
      else delete assignments[selected.id];
      return { ...previous, elementColors: { ...previous.elementColors, [page]: assignments } };
    });
  }

  async function save(action) {
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
      setStatus(action === 'save' ? 'Draft saved' : 'Published');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  const color = selected ? (scope === 'item'
    ? draft.elementColors?.[page]?.[selected.id]?.color : draft.colorRoles?.[scope]) ?? '' : '';
  return <main className="canvas-shell">
    <aside className="canvas-tools" aria-label="Visual editor">
      <div className="canvas-nav">
        <a href="/admin">Site editor</a>
        <label>Page
          <select value={page} disabled={!state || pending} onChange={(event) => setPage(event.target.value)}>
            {['English', 'Dansk'].map((language) => <optgroup key={language} label={language}>
              {Object.keys(state?.pages ?? {}).filter((path) => path.startsWith('/en/') === (language === 'English'))
                .map((path) => <option key={path} value={path}>{pageName(path)}</option>)}
            </optgroup>)}
          </select>
        </label>
        <button type="button" disabled={!ready} aria-pressed={menuOpen}
          onClick={() => { setSelected(null); setMenuOpen((open) => !open); }}>Menu view</button>
      </div>
      <div className="canvas-inspector">
        {selected ? <>
          <p className="canvas-target">{selected.name || 'Selected element'}</p>
          {selected.roles.includes('body-text') && selected.id && <label>Apply to
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="item">This element</option><option value="body-text">Shared body text</option>
            </select>
          </label>}
          <label>{scope === 'item' ? 'Text color' : colorRoles[scope]?.name}
            <select value={color} disabled={pending} onChange={(event) => changeColor(event.target.value)}>
              <option value="">{colorRoles[scope]?.defaultLabel ?? 'Use site style'}</option>
              {Object.entries(state.palette).map(([key, name]) => {
                const hex = draft.colors?.[key] ?? '#' + key;
                const duplicate = Object.keys(state.palette).some((other) => other !== key &&
                  (draft.colors?.[other] ?? '#' + other).toLowerCase() === hex.toLowerCase());
                return <option key={key} value={key}>{swatchName(hex)} · {hex.toUpperCase()}{duplicate ? ' · ' + name : ''}</option>;
              })}
            </select>
          </label>
        </> : <p>{ready ? 'Tap text or a menu control to edit its color.' : 'Loading page…'}</p>}
        <div className="canvas-actions">
          <button type="button" disabled={!state?.writable || pending} onClick={() => save('save')}>Save draft</button>
          <button type="button" className="canvas-publish" disabled={!state?.writable || pending} onClick={() => save('publish')}>Publish</button>
          {status && <span role="status">{status}</span>}
        </div>
      </div>
    </aside>
    {document && <iframe key={document.instance} ref={frame} className="canvas-page"
      title="Editable festival page" sandbox="allow-scripts" srcDoc={document.html}
      onLoad={(event) => event.currentTarget.contentWindow.postMessage({
        channel, instance: document.instance, type: 'ping',
      }, '*')} />}
  </main>;
}

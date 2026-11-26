'use client';

import { mediaLibrary } from '../../lib/editorial.js';
import { BlockEditor, MediaSelect, FocalPoint, SEOEditor, HistoryEditor, AnalyticsEditor } from './editor-extras.jsx';
import { useEffect, useState } from 'react';
import { blankEvent, categories, completeEvent } from '../../lib/program.js';
import { defaultDates, festivalDates, festivalDaysFor, formatDates, validFestivalDates } from '../../lib/festival-dates.js';
import { importProgramme, template } from '../../lib/program-import.js';
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
  const [tab, setTab] = useState('content');
  const [openEvent, setOpenEvent] = useState(null);
  const [contentPath, setContentPath] = useState('/en/');
  const [programInput, setProgramInput] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const dates = festivalDates(draft);
  const enteredDates = draft.festivalDates ?? defaultDates;
  const days = festivalDaysFor(dates);
  const datesValid = validFestivalDates(enteredDates);

  function updateCopy(route,key,property,value) {
    setDraft(previous=>({ ...previous,content:{...previous.content,[route]:{
      ...previous.content?.[route],[key]:{...previous.content?.[route]?.[key],[property]:value}
    }}}));
  }
  function resetCopy(route,key) {
    setDraft(previous=>{
      const fields={...previous.content?.[route]};delete fields[key];
      return {...previous,content:{...previous.content,[route]:fields}};
    });
  }
  function updateDate(key,value) {
    setDraft(previous=>({...previous,festivalDates:{...defaultDates,...previous.festivalDates,[key]:value}}));
    setImportPreview(null);
  }
  function reviewImport() {
    setImportPreview(importProgramme(programInput,dates,draft.programEvents));
  }
  function applyImport() {
    const result=importProgramme(programInput,dates,draft.programEvents);
    setImportPreview(result);
    if(result.errors.length||!result.events.length)return;
    const additions=Object.fromEntries(result.events.map(event=>[crypto.randomUUID(),event]));
    setDraft(previous=>({...previous,programEvents:{...previous.programEvents,...additions}}));
    setStatus(result.events.length+' events added to the draft. Publish when ready.');
    setProgramInput('');setImportPreview(null);
  }

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

  function addEvent() {
    const id = crypto.randomUUID();
    updateAppearance('programEvents', id, blankEvent(dates));
    setOpenEvent(id);
  }

  function updateEvent(id, key, value) {
    setDraft(previous => ({
      ...previous,
      programEvents: { ...previous.programEvents, [id]: { ...previous.programEvents[id], [key]: value } },
    }));
  }

  async function submit(action,historyId) {
    setPending(true);
    setStatus('');
    try {
      const response = await fetch('/api/editor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, revision: state.revision, draft, historyId }),
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
      setDraft(previous=>({...previous,mediaLibrary:{...previous.mediaLibrary,[data.url]:file.name.slice(0,200)},mediaDimensions:{...previous.mediaDimensions,[data.url]:{width:data.width,height:data.height}},...(key?{images:{...previous.images,[key]:data.url}}:{})}));
      setStatus('Image uploaded. Publish to apply it to the live page.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setPending(false);
    }
  }

  const library=mediaLibrary(state?.images,draft);
  const images = Object.entries(state?.images[path] ?? {}).filter(([, image]) =>
    image.label.toLowerCase().includes(filter.toLowerCase())
  ).sort(([, first], [, second]) => {
    const priority = (name) => name.startsWith('Main poster') ? 0 : 1;
    return priority(first.label) - priority(second.label) || first.label.localeCompare(second.label);
  });
  const disabled = !state?.writable || pending || !datesValid;
  const copyFields=(state?.contentCatalog?.[contentPath]??[]).map(field=>{
    const edit={...(field.legacyKey?draft[contentPath]?.[field.legacyKey]:{}),...draft.content?.[contentPath]?.[field.key]};
    return {...field,edit};
  }).filter(field=>[field.label,field.edit.value??field.value,field.edit.href??field.href].some(value=>value?.toLowerCase().includes(filter.toLowerCase())));
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
            {Object.entries({ content: 'Content', blocks: 'Blocks', sections: 'Design', images: 'Media', program: 'Program', seo:'SEO', history:'History', analytics:'Analytics' }).map(([key, title]) =>
              <button key={key} type="button" aria-pressed={tab === key || (key==='sections'&&tab==='fonts')}
                onClick={() => { setTab(key); setFilter(''); if (key === 'program') setPath('/en/program/'); if(key==='content')setPath(contentPath.startsWith('shared.')?(contentPath==='shared.en'?'/en/':'/'):contentPath); }}>{title}</button>
            )}
          </nav>
          {['sections','fonts'].includes(tab)&&<nav className="editor-tabs editor-subtabs" aria-label="Design settings"><button type="button" aria-pressed={tab==='sections'} onClick={()=>setTab('sections')}>Section backgrounds</button><button type="button" aria-pressed={tab==='fonts'} onClick={()=>setTab('fonts')}>Typography</button></nav>}
          {!['content','fonts', 'program','history','analytics'].includes(tab) && <label>Page<select value={path} onChange={(event) => { setPath(event.target.value); setFilter(''); }}>
            {['English', 'Dansk'].map((language) => <optgroup key={language} label={language}>
              {state.pages.filter((route) => languageFor(route) === language).map((route) =>
                <option key={route} value={route}>{labelFor(route)}</option>)}
            </optgroup>)}
          </select></label>}
          {tab==='blocks'&&<BlockEditor route={path} blocks={draft.blocks?.[path]} update={blocks=>updateAppearance('blocks',path,blocks)} colors={state.sectionColors} library={library}/>}
          {tab==='seo'&&<SEOEditor route={path} seo={draft.seo?.[path]} defaults={state.seoDefaults?.[path]} library={library} onChange={value=>updateAppearance('seo',path,value)}/>}
          {tab==='history'&&<HistoryEditor history={state.history??[]} publishedAt={state.publishedAt} publishedRevision={state.publishedRevision} disabled={disabled} restore={id=>submit('restore',id)}/>}
          {tab==='analytics'&&<AnalyticsEditor/>}
          {tab==='content'&&<div className="editor-settings">
            <fieldset className="editor-font-card"><legend>Festival dates · sitewide</legend>
              <p className="editor-hint">Updates the date ticker, countdown, festival copy and programme days in both languages. The artwork itself is unchanged.</p>
              <div className="editor-event-grid">
              {['start','end'].map(key=><label key={key}>{key==='start'?'Start date':'End date'}<input type="date" value={enteredDates[key]} onChange={e=>updateDate(key,e.target.value)}/></label>)}
              </div>
              {!datesValid&&<p role="alert">Choose valid dates within a 14-day festival period.</p>}
            </fieldset>
            <label>Page or shared content<select value={contentPath} onChange={e=>{
              const selected=e.target.value;setContentPath(selected);setPath(selected.startsWith('shared.')?(selected==='shared.en'?'/en/':'/'):selected);setFilter('');
            }}>
              <optgroup label="Shared navigation and footer"><option value="shared.en">English · all pages</option><option value="shared.da">Dansk · all pages</option></optgroup>
              {['English','Dansk'].map(language=><optgroup key={language} label={language}>
                {state.pages.filter(route=>languageFor(route)===language).map(route=><option key={route} value={route}>{labelFor(route)}</option>)}
              </optgroup>)}
            </select></label>
            <label>Find text or links<input type="search" value={filter} onChange={e=>setFilter(e.target.value)}/></label>
            <p className="editor-hint">{copyFields.length} editable fields. Changes affect this language only; shared content affects every page in that language.</p>
            {copyFields.map(field=><details key={contentPath+field.key}>
              <summary><strong>{field.label}</strong> · {(field.edit.value??field.value??'').slice(0,100)}{(field.edit.value??field.value??'').length>100?'…':''}</summary>
              {!field.hrefOnly&&<label>Text<textarea maxLength={10000} rows={(field.edit.value??field.value??'').length>100?5:2} value={field.edit.value??field.value??''} onChange={e=>updateCopy(contentPath,field.key,'value',e.target.value)}/></label>}
              {field.href!==undefined&&<label>Link destination<input type="text" maxLength={10000} value={field.edit.href??field.href} onChange={e=>updateCopy(contentPath,field.key,'href',e.target.value)}/></label>}
              {draft.content?.[contentPath]?.[field.key]&&<button type="button" onClick={()=>resetCopy(contentPath,field.key)}>Reset to existing text</button>}
            </details>)}
          </div>}
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
          {tab === 'program' && <div className="editor-program">
            <div className="editor-program-heading">
              <div><h2>Festival programme</h2><p>{formatDates(dates)} · Danish and English</p></div>
              <button type="button" onClick={addEvent}>+ Add event</button>
            </div>
            <p>{Object.keys(draft.programEvents ?? {}).length} events in draft. Publish when the programme is ready.</p>
            <details>
              <summary>Import approved programme from a spreadsheet</summary>
              <p className="editor-hint">Copy approved rows from Google Sheets or upload CSV/TSV. Registration data is not connected. Use the column names in the template.</p>
              <p><a className="editor-text-link" href={'data:text/csv;charset=utf-8,'+encodeURIComponent(template)} download="festival-programme-template.csv">Download CSV template ↓</a></p>
              <label>Spreadsheet file<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values" onChange={async e=>{
                const file=e.target.files?.[0];if(file){if(file.size>2000000){setStatus('Use a spreadsheet under 2 MB.');return;}setProgramInput(await file.text());setImportPreview(null);}e.target.value='';
              }}/></label>
              <label>Or paste the table with headers<textarea rows={6} value={programInput} onChange={e=>{setProgramInput(e.target.value);setImportPreview(null);}} placeholder="day, start, category, titleDa, titleEn, venue…"/></label>
              <button type="button" disabled={!programInput.trim()||!datesValid} onClick={reviewImport}>Review import</button>
              {importPreview&&<div className="editor-import-result" aria-live="polite">
                <p>{importPreview.events.length} new events · {importPreview.duplicate.length} duplicates skipped · {importPreview.errors.length} errors</p>
                {importPreview.errors.length>0&&<ul>{importPreview.errors.map((error,i)=><li key={i}>{error}</li>)}</ul>}
                <ul>{importPreview.events.slice(0,20).map((event,i)=><li key={i}>{event.day} · {event.start} · {event.titleEn}</li>)}</ul>
                {importPreview.events.length>20&&<p>And {importPreview.events.length-20} more.</p>}
                <button type="button" disabled={Boolean(importPreview.errors.length)||!importPreview.events.length} onClick={applyImport}>Add {importPreview.events.length} events to draft</button>
              </div>}
            </details>
            {Object.entries(draft.programEvents ?? {}).sort(([,a],[,b])=>(a.day+a.start).localeCompare(b.day+b.start)).map(([id, event]) => <details key={id}
              open={openEvent === id ? true : undefined}>
              <summary>{event.titleEn || event.titleDa || 'Untitled event'} · {event.day.slice(5)}{event.start && ' · ' + event.start}{!completeEvent(event) && ' · Incomplete'}</summary>
              <div className="editor-event-grid">
                <label>Day<select value={event.day} onChange={e => updateEvent(id,'day',e.target.value)}>
                  {!days.includes(event.day)&&<option value={event.day}>{event.day} · outside festival dates</option>}
                  {days.map(day => <option key={day} value={day}>{day}</option>)}
                </select></label>
                <label>Category<select value={event.category} onChange={e => updateEvent(id,'category',e.target.value)}>
                  {Object.entries(categories).map(([key,category]) => <option key={key} value={key}>{category.en}</option>)}
                </select></label>
                <label>Start time<input type="time" value={event.start} onInput={e => updateEvent(id,'start',e.currentTarget.value)} onChange={e => updateEvent(id,'start',e.target.value)}/></label>
                <label>End time (optional)<input type="time" value={event.end} onInput={e => updateEvent(id,'end',e.currentTarget.value)} onChange={e => updateEvent(id,'end',e.target.value)}/></label>
                {[
                  ['titleDa','Title · Danish'], ['titleEn','Title · English'], ['venue','Venue'], ['address','Address'],
                  ['link','Event link (optional)'],
                ].map(([key,label]) => <label key={key}>{label}<input type={key === 'link' ? 'url' : 'text'} maxLength={300} value={event[key]} onChange={e => updateEvent(id,key,e.target.value)}/></label>)}
              </div>
              {['Da','En'].map(language => <label key={language}>Description · {language === 'Da' ? 'Danish' : 'English'}<textarea rows={4} maxLength={3000} value={event['description'+language]} onChange={e=>updateEvent(id,'description'+language,e.target.value)}/></label>)}
              <button type="button" onClick={() => {
                if (window.confirm('Remove this event from the draft?')) updateAppearance('programEvents',id,null);
              }}>Remove event</button>
            </details>)}
            <label>Preview programme<select value={path === '/program/' ? '/program/' : '/en/program/'} onChange={e=>setPath(e.target.value)}><option value="/en/program/">English</option><option value="/program/">Dansk</option></select></label>
          </div>}
          {tab === 'images' && <>
          <details><summary>Reusable media library · {Object.keys(library).length} images</summary>
          <p className="editor-hint">Upload once, reuse in any existing image slot, new content block or social sharing card. Uploads are added to the draft library.</p>
          <label>Upload new image<input type="file" accept="image/*" disabled={disabled} onChange={e=>{const file=e.target.files[0];e.target.value='';upload(null,file);}}/></label>
          <div className="editor-library">{Object.entries(library).map(([url,name])=><figure key={url}><img src={url} alt="" loading="lazy"/><figcaption>{name}</figcaption></figure>)}</div>
          </details>
          <label>Find an image<input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} /></label>
          {images.map(([key, image]) => <details key={path + key}>
            <summary>{image.label}</summary>
            <img className="editor-image" src={draft.images?.[key] ?? image.value} alt="" loading="lazy" />
            <MediaSelect library={library} value={draft.images?.[key]??image.value} onChange={value=>updateAppearance('images',key,value)}/>
            <label>Replace image<input type="file" accept="image/*" disabled={disabled}
              onChange={(event) => {
                const file = event.target.files[0];
                event.target.value = '';
                upload(key, file);
              }} /></label>
            <p className="editor-hint">Focal point applies to cropped images; logos and the full poster remain uncropped.</p><FocalPoint src={draft.images?.[key]??image.value} value={draft.imageFocus?.[key]} onChange={value=>updateAppearance('imageFocus',key,value)}/>
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
          <button type="submit" disabled={!datesValid}>Preview draft ↗</button>
        </form>
        <button disabled={disabled || !state.previous} onClick={() => {if(confirm('Restore the previous publication and replace the draft?'))submit('restore')}}>Restore previous</button>
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

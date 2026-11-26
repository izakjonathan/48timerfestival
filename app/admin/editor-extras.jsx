'use client';
import {useState} from 'react';
import {blockTypes,newBlock} from '../../lib/editorial.js';

export function MediaSelect({library,value,onChange,label='Choose reusable image'}){
 return <label>{label}<select value={value||''} onChange={e=>onChange(e.target.value)}><option value="">No image selected</option>{Object.entries(library).sort(([,a],[,b])=>a.localeCompare(b)).map(([url,name])=><option key={url} value={url}>{name}</option>)}</select></label>;
}
export function FocalPoint({value,onChange,src}){
 const point=value??{x:50,y:50};
 const set=(axis,n)=>onChange({...point,[axis]:Number(n)});
 return <div className="editor-focus">
 {src&&<div className="editor-focus-image"><img src={src} alt="Crop preview" style={{objectPosition:point.x+'% '+point.y+'%'}}/><span aria-hidden="true">Crop preview</span></div>}
 <label>Horizontal focal point · {point.x}%<input type="range" min="0" max="100" value={point.x} onChange={e=>set('x',e.target.value)}/></label>
 <label>Vertical focal point · {point.y}%<input type="range" min="0" max="100" value={point.y} onChange={e=>set('y',e.target.value)}/></label>
 <button type="button" onClick={()=>onChange({x:50,y:50})}>Center image</button>
 </div>;
}
export function BlockEditor({route,blocks=[],update,library,colors}){
 const [type,setType]=useState('text');
 const set=(id,key,value)=>update(blocks.map(b=>b.id===id?{...b,[key]:value}:b));
 const move=(index,offset)=>{const a=[...blocks],end=index+offset;if(end<0||end>=a.length)return;[a[index],a[end]]=[a[end],a[index]];update(a);};
 return <div className="editor-settings">
 <h2>Additional content blocks</h2><p className="editor-hint">Add sections before or after the existing page content. Each language has its own blocks. Reorder them within the same position.</p>
 <div className="editor-inline"><label>Block type<select value={type} onChange={e=>setType(e.target.value)}>{Object.entries(blockTypes).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><button type="button" disabled={blocks.length>=30} onClick={()=>update([...blocks,newBlock(type)])}>+ Add block</button></div>
 {blocks.map((b,index)=><details key={route+b.id}><summary>{blockTypes[b.type]} · {b.heading||'Untitled'} · {b.position==='top'?'Before page':'After page'}</summary>
 <label>Heading<input maxLength={300} value={b.heading} onChange={e=>set(b.id,'heading',e.target.value)}/></label>
 {b.type!=='image'&&<label>{b.type==='quote'?'Quote':'Body text'}<textarea rows={5} maxLength={10000} value={b.body} onChange={e=>set(b.id,'body',e.target.value)}/></label>}
 <label>Position<select value={b.position} onChange={e=>set(b.id,'position',e.target.value)}><option value="top">Before existing page</option><option value="bottom">After existing page</option></select></label>
 <label>Background<select value={b.color} onChange={e=>set(b.id,'color',e.target.value)}>{Object.entries(colors).map(([hex,name])=><option key={hex} value={hex}>{name}</option>)}</select></label>
 {['image','split'].includes(b.type)&&<><MediaSelect library={library} value={b.image} onChange={v=>set(b.id,'image',v)}/><label>Image alt text<input maxLength={300} value={b.alt} onChange={e=>set(b.id,'alt',e.target.value)}/></label><FocalPoint src={b.image} value={b.focus} onChange={v=>set(b.id,'focus',v)}/></>}
 <label>Button label (optional)<input maxLength={300} value={b.button} onChange={e=>set(b.id,'button',e.target.value)}/></label><label>Button link<input maxLength={2000} value={b.href} onChange={e=>set(b.id,'href',e.target.value)}/></label>
 <div className="editor-inline"><button type="button" disabled={!index} onClick={()=>move(index,-1)}>↑ Move up</button><button type="button" disabled={index===blocks.length-1} onClick={()=>move(index,1)}>↓ Move down</button><button type="button" onClick={()=>{if(confirm('Remove this block from the draft?'))update(blocks.filter(v=>v.id!==b.id))}}>Remove</button></div>
 </details>)}
 </div>;
}
export function SEOEditor({route,seo,defaults,library,onChange}){
 return <div className="editor-settings"><h2>Search and social sharing</h2><p className="editor-hint">Each language has independent metadata. Blank fields use the automatic page defaults.</p>
 <label>Page title<input maxLength={120} placeholder={defaults?.title} value={seo?.title??''} onChange={e=>onChange({...seo,title:e.target.value})}/></label>
 <label>Meta description<textarea maxLength={320} placeholder={defaults?.description} rows={4} value={seo?.description??''} onChange={e=>onChange({...seo,description:e.target.value})}/></label>
 <MediaSelect label="Social sharing image" library={library} value={seo?.image} onChange={image=>onChange({...seo,image})}/>
 {(seo?.image||defaults?.image)&&<img className="editor-image" src={seo?.image||defaults?.image} alt="Sharing image preview"/>}
 </div>;
}
export function HistoryEditor({history,publishedAt,publishedRevision,restore,disabled}){
 return <div className="editor-settings"><h2>Publication history</h2><p className="editor-hint">The most recent 20 previous publications are retained. Rolling back also preserves the current publication as a new history entry.</p><div className="editor-history-current"><strong>Current live version</strong><div>{publishedAt?new Date(publishedAt).toLocaleString():'Existing publication · date unavailable'}{publishedRevision?' · revision '+publishedRevision:''}</div></div>{history.map(entry=><div className="editor-history-row" key={entry.id}><div>{entry.at?new Date(entry.at).toLocaleString():'Earlier publication · date unavailable'}{entry.revision!=null&&<div>Revision {entry.revision}</div>}</div><button disabled={disabled} type="button" onClick={()=>{if(confirm('Publish this saved version? This replaces the current draft as well.'))restore(entry.id)}}>Roll back</button></div>)}{!history.length&&<p>No earlier publication yet.</p>}</div>
}
export function AnalyticsEditor(){
 const [stats,setStats]=useState(null);const [error,setError]=useState('');
 async function load(){try{const r=await fetch('/api/analytics');if(!r.ok)throw Error('Analytics unavailable');setStats(await r.json());}catch(e){setError(e.message)}}
 return <div className="editor-settings"><h2>Visitor analytics</h2><p className="editor-hint">Aggregate page views, not unique visitors. No tracking cookies or visitor identifiers are stored. Do Not Track and Global Privacy Control are respected. Counts begin after this release.</p><button type="button" onClick={load}>Load last 7 days</button>{error&&<p role="alert">{error}</p>}{stats&&<><h3>{stats.total} page views</h3><div className="editor-history-current">{stats.days.map(day=><div className="editor-history-row" key={day.date}>{day.date}<strong>{day.total}</strong></div>)}</div><h3>Top pages</h3>{stats.pages.map(([page,n])=><div className="editor-history-row" key={page}>{page}<strong>{n}</strong></div>)}</>}</div>
}

'use client';
import React,{useState,useEffect,useRef} from 'react';
import {localized,optimized} from './native-chrome.jsx';

export default function Gallery({images,lang}) {
  const [active,setActive]=useState(null);
  const dialog=useRef(null);
  const trigger=useRef(null);
  function close(){setActive(null);dialog.current?.close();trigger.current?.focus();}
  function step(direction){setActive(index=>(index+direction+images.length)%images.length);}
  useEffect(()=>{
    if(active!==null && !dialog.current?.open)dialog.current?.showModal();
  },[active]);
  return <>
    <div className="fn-gallery">{images.map((item,index)=><button type="button" className="fn-gallery-picture" key={index}
      aria-label={localized(lang,'Åbn billede ','Open photo ')+(index+1)}
      onClick={event=>{trigger.current=event.currentTarget;setActive(index);}}>
      <img src={optimized(item.src,640)} data-original={item.src} alt={item.alt||localized(lang,'Festivalfoto','Festival photo')} loading="lazy" decoding="async"/>
    </button>)}</div>
    <dialog className="fn-gallery-dialog" ref={dialog} onCancel={event=>{event.preventDefault();close();}}
      onKeyDown={event=>{if(event.key==='ArrowRight')step(1);if(event.key==='ArrowLeft')step(-1);}}
      onClick={event=>{if(event.target===dialog.current)close();}}>
      {active!==null&&<div className="fn-gallery-view">
        <button className="fn-gallery-close" onClick={close} aria-label={localized(lang,'Luk','Close')}>×</button>
        <button className="fn-gallery-prev" onClick={()=>step(-1)} aria-label={localized(lang,'Forrige billede','Previous photo')}>‹</button>
        <img src={images[active].full} alt={images[active].alt||localized(lang,'Festivalfoto','Festival photo')}/>
        <button className="fn-gallery-next" onClick={()=>step(1)} aria-label={localized(lang,'Næste billede','Next photo')}>›</button>
        <p>{active+1} / {images.length}{images[active].alt && ' · '+images[active].alt}</p>
      </div>}
    </dialog>
  </>;
}

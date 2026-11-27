'use client';
import {useEffect, useRef, useState} from 'react';

export default function SponsorSlideshow({slides,lang}) {
  const en=lang==='en';
  const root=useRef(null);
  const [active,setActive]=useState(0);
  const [paused,setPaused]=useState(false);
  const [visible,setVisible]=useState(false);
  const [pageVisible,setPageVisible]=useState(true);
  const [hovering,setHovering]=useState(false);
  const move=step=>setActive(index=>(index+step+slides.length)%slides.length);
  useEffect(()=>{
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion=()=>setPaused(reduced.matches);
    const updateVisibility=()=>setPageVisible(!document.hidden);
    updateMotion();updateVisibility();
    reduced.addEventListener('change',updateMotion);
    document.addEventListener('visibilitychange',updateVisibility);
    let observer;
    if('IntersectionObserver' in window){
      observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.1});
      observer.observe(root.current);
    }else setVisible(true);
    return()=>{observer?.disconnect();reduced.removeEventListener('change',updateMotion);document.removeEventListener('visibilitychange',updateVisibility);};
  },[]);
  useEffect(()=>{
    if(paused||!visible||!pageVisible||hovering||slides.length<2)return;
    const timer=setInterval(()=>setActive(index=>(index+1)%slides.length),2000);
    return()=>clearInterval(timer);
  },[paused,visible,pageVisible,hovering,slides.length]);
  const select=index=>{setPaused(true);setActive(index);};
  const step=direction=>{setPaused(true);move(direction);};
  return <div ref={root} className="fn-sponsor-slideshow" role="region" aria-roledescription={en?'carousel':'diasshow'}
    aria-label={en?'Festival sponsors':'Festivalens sponsorer'}
    onPointerEnter={e=>{if(e.pointerType==='mouse')setHovering(true);}} onPointerLeave={()=>setHovering(false)}
    onFocusCapture={e=>{if(!e.target.closest('.fn-sponsor-play'))setPaused(true);}}>
    <div className="fn-sponsor-stage" aria-live={paused?'polite':'off'}>
      {slides.map((slide,index)=><div className="fn-sponsor-slide" key={slide.name} data-active={index===active?'true':'false'} aria-hidden={index!==active}>
        <img src={slide.src} data-original={slide.original} alt={slide.name} loading="lazy" decoding="async"/>
      </div>)}
    </div>
    <div className="fn-sponsor-controls">
      <button type="button" onClick={()=>step(-1)} aria-label={en?'Previous sponsor':'Forrige sponsor'}>‹</button>
      <button type="button" className="fn-sponsor-play" onClick={()=>setPaused(value=>!value)} aria-label={paused?(en?'Play slideshow':'Afspil diasshow'):(en?'Pause slideshow':'Sæt diasshow på pause')}>
        {paused?<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3v14l11-7Z" fill="currentColor"/></svg>:<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zm5 0h3v12h-3z" fill="currentColor"/></svg>}
      </button>
      <button type="button" onClick={()=>step(1)} aria-label={en?'Next sponsor':'Næste sponsor'}>›</button>
    </div>
    <div className="fn-sponsor-dots" role="group" aria-label={en?'Select sponsor':'Vælg sponsor'}>
      {slides.map((slide,index)=><button type="button" key={slide.name} aria-label={slide.name} aria-current={index===active?'true':undefined} onClick={()=>select(index)}><span/></button>)}
    </div>
  </div>;
}

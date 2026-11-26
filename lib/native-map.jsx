'use client';
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {localized} from './native-chrome.jsx';

export default function FestivalMap({markers,lines,lang,notice}) {
  const root=useRef(null);
  const [error,setError]=useState(false);
  useEffect(()=>{
    let active=true,map;
    import('leaflet').then(module=>{
      if(!active||!root.current)return;
      const L=module.default??module;
      map=L.map(root.current,{scrollWheelZoom:false}).setView([55.695148,12.549852],13);
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles © Esri — Esri, HERE, Garmin, USGS and contributors'}).addTo(map);
      const layers=[];
      for(const line of lines)layers.push(L.polyline(line,{color:'#222453',weight:4}).addTo(map));
      for(const item of markers){
        if(!item.coords)continue;
        const marker=L.circleMarker(item.coords,{radius:7,color:'#222453',weight:2,fillColor:'#fff642',fillOpacity:1}).addTo(map);
        const popup=document.createElement('div');
        const title=document.createElement('strong');title.textContent=item.title;popup.append(title);
        for(const text of item.details){const p=document.createElement('p');p.textContent=text;popup.append(p);}
        if(item.href){const link=document.createElement('a');link.href=item.href;link.textContent=localized(lang,'Mere info','More info');link.target='_blank';link.rel='noopener noreferrer';popup.append(link);}
        marker.bindPopup(popup);layers.push(marker);
      }
      if(layers.length)map.fitBounds(L.featureGroup(layers).getBounds(),{padding:[24,24],maxZoom:14});
    }).catch(()=>{if(active)setError(true);});
    return ()=>{active=false;map?.remove();};
  },[markers,lines,lang]);
  return <>
    <p>{notice}</p>
    <div className="fn-map" ref={root} aria-label={localized(lang,'Interaktivt festivalkort','Interactive festival map')}/>
    {error&&<p role="status">{localized(lang,'Kortet kunne ikke indlæses. Se listen nedenfor.','The map could not load. See the list below.')}</p>}
    <details className="fn-map-list"><summary>{localized(lang,'Vis tidligere arrangementer','View archived events')} ({markers.length})</summary>
      <ul>{markers.map((item,i)=><li key={i}><strong>{item.title}</strong><p>{item.details.join(' · ')}</p>{item.href&&<a href={item.href} target="_blank" rel="noreferrer">{localized(lang,'Mere info','More info')}</a>}</li>)}</ul>
    </details>
  </>;
}

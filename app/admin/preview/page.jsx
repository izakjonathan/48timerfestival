'use client';
import {useState} from 'react';
export default function Preview(){
 const [mode,setMode]=useState('desktop');
 return <div style={{height:'100dvh',display:'flex',flexDirection:'column',background:'#171715',color:'#eee',font:'14px system-ui'}}>
 <header style={{padding:'10px 14px',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong style={{marginRight:'auto'}}>Draft preview · not published</strong>{[['desktop','Desktop'],['mobile','Mobile · 390px']].map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>setMode(id)} style={{padding:'10px',background:mode===id?'#eee':'#333',color:mode===id?'#171715':'#eee',border:'1px solid #777',borderRadius:4}}>{label}</button>)}<a href="/admin/preview/frame" target="_blank" style={{color:'#eee'}}>Full screen ↗</a></header>
 <div style={{flex:1,overflow:'auto',display:'flex',justifyContent:'safe center',padding:mode==='mobile'?12:0}}><iframe title={mode+' draft preview'} src="/admin/preview/frame" style={{width:mode==='mobile'?390:'100%',minWidth:mode==='mobile'?390:1280,height:'100%',border:0,background:'#fff'}}/></div></div>;
}

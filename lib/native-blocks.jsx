import { Button,optimized } from './native-chrome.jsx';
import { focusStyle } from './editorial.js';
export default function Blocks({route,document,position}){
 return (document.blocks?.[route]??[]).filter(b=>b.position===position).map(b=>{
   const photo=b.image&&<figure className="fn-block-photo"><img alt={b.alt} src={optimized(b.image,828)} srcSet={[384,640,828,1080,1440].map(w=>optimized(b.image,w)+' '+w+'w').join(', ')} sizes={b.type==='split'?'(max-width: 700px) 90vw, 50vw':'90vw'} loading="lazy" decoding="async" style={focusStyle(b.focus)}/></figure>;
   const text=<div className="fn-block-copy" data-fn-reveal>{b.heading&&<h2 className="fn-display">{b.heading}</h2>}{b.body&&(b.type==='quote'?<blockquote>{b.body}</blockquote>:<p>{b.body}</p>)}{b.href&&b.button&&<Button href={b.href}>{b.button}</Button>}</div>;
   return <section key={b.id} className={'fn-section fn-custom-block fn-block-'+b.type} style={{backgroundColor:b.color}}><div className="fn-wrap">{b.type==='image'?<>{photo}{text}</>:b.type==='split'?<div className="fn-block-grid">{photo}{text}</div>:text}</div></section>;
 });
}

import React from 'react';
import pages from './pages.js';
import { localized, routeFor, langFor, image, optimized, background, Button } from './native-chrome.jsx';
import Gallery from './native-gallery.jsx';
import FestivalMap from './native-map.jsx';
import { EventRegistration, VolunteerRegistration } from './native-forms.jsx';

const names = {
  'galleri': ['Galleri','Gallery'], 'kort':['Festivalkort','Festival map'], 'om-festivalen':['Om festivalen','About the festival'],
  'pressekit':['Pressekit','Press kit'], 'kontakt-og-information':['Kontakt og information','Contact and information'],
  'bliv-partner':['Bliv partner','Become a partner'], 'bliv-frivillig':['Bliv frivillig','Volunteer'],
  'bliv-aktoer':['Bliv aktør','Get involved'], 'bliv-en-del-af-festivalen':['Bliv en del af festivalen','Be part of the festival'],
  'fotograf-team':['Fotograf-team','Photo team'], 'pr-kommunikation':['PR & kommunikation','PR & communication'],
  'teknikservice':['Teknikservice','Technical team'],
};
export function pageName(route) {
  const [da,en]=names[route.split('/').filter(Boolean).at(-1)]??['48TIMER Festival','48TIMER Festival'];
  return localized(langFor(route),da,en);
}
const editFor = (document,route,key) => key ? document[route]?.[key] ?? {} : {};
const asset = (document,route,module) =>{
  const changed=image(document,module.src);
  return changed!==module.src ? changed : editFor(document,route,module.key).value??module.src;
};
const linkAsset=(document,href)=>href?.startsWith('/festival-assets/wp-content/uploads/')?image(document,href):href;
function rich(nodes,document,route) {
  return nodes.map((node,index)=>{
    if(typeof node==='string')return node;
    const edit=editFor(document,route,node.key);
    const children=edit.value!==undefined?edit.value:rich(node.children??[],document,route);
    if(node.tag==='br'||node.tag==='hr')return React.createElement(node.tag,{key:index});
    if(node.tag==='a'){
      const href=linkAsset(document,edit.href??node.href);
      if(!href)return <span key={index}>{children}</span>;
      return <a key={index} href={href} {...(node.external?{target:'_blank',rel:'noreferrer'}:{})}>{children}</a>;
    }
    return React.createElement(node.tag,{key:index},children);
  });
}
function hasHeading(nodes) {
  return nodes.some(node=>typeof node==='object'&&(node.tag==='h1'||hasHeading(node.children??[])));
}
function Photo({src,alt='',banner=false}) {
  const sizes=banner?'100vw':'(max-width: 700px) 90vw, 40vw';
  const widths=banner?[640,828,1080,1440,1920]:[384,640,828];
  return <img src={optimized(src,banner?1440:640)} srcSet={widths.map(w=>optimized(src,w)+' '+w+'w').join(', ')} sizes={sizes}
    alt={alt} data-original={src} decoding="async" loading={banner?'eager':'lazy'} fetchPriority={banner?'high':'auto'}/>;
}
function Module({module,route,document}) {
  const lang=langFor(route);
  switch(module.type){
    case 'text':
    case 'breadcrumb': {
      const text=rich(module.children,document,route);
      return module.href?<a className="fn-inner-card" href={module.href}>{text}</a>:<div className={module.type==='breadcrumb'?'fn-breadcrumb':'fn-rich'}>{text}</div>;
    }
    case 'image':{
      const src=asset(document,route,module);
      const photo=<Photo src={src} alt={module.alt}/>;
      return <div className="fn-press-image">{module.href?<a href={linkAsset(document,module.href)}>{photo}</a>:photo}</div>;
    }
    case 'button': {
      const edit=editFor(document,route,module.key);
      return <Button href={linkAsset(document,edit.href??module.href)}>{edit.value??module.title}</Button>;
    }
    case 'location': return <a className="fn-location" href={module.href} target="_blank" rel="noreferrer" aria-label={localized(lang,'Vis på kort','Show on map')}><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></a>;
    case 'gallery': return <Gallery lang={lang} images={module.images.map(item=>{
      const src=asset(document,route,item);
      return {...item,src,full:src===item.src?image(document,item.full):src};
    })}/>;
    case 'map': return <FestivalMap lang={lang} markers={module.markers} lines={module.lines}/>;
    case 'registration': return <EventRegistration lang={lang}/>;
    case 'volunteer': return <VolunteerRegistration lang={lang} route={route}/>;
    default:return null;
  }
}
function VolunteerLanding({lang,document}) {
  return <section className="fn-section" style={background(document,'/bliv-frivillig/content','var(--fn-teal)')}>
    <div className="fn-wrap">
      <h1 className="fn-inner-title">{localized(lang,'Bliv frivillig','Volunteer')}</h1>
      <p className="fn-lead">{localized(lang,'Vær med til at skabe 48TIMER Festival. Find det team, du gerne vil være en del af.','Help create 48TIMER Festival. Find the team you would like to be part of.')}</p>
      <div className="fn-inner-link-grid">
        {[
          ['fotograf-team','Fotograf-team','Photo team'],
          ['pr-kommunikation','PR & kommunikation','PR & communication'],
          ['teknikservice','Teknikservice','Technical team'],
        ].map(([path,da,en])=><Button key={path} href={routeFor(lang,'bliv-frivillig/'+path)}>{localized(lang,da,en)}</Button>)}
      </div>
      <p><a className="fn-text-link" href="mailto:kontakt@48timerfestival.dk">{localized(lang,'Kontakt os om andre frivillige opgaver','Contact us about other volunteer roles')}</a></p>
    </div>
  </section>;
}
function PartnerLanding({lang,document}) {
  return <section className="fn-section fn-inner-content" style={background(document,'/bliv-partner/content','var(--fn-coral)')}><div className="fn-wrap">
    <h1 className="fn-inner-title">{localized(lang,'Bliv partner','Become a partner')}</h1>
    <p className="fn-lead">{localized(lang,'Vil du samarbejde med 48TIMER Festival? Kontakt festivalen for at høre mere om mulighederne.','Interested in working with 48TIMER Festival? Contact us to discuss partnership opportunities.')}</p>
    <div className="fn-actions"><Button href="mailto:kontakt@48timerfestival.dk">{localized(lang,'Kontakt festivalen','Contact the festival')}</Button><Button secondary href={routeFor(lang,'kontakt-og-information')}>{localized(lang,'Kontakt & info','Contact & info')}</Button></div>
  </div></section>;
}
export default function InnerPage({route,document,Countdown}) {
  const page=pages[route];
  const lang=langFor(route);
  const canonical=lang==='en'?route.slice(3):route;
  const content=page.content;
  const missingTitle=!content.some(section=>section.rows?.flat(2).some(module=>module.children&&hasHeading(module.children)));
  const firstContent=content.findIndex(section=>section.type==='content');
  if(canonical==='/bliv-partner/')return <PartnerLanding lang={lang} document={document}/>;
  return <>
    {content.map((section,index)=>{
      if(section.type==='countdown')return <Countdown key={section.id} lang={lang} document={document} sectionId={section.id}/>;
      if(section.type==='banner')return <React.Fragment key={section.id}>
        <section className="fn-inner-banner" style={background(document,section.id,section.color)}>
          {section.image?<Photo src={image(document,section.image)} banner/>:<div className="fn-wrap fn-inner-banner-empty"/>}
        </section>
        {canonical==='/bliv-frivillig/'&&<VolunteerLanding lang={lang} document={document}/>}
      </React.Fragment>;
      return <section className="fn-section fn-inner-content" key={section.id} style={background(document,section.id,section.color)}>
        <div className="fn-wrap">
          {missingTitle&&index===firstContent&&<h1 className="fn-inner-title">{pageName(route)}</h1>}
          {section.rows.map((row,i)=><div className={'fn-inner-row fn-cols-'+row.length} key={i}>{row.map((column,j)=><div className="fn-inner-column" key={j}>{column.map((module,k)=><Module key={k} module={module} route={route} document={document}/>)}</div>)}</div>)}
        </div>
      </section>;
    })}
    {canonical==='/om-festivalen/'&&<section className="fn-section fn-inner-content" style={{background:'var(--fn-teal)'}}><div className="fn-wrap fn-inner-link-grid"><Button href={routeFor(lang,'bliv-en-del-af-festivalen')}>{localized(lang,'Bliv en del af festivalen','Be part of the festival')}</Button><Button href={routeFor(lang,'bliv-partner')}>{localized(lang,'Bliv partner','Become a partner')}</Button></div></section>}
  </>;
}

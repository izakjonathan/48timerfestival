import pages from './pages.js';
import { festivalDates, refreshDateCopy } from './festival-dates.js';

// Stable IDs for text and links owned by native layout components.
const home = {
  'hero.eyebrow':['Location label','Nørrebro · København','Nørrebro · Copenhagen'],
  'hero.title1':['Festival heading · first line','48TIMER','48TIMER'],
  'hero.title2':['Festival heading · second line','FESTIVAL','FESTIVAL'],
  'hero.intro':['Hero introduction','En hel weekend med musik, kunst, mad og fællesskab på Nørrebro.','A whole weekend of music, art, food and community across Nørrebro.'],
  'hero.program':['Hero programme button','Se program','Explore programme','program'],
  'hero.participate':['Hero participation button','Bliv aktør','Get involved','bliv-aktoer'],
  'program.heading':['Programme section title','Program','Programme'],
  'program.available':['Programme headline · events published','Find din næste festivaloplevelse','Find your next festival experience'],
  'program.coming':['Programme headline · coming soon','Programmet er på vej!','The programme is on its way!'],
  'program.availableBody':['Programme introduction · events published','Udforsk arrangementerne efter dag, kategori og sted.','Explore events by day, category and location.'],
  'program.comingBody':['Programme introduction · coming soon','Programmet offentliggøres efter tilmeldingsfristen. Følg med, eller vær med til at skabe festivalen.','The programme will be announced after the registration deadline. Follow along or help create the festival.'],
  'program.button':['Programme button','Se program','View programme','program'],
  'program.facebook':['Facebook link','Følg os på Facebook','Follow us on Facebook','https://www.facebook.com/48TimerFestival/events'],
  'explore.heading':['Explore section heading','Oplev festivalen','Explore the festival'],
  'card.participate':['Participation card','Bliv aktør','Get involved','bliv-aktoer'],
  'card.program':['Programme card','Program','Programme','program'],
  'card.gallery':['Gallery card','Galleri','Gallery','galleri'],
  'about.heading':['About section heading','Om 48TIMER Festival','About 48TIMER Festival'],
  'about.body':['About section body','48TIMER Festival er en årlig kulturfestival på Nørrebro i midten af maj. Sammen med besøgende fra hele København fejrer vi alt det særlige ved vores bydel over en hel weekend – det personlige, nørdede og skæve, som Nørrebro rummer.','48TIMER Festival is an annual cultural festival in Nørrebro in mid-May. Together with visitors from across Copenhagen, we celebrate everything special about our neighbourhood over an entire weekend: its personal, quirky and creative sides.'],
  'about.link':['About section link','Læs mere om festivalen','More about the festival','om-festivalen'],
  'sponsors.heading':['Sponsor heading','En særlig tak til','A special thanks to'],
};
const programme = {
  'page.title':['Page heading','Program','Programme'],
  'page.intro':['Programme introduction','Find det, du vil opleve til 48TIMER Festival.','Find your next experience at 48TIMER Festival.'],
  'empty.heading':['Coming soon heading','Programmet er på vej!','The programme is on its way!'],
  'empty.body':['Coming soon message','Programmet offentliggøres efter tilmeldingsfristen. Indtil da kan du følge festivalen på Facebook eller læse om at blive aktør.','The programme will be published after the registration deadline. Until then, follow the festival on Facebook or find out how to get involved.'],
  'empty.participate':['Participation button','Bliv aktør','Get involved','bliv-aktoer'],
  'empty.facebook':['Facebook button','Følg på Facebook','Follow on Facebook','https://www.facebook.com/48TimerFestival/events'],
};
const shared = {
  'nav.program':['Navigation · Programme','Program','Programme','program'],
  'nav.about':['Navigation · About','Om 48TIMER','About','om-festivalen'],
  'nav.gallery':['Navigation · Gallery','Galleri','Gallery','galleri'],
  'nav.participate':['Navigation · Participation','Bliv aktør','Get involved','bliv-aktoer'],
  'nav.contact':['Navigation · Contact','Kontakt & info','Contact & info','kontakt-og-information'],
  'nav.volunteer':['Navigation · Volunteer','Bliv frivillig','Volunteer','bliv-frivillig'],
  'footer.name':['Footer heading','48TIMER Festival','48TIMER Festival'],
  'footer.organization':['Organisation','Foreningen af Blågårds Plads','Foreningen af Blågårds Plads'],
  'footer.address':['Address','Blågårds Plads 2 · 2200 København N','Blågårds Plads 2 · 2200 København N'],
  'footer.cvr':['CVR','CVR: 40710647','CVR: 40710647'],
  'footer.email':['Contact email','kontakt@48timerfestival.dk','kontakt@48timerfestival.dk','mailto:kontakt@48timerfestival.dk'],
  'footer.press':['Footer press link','Presse','Press','pressekit'],
  'footer.map':['Footer map link','Kort','Map','kort'],
  'footer.partner':['Footer partner link','Bliv partner','Become a partner','bliv-partner'],
  'footer.location':['Footer location','Nørrebro · København','Nørrebro · København'],
  'social.facebook':['Facebook link','Facebook','Facebook','https://www.facebook.com/48TimerFestival/'],
  'social.instagram':['Instagram link','Instagram','Instagram','https://www.instagram.com/48timerfestival/'],
  'social.youtube':['YouTube link','YouTube','YouTube','https://www.youtube.com/user/48timerfestival/videos'],
  'countdown.heading':['Countdown heading','Vi ses om','See you in'],
};
const inner = {
  '/bliv-frivillig/':{
    'page.title':['Page heading','Bliv frivillig','Volunteer'],
    'page.intro':['Introduction','Vær med til at skabe 48TIMER Festival. Find det team, du gerne vil være en del af.','Help create 48TIMER Festival. Find the team you would like to be part of.'],
    'team.photo':['Photo team link','Fotograf-team','Photo team','bliv-frivillig/fotograf-team'],
    'team.pr':['PR team link','PR & kommunikation','PR & communication','bliv-frivillig/pr-kommunikation'],
    'team.technical':['Technical team link','Teknikservice','Technical team','bliv-frivillig/teknikservice'],
    'team.other':['Other volunteer roles','Kontakt os om andre frivillige opgaver','Contact us about other volunteer roles','mailto:kontakt@48timerfestival.dk'],
  },
  '/bliv-partner/':{
    'page.title':['Page heading','Bliv partner','Become a partner'],
    'page.intro':['Introduction','Vil du samarbejde med 48TIMER Festival? Kontakt festivalen for at høre mere om mulighederne.','Interested in working with 48TIMER Festival? Contact us to discuss partnership opportunities.'],
    'page.contact':['Contact festival','Kontakt festivalen','Contact the festival','mailto:kontakt@48timerfestival.dk'],
    'page.info':['Contact information','Kontakt & info','Contact & info','kontakt-og-information'],
  },
  '/om-festivalen/':{
    'page.title':['Page heading','Om festivalen','About the festival'],
    'page.part':['Participation link','Bliv en del af festivalen','Be part of the festival','bliv-en-del-af-festivalen'],
    'page.partner':['Partner link','Bliv partner','Become a partner','bliv-partner'],
  },
  '/kort/':{'page.title':['Page heading','Festivalkort','Festival map'],'archive.notice':['Archive map notice','Kortet viser arrangementer fra en tidligere festival. Se programmet for den kommende festival på programsiden.','This map shows events from a previous festival. See the programme page for the upcoming festival.']},
};
const canonical=route=>route.startsWith('/en/')?route.slice(3):route;
const langFor=route=>route.startsWith('/en/')?'en':'da';
const hrefFor=(lang,path)=>/^https?:|^mailto:|^tel:|^#|^\//.test(path)?path:(lang==='en'?'/en/':'/')+path+'/';
const baseFields=route=>route==='shared.en'||route==='shared.da'?shared:canonical(route)==='/'?home:canonical(route)==='/program/'?programme:inner[canonical(route)]??{};
const language=route=>route==='shared.en'?'en':route==='shared.da'?'da':langFor(route);
const isBlock = node=>['h1','h2','h3','h4','h5','h6','p','li','blockquote','td','th'].includes(node.tag);
const hasLink = node=>typeof node==='object'&&(node.tag==='a'||node.children?.some(hasLink));
export const plainText=nodes=>nodes.map(n=>typeof n==='string'?n:n.tag==='br'?'\n':plainText(n.children??[])).join('');
// A text block without links is one editable field. Linked paragraphs retain their distinct links.
export const editableBlock=node=>typeof node==='object'&&(node.tag==='a'||(isBlock(node)&&!hasLink(node)&&!(node.children??[]).some(child=>typeof child==='object'&&isBlock(child))));
const field = (key,label,value,href,legacyKey)=>({key,label,value,...(href!==undefined?{href}:{}),...(legacyKey?{legacyKey}:{})});
function collect(nodes,prefix,result) {
  nodes.forEach((node,index)=>{
    const key=prefix+'.'+index;
    if(typeof node==='string'){
      if(node.trim())result.push(field(key,'Text',node));
    }else if(editableBlock(node)){
      const text=plainText(node.children??[]);
      if(text.trim()||node.tag==='a')result.push(field(key,node.tag==='a'?'Link':/^h[1-6]$/.test(node.tag)?'Heading':'Paragraph',text,node.tag==='a'?node.href:undefined,node.key));
    }else collect(node.children??[],key,result);
  });
}
export function catalogFor(route) {
  const lang=language(route);
  const result=Object.entries(baseFields(route)).map(([key,[label,da,en,href]])=>field(key,label,lang==='en'?en:da,href===undefined?undefined:hrefFor(lang,href)));
  const page=pages[route];
  for(const [s,section] of (page?.content??[]).entries())for(const [r,row] of (section.rows??[]).entries())for(const [c,column] of row.entries())for(const [m,module] of column.entries()){
    const key='body.'+[s,r,c,m].join('.');
    if(module.children)collect(module.children,key,result);
    if(module.type==='button')result.push(field(key+'.button','Button',module.title,module.href,module.key));
    if(module.href&&module.type!=='button'&&module.type!=='image')result.push({...field(key+'.link','Link destination',module.type==='location'?'Map link':'Card link',module.href),hrefOnly:true});
  }
  return result;
}
export const contentRoutes = [...Object.keys(pages),'shared.da','shared.en'];
const catalogCache=new Map();
export function getContentCatalog(route) {
  if(!catalogCache.has(route))catalogCache.set(route,catalogFor(route));
  return catalogCache.get(route);
}
export function contentEdit(document,route,key,legacyKey) {
  const legacy=legacyKey?document[route]?.[legacyKey]??{}:{};
  return {...legacy,...document.content?.[route]?.[key]};
}
export function contentValue(document,route,key,defaultValue,legacyKey) {
  return refreshDateCopy(contentEdit(document,route,key,legacyKey).value??defaultValue,festivalDates(document));
}
export function contentHref(document,route,key,defaultValue,legacyKey) {
  return contentEdit(document,route,key,legacyKey).href??defaultValue;
}
export function copy(document,route,key) {
  const entry=baseFields(route)[key];
  if(!entry)return '';
  const lang=language(route);
  return contentValue(document,route,key,lang==='en'?entry[2]:entry[1]);
}
export function copyLink(document,route,key) {
  const entry=baseFields(route)[key];
  return {text:copy(document,route,key),href:contentHref(document,route,key,hrefFor(language(route),entry[3]))};
}
export function validContent(content) {
  return Object.entries(content).every(([route,fields])=>{
    if(!contentRoutes.includes(route)||!fields||typeof fields!=='object'||Array.isArray(fields))return false;
    const allowed=new Map(getContentCatalog(route).map(entry=>[entry.key,entry]));
    return Object.entries(fields).every(([key,edit])=>{
      const entry=allowed.get(key);
      return entry&&edit&&typeof edit==='object'&&!Array.isArray(edit)&&Object.entries(edit).every(([prop,value])=>{
        if(typeof value!=='string'||value.length>10000)return false;
        if(prop==='value')return !entry.hrefOnly;
        return prop==='href'&&entry.href!==undefined&&(/^(https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(value))&&!/[\u0000-\u001f]/.test(value);
      });
    });
  });
}

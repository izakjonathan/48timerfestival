import pages from './pages.js';
import {imageKey} from './appearance.js';
import archivedMedia from '../content/archived-media.json';
import {festivalDates,formatDates} from './festival-dates.js';
import {publishedEvents} from './program.js';
export const siteOrigin=()=>{try{return new URL(process.env.FESTIVAL_SITE_URL||'https://48timerfestival-nextjs.vercel.app').origin}catch{return 'https://48timerfestival-nextjs.vercel.app'}};
export const absolute=(path)=>new URL(path,siteOrigin()).href;
export const alternateRoutes=route=>{const da=route.startsWith('/en/')?route.slice(3):route;return {da,en:'/en'+da};};
const descriptions={
 '/':['48TIMER Festival samler Nørrebro til en weekend med musik, kunst, mad og fællesskab.','48TIMER Festival brings Nørrebro together for a weekend of music, art, food and community.'],
 '/program/':['Find festivalens arrangementer, spillesteder og program.','Explore festival events, venues and the programme.'],
 '/galleri/':['Se billeder fra 48TIMER Festival på Nørrebro.','Discover photographs from 48TIMER Festival in Nørrebro.'],
 '/kort/':['Udforsk festivalkortet og tidligere arrangementer.','Explore the festival map and archived events.'],
 '/om-festivalen/':['Læs om 48TIMER Festival og fællesskabet på Nørrebro.','Learn about 48TIMER Festival and the Nørrebro community.'],
 '/pressekit/':['Find presseinformation og festivalens logoer.','Find festival press information and logos.'],
 '/kontakt-og-information/':['Kontakt festivalen og find praktiske oplysninger.','Contact the festival and find practical information.'],
 '/bliv-partner/':['Bliv samarbejdspartner med 48TIMER Festival.','Become a partner of 48TIMER Festival.'],
 '/bliv-frivillig/':['Vær frivillig og vær med til at skabe festivalen.','Volunteer and help create the festival.'],
 '/bliv-aktoer/':['Bliv aktør og skab et arrangement til 48TIMER Festival.','Get involved and create an event for 48TIMER Festival.'],
 '/bliv-en-del-af-festivalen/':['Find måder at blive en del af festivalen på.','Find ways to be part of the festival.'],
 '/bliv-frivillig/fotograf-team/':['Bliv en del af festivalens fotografteam.','Join the festival photography team.'],
 '/bliv-frivillig/pr-kommunikation/':['Bliv frivillig med PR og kommunikation.','Volunteer with the festival PR and communications team.'],
 '/bliv-frivillig/teknikservice/':['Bliv frivillig i festivalens teknikteam.','Volunteer with the festival technical team.'],
};
const labels={'/':['48TIMER Festival','48TIMER Festival'],'/program/':['Program','Programme'],'/galleri/':['Galleri','Gallery'],'/kort/':['Festivalkort','Festival map'],'/om-festivalen/':['Om festivalen','About the festival'],'/pressekit/':['Pressekit','Press kit'],'/kontakt-og-information/':['Kontakt og information','Contact and information'],'/bliv-partner/':['Bliv partner','Become a partner'],'/bliv-frivillig/':['Bliv frivillig','Volunteer'],'/bliv-aktoer/':['Bliv aktør','Get involved'],'/bliv-en-del-af-festivalen/':['Bliv en del af festivalen','Be part of the festival'],'/bliv-frivillig/fotograf-team/':['Fotograf-team','Photo team'],'/bliv-frivillig/pr-kommunikation/':['PR og kommunikation','PR and communications'],'/bliv-frivillig/teknikservice/':['Teknikservice','Technical team']};
const posterKey=imageKey('/festival-assets/wp-content/uploads/2026/02/48-timer-plakat-til-hjemmeside-1.png');
export function defaultSEO(route,doc={}){
 const en=route.startsWith('/en/'),{da}=alternateRoutes(route),i=en?1:0;
 const label=labels[da]?.[i]??'48TIMER Festival';
 const title=da==='/'?label+' · Nørrebro · '+festivalDates(doc).start.slice(0,4):label+' | 48TIMER Festival';
 const description=(descriptions[da]?.[i]??descriptions['/'][i])+(da==='/'?' '+formatDates(festivalDates(doc),en?'en':'da')+'.':'');
 const banner=pages[route]?.content?.find(s=>s.type==='banner'&&s.image)?.image;
 const key=banner?imageKey(banner):posterKey;
 return {title,description,image:doc.images?.[key]??archivedMedia[key]??doc.images?.[posterKey]??archivedMedia[posterKey]};
}
export function eventAt(route,document){
 const match=route.match(/^\/(?:en\/)?program\/event\/([a-f0-9-]{36})\/$/);
 return match?publishedEvents(document.programEvents).find(event=>event.id===match[1]):undefined;
}
export function eventRoute(id,lang='da'){return (lang==='en'?'/en':'')+'/program/event/'+id+'/';}
export function metadataFor(route,doc){
 const en=route.startsWith('/en/'),event=eventAt(route,doc);
 const defaults=defaultSEO(route,doc),edits=doc.seo?.[route]??{};
 const title=event?(en?event.titleEn:event.titleDa)+' | 48TIMER Festival':edits.title||defaults.title;
 const description=event?((en?event.descriptionEn:event.descriptionDa)||event.venue+' · '+event.day+' · '+event.start).slice(0,320):edits.description||defaults.description;
 const image=edits.image||defaults.image;const {da,en:english}=alternateRoutes(route);
 const images=image?[{url:absolute('/social-image?path='+encodeURIComponent(route)+'&v='+encodeURIComponent(image.split('/').at(-1)+'-'+title.slice(0,80))),width:1200,height:630,alt:'48TIMER Festival'}]:[];
 return {title,description,metadataBase:new URL(siteOrigin()),alternates:{canonical:absolute(route),languages:{'da-DK':absolute(da),'en-GB':absolute(english),'x-default':absolute(da)}},openGraph:{title,description,url:absolute(route),siteName:'48TIMER Festival',locale:en?'en_GB':'da_DK',alternateLocale:[en?'da_DK':'en_GB'],type:'website',images},twitter:{card:'summary_large_image',title,description,images:images.map(i=>i.url)}};
}
function dateTime(day,time){
 const hour=new Date(day+'T12:00:00Z');
 const offset=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Copenhagen',timeZoneName:'longOffset'}).formatToParts(hour).find(p=>p.type==='timeZoneName').value.replace('GMT','')||'+00:00';
 return day+'T'+time+':00'+offset;
}
export function eventSchema(event,lang,doc){
 if(!event.address.trim())return null;
 const en=lang==='en',route=eventRoute(event.id,lang),image=defaultSEO('/'+(en?'en/':'')+'program/',doc).image;
 const result={'@context':'https://schema.org','@type':'Event',name:en?event.titleEn:event.titleDa,startDate:dateTime(event.day,event.start),eventAttendanceMode:'https://schema.org/OfflineEventAttendanceMode',eventStatus:'https://schema.org/EventScheduled',location:{'@type':'Place',name:event.venue,address:{'@type':'PostalAddress',name:event.address}},url:absolute(route),organizer:{'@type':'Organization',name:'48TIMER Festival',url:absolute('/')}};
 const description=en?event.descriptionEn:event.descriptionDa;if(description)result.description=description;if(image)result.image=[absolute(image)];
 if(event.end){let end=event.day;if(event.end<event.start)end=new Date(Date.parse(end)+86400000).toISOString().slice(0,10);result.endDate=dateTime(end,event.end);}
 return result;
}

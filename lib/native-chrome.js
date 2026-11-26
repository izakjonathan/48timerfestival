import { imageKey } from './appearance.js';

const assets = '/festival-assets/wp-content/uploads/';
const logo = assets + '2021/01/48Timer2020LogoFritlagt_edited2.png';
export const langFor = route => route.startsWith('/en/') ? 'en' : 'da';
export const routeFor = (language, path = '') => (language === 'en' ? '/en/' : '/') + (path ? path + '/' : '');
export const localized = (lang, da, en) => lang === 'da' ? da : en;
export const image = (document, url) => document.images?.[imageKey(url)] ?? url;
export const background = (document, key, fallback) => ({ backgroundColor: document.sectionBackgrounds?.[key] ?? fallback });
export const optimized = (src, width, quality = 75) => {
  if (!/\.(?:png|jpe?g|webp|avif)$/i.test(src)) return src;
  const url = src.startsWith('/festival-assets/') ? 'https://www.48timerfestival.dk' + src.slice('/festival-assets'.length) : src;
  return '/_next/image?url=' + encodeURIComponent(url) + '&w=' + width + '&q=' + quality;
};
const navLinks = lang => [
  ['program', 'Program', 'Programme'], ['om-festivalen', 'Om 48TIMER', 'About'],
  ['galleri', 'Galleri', 'Gallery'], ['bliv-aktoer', 'Bliv aktør', 'Get involved'],
  ['kontakt-og-information', 'Kontakt & info', 'Contact & info'],
].map(([path, da, en]) => ({ href: routeFor(lang, path), title: localized(lang, da, en) }));

const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const socials = [
  ['Facebook','https://www.facebook.com/48TimerFestival/','<path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.8v8H14Z"/>'],
  ['Instagram','https://www.instagram.com/48timerfestival/','<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2"/>'],
  ['YouTube','https://www.youtube.com/user/48timerfestival/videos','<path fill-rule="evenodd" d="M21.6 6.4C22 8 22 12 22 12s0 4-.4 5.6c-.2.9-.9 1.6-1.8 1.8-1.6.4-7.8.4-7.8.4s-6.2 0-7.8-.4c-.9-.2-1.6-.9-1.8-1.8C2 16 2 12 2 12s0-4 .4-5.6c.2-.9.9-1.6 1.8-1.8 1.6-.4 7.8-.4 7.8-.4s6.2 0 7.8.4c.9.2 1.6.9 1.8 1.8ZM10 8.5v7l6-3.5-6-3.5Z"/>'],
];
const socialLinks = () => '<div class="fn-socials">'+socials.map(([label,href,drawing])=>'<a href="'+href+'" aria-label="'+label+'" target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'+drawing+'</svg></a>').join('')+'</div>';
const attr = (current) => current ? ' aria-current="page"' : '';
const navItems = (lang,route,mobile=false) => navLinks(lang).map(({href,title})=>'<a '+(mobile?'class="fn-menu-link" ':'')+'href="'+escape(href)+'"'+attr(route===href)+'>'+escape(title)+(mobile?'<svg class="fn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 18 18 6M7 6h11v11" stroke-linecap="round" stroke-linejoin="round"/></svg>':'')+'</a>').join('');

export function renderNavigation(route, document) {
  const lang = langFor(route);
  const danish = lang === 'en' ? route.slice(3) : route;
  const english = '/en' + danish;
  const open = localized(lang,'Åbn menu','Open menu'), close = localized(lang,'Luk menu','Close menu');
  const navLabel = localized(lang,'Hovedmenu','Main navigation');
  const logoSrc = image(document,logo);
  return '<header class="fn-header" data-fn-header style="--fn-menu:'+escape(document.sectionBackgrounds?.menu??'var(--fn-yellow)')+'">'+
    '<a class="fn-skip" href="#main-content">'+localized(lang,'Gå til indhold','Skip to content')+'</a>'+
    '<div class="fn-header-bar"><button class="fn-menu-toggle" type="button" aria-expanded="false" aria-controls="fn-menu" aria-label="'+open+'" data-open-label="'+open+'" data-close-label="'+close+'"><span></span><span></span><span></span></button>'+
    '<nav class="fn-desktop-nav" aria-label="'+navLabel+'">'+navItems(lang,route)+'<a href="'+routeFor(lang,'bliv-frivillig')+'">'+localized(lang,'Bliv frivillig','Volunteer')+'</a></nav>'+
    '<nav class="fn-languages" aria-label="Language / Sprog"><a href="'+escape(danish)+'" lang="da" hreflang="da" aria-label="Dansk"'+attr(lang==='da')+'>DA</a><a href="'+escape(english)+'" lang="en" hreflang="en" aria-label="English"'+attr(lang==='en')+'>EN</a></nav>'+
    '<a href="'+routeFor(lang)+'" class="fn-logo" aria-label="'+localized(lang,'48TIMER Festival forside','48TIMER Festival home')+'"><svg class="fn-logo-filter" width="0" height="0" aria-hidden="true"><filter id="fn-logo-tint" color-interpolation-filters="sRGB"><feFlood flood-color="#fff642" result="tint"/><feBlend in="SourceGraphic" in2="tint" mode="multiply" result="color"/><feComposite in="color" in2="SourceGraphic" operator="in"/></filter></svg>'+
    '<img src="'+escape(optimized(logoSrc,128))+'" data-original="'+escape(logoSrc)+'" alt="48TIMER Festival" width="64" height="64"></a></div>'+
    '<nav class="fn-mobile-nav" id="fn-menu" aria-label="'+navLabel+'" inert hidden><div>'+navItems(lang,route,true)+'<a class="fn-menu-link" href="'+routeFor(lang,'bliv-frivillig')+'">'+localized(lang,'Bliv frivillig','Volunteer')+'<svg class="fn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 18 18 6M7 6h11v11" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'+socialLinks()+'</div></nav></header>';
}
export function renderFooter(route, document) {
  const lang = langFor(route);
  return '<footer class="fn-footer" style="background-color:'+escape(background(document,'footer','var(--fn-coral)').backgroundColor)+'">'+
    '<div class="fn-wrap fn-footer-grid"><div><h2>48TIMER Festival</h2><p>Foreningen af Blågårds Plads<br>Blågårds Plads 2 · 2200 København N<br>CVR: 40710647</p><a href="mailto:kontakt@48timerfestival.dk">kontakt@48timerfestival.dk</a>'+socialLinks()+'</div>'+
    '<nav aria-label="'+localized(lang,'Links','Page links')+'">'+navItems(lang,'')+'<a href="'+routeFor(lang,'bliv-frivillig')+'">'+localized(lang,'Bliv frivillig','Volunteer')+'</a><a href="'+routeFor(lang,'pressekit')+'">'+localized(lang,'Presse','Press')+'</a></nav>'+
    '<div class="fn-footer-date"><h2>'+localized(lang,'14.–16. maj','14–16 May')+'<br>2027</h2><p>Nørrebro · København</p></div></div>'+
    '<div class="fn-copyright" style="background-color:'+escape(background(document,'copyright','var(--fn-teal)').backgroundColor)+'"><div class="fn-wrap">© 48TIMER Festival 2027</div></div></footer>';
}

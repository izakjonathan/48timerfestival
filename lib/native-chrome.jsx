import React from 'react';
import { imageKey } from './appearance.js';
import Link from 'next/link';
import pages from './pages.js';
import { copy, copyLink } from './content-copy.js';
import { festivalDates, formatDates } from './festival-dates.js';
import archivedMedia from '../content/archived-media.json';

const assets = '/festival-assets/wp-content/uploads/';
const logo = assets + '2021/01/48Timer2020LogoFritlagt_edited2.png';
export const langFor = route => route.startsWith('/en/') ? 'en' : 'da';
export const routeFor = (language, path = '') => (language === 'en' ? '/en/' : '/') + (path ? path + '/' : '');
export const localized = (lang, da, en) => lang === 'da' ? da : en;
export const originalImage = url => archivedMedia[imageKey(url)] ?? url;
export const image = (document, url) => document.images?.[imageKey(url)] ?? originalImage(url);
export const background = (document, key, fallback) => ({ backgroundColor: document.sectionBackgrounds?.[key] ?? fallback });
export const optimized = (src, width, quality = 75) => {
  if (!/\.(?:png|jpe?g|webp|avif)$/i.test(src)) return src;
  const url = originalImage(src);
  if (!/^\/(?:media|festival-media)\//.test(url)) return url;
  return '/_next/image?url=' + encodeURIComponent(url) + '&w=' + width + '&q=' + quality;
};
const navLinks = (lang,document) => [
  'nav.program','nav.about','nav.gallery','nav.participate','nav.contact','nav.volunteer',
].map(key=>({key,...copyLink(document,'shared.'+lang,key)}));

export function SiteLink({href,children,...props}) {
  const route=href?.split(/[?#]/)[0];
  if(route&&Object.hasOwn(pages,route.endsWith('/')?route:route+'/')&&!props.target&&!props.download)return <Link href={href} {...props}>{children}</Link>;
  return <a href={href} {...props}>{children}</a>;
}

export function Arrow() {
  return <svg className="fn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 18 18 6M7 6h11v11" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
export function Button({ href, children, secondary = false, ...props }) {
  return <SiteLink className={'fn-button' + (secondary ? ' fn-button-outline' : '')} href={href} {...props}>{children}<Arrow/></SiteLink>;
}
const socials = [
  ['Facebook','https://www.facebook.com/48TimerFestival/', <path key="f" d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.8v8H14Z"/>],
  ['Instagram','https://www.instagram.com/48timerfestival/', <g key="i"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2"/></g>],
  ['YouTube','https://www.youtube.com/user/48timerfestival/videos', <path key="y" fillRule="evenodd" d="M21.6 6.4C22 8 22 12 22 12s0 4-.4 5.6c-.2.9-.9 1.6-1.8 1.8-1.6.4-7.8.4-7.8.4s-6.2 0-7.8-.4c-.9-.2-1.6-.9-1.8-1.8C2 16 2 12 2 12s0-4 .4-5.6c.2-.9.9-1.6 1.8-1.8 1.6-.4 7.8-.4 7.8-.4s6.2 0 7.8.4c.9.2 1.6.9 1.8 1.8ZM10 8.5v7l6-3.5-6-3.5Z"/>],
];
function SocialLinks({lang,document}) {
  return <div className="fn-socials">{socials.map(([label,href,drawing])=><a href={copyLink(document,'shared.'+lang,'social.'+label.toLowerCase()).href||href} key={label} aria-label={copy(document,'shared.'+lang,'social.'+label.toLowerCase())||label} target="_blank" rel="noreferrer"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{drawing}</svg></a>)}</div>;
}
function NavItems({lang,route,document,mobile=false}) {
  return navLinks(lang,document).map(({href,text,key})=><SiteLink className={mobile?'fn-menu-link':undefined} href={href} key={key} aria-current={route===href?'page':undefined}>{text}{mobile && <Arrow/>}</SiteLink>);
}
export function Header({route,document}) {
  const lang=langFor(route);
  const danish=lang==='en'?route.slice(3):route;
  const open=localized(lang,'Åbn menu','Open menu'), close=localized(lang,'Luk menu','Close menu');
  const label=localized(lang,'Hovedmenu','Main navigation');
  const logoSrc=image(document,logo);
  return <header className="fn-header" data-fn-header style={{'--fn-menu':document.sectionBackgrounds?.menu??'var(--fn-yellow)'}}>
    <a className="fn-skip" href="#main-content">{localized(lang,'Gå til indhold','Skip to content')}</a>
    <div className="fn-header-bar">
      <button className="fn-menu-toggle" type="button" aria-expanded="false" aria-controls="fn-menu" aria-label={open} data-open-label={open} data-close-label={close}><span/><span/><span/></button>
      <nav className="fn-desktop-nav" aria-label={label}><NavItems lang={lang} route={route} document={document}/></nav>
      <nav className="fn-languages" aria-label="Language / Sprog"><a href={danish} lang="da" hrefLang="da" aria-label="Dansk" aria-current={lang==='da'?'page':undefined}>DA</a><a href={'/en'+danish} lang="en" hrefLang="en" aria-label="English" aria-current={lang==='en'?'page':undefined}>EN</a></nav>
      <SiteLink href={routeFor(lang)} className="fn-logo" aria-label={localized(lang,'48TIMER Festival forside','48TIMER Festival home')}>
        <svg className="fn-logo-filter" width="0" height="0" aria-hidden="true"><filter id="fn-logo-tint" colorInterpolationFilters="sRGB"><feFlood floodColor="#fff642" result="tint"/><feBlend in="SourceGraphic" in2="tint" mode="multiply" result="color"/><feComposite in="color" in2="SourceGraphic" operator="in"/></filter></svg>
        <img src={optimized(logoSrc,128)} data-original={logoSrc} alt="48TIMER Festival" width="64" height="64"/>
      </SiteLink>
    </div>
    <nav className="fn-mobile-nav" id="fn-menu" aria-label={label} inert hidden><div><NavItems lang={lang} route={route} document={document} mobile/><SocialLinks lang={lang} document={document}/></div></nav>
  </header>;
}
export function Footer({route,document}) {
  const lang=langFor(route);
  return <footer className="fn-footer" style={background(document,'footer','var(--fn-coral)')}>
    <div className="fn-wrap fn-footer-grid">
      <div><h2>{copy(document,'shared.'+lang,'footer.name')}</h2><p>{copy(document,'shared.'+lang,'footer.organization')}<br/>{copy(document,'shared.'+lang,'footer.address')}<br/>{copy(document,'shared.'+lang,'footer.cvr')}</p><SiteLink href={copyLink(document,'shared.'+lang,'footer.email').href}>{copy(document,'shared.'+lang,'footer.email')}</SiteLink><SocialLinks lang={lang} document={document}/></div>
      <nav aria-label={localized(lang,'Links','Page links')}><NavItems lang={lang} route="" document={document}/>{['footer.press','footer.map','footer.partner'].map(key=><SiteLink key={key} href={copyLink(document,'shared.'+lang,key).href}>{copy(document,'shared.'+lang,key)}</SiteLink>)}</nav>
      <div className="fn-footer-date"><h2>{formatDates(festivalDates(document),lang,false)}<br/>{festivalDates(document).end.slice(0,4)}</h2><p>{copy(document,'shared.'+lang,'footer.location')}</p></div>
    </div>
    <div className="fn-copyright" style={background(document,'copyright','var(--fn-teal)')}><div className="fn-wrap">© {copy(document,'shared.'+lang,'footer.name')} {festivalDates(document).start.slice(0,4)}</div></div>
  </footer>;
}

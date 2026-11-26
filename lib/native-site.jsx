import React from 'react';
import { langFor, routeFor, localized, image, background, optimized, Header, Footer, Arrow, Button, SiteLink } from './native-chrome.jsx';
import { fontSettings } from './design.js';
import { imageKey, paletteCSS } from './appearance.js';
import { categories, publishedEvents } from './program.js';
import { festivalDates, festivalDaysFor, formatDates, countdownDate } from './festival-dates.js';
import { copy, copyLink } from './content-copy.js';
import PublicInteractions from './native-interactions.jsx';
import InnerPage from './native-inner.jsx';

const assets = '/festival-assets/wp-content/uploads/';
const desktopPoster = assets + '2026/02/48-timer-plakat-til-hjemmeside-1.png';
const mobilePoster = assets + '2026/03/48-timer-plakat-til-hjemmeside_mobil.jpg.png';
const photos = [
  assets + '2026/02/48-Timer-Festival-2025-Afslutning_-Sammen-Om-Noerrebroparken-Fotograf-Christina-Filo.jpg',
  assets + '2025/05/DB5A0599.jpg',
  assets + '2024/01/48TF-Drone-mov-image.jpg',
];
const sponsors = [
  ['William Demant Fonden', '2024/05/William_Demant_Fonden_white.png'],
  ['Spar Nord Fonden', '2024/05/SPARNORD.png'],
  ['Nordea-fonden', '2024/05/NORDEA.png'],
  ['Nørrebrohallen', '2021/02/Untitled-7.png'],
  ['Blågården', '2021/02/Blaagaarden.png'],
  ['Københavns Kommune', '2021/02/Koebenhavns_Kommune_nyt_logo-983x1024-1.png'],
  ['Nørrebro Lokaludvalg', '2021/01/Untitled-7.png'],
  ['Union', '2021/01/Untitled-5.png'],
  ['Områdefornyelsen ved Skjolds Plads', '2024/05/OMF.png'],
];
function Picture({ src, alt, sizes, eager = false, className, mobile }) {
  const widths = [384, 640, 828, 1080, 1440];
  const candidates = value => widths.map(width => optimized(value, width, eager ? 85 : 75) + ' ' + width + 'w').join(', ');
  return <picture className={className}>
    {mobile && <source media="(max-width: 700px)" srcSet={candidates(mobile)} sizes="100vw"/>}
    <img src={optimized(src, 828, eager ? 85 : 75)} srcSet={candidates(src)} sizes={sizes}
      data-original={src} data-mobile-original={mobile} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} decoding="async"/>
  </picture>;
}

function Countdown({ lang, document, sectionId = 'countdown' }) {
  return <section className="fn-section fn-countdown" style={background(document,sectionId,'var(--fn-yellow)')}>
    <div className="fn-wrap">
      <h2 className="fn-display">{copy(document,'shared.'+lang,'countdown.heading')}</h2>
      <div className="fn-countdown-grid" data-fn-countdown data-date={countdownDate(festivalDates(document))}>
        {[['days','Dage','Days'],['hours','Timer','Hours'],['minutes','Minutter','Minutes'],['seconds','Sekunder','Seconds']].map(([key,da,en]) => <div key={key}><strong data-unit={key}>–</strong><span>{localized(lang,da,en)}</span></div>)}
      </div>
    </div>
  </section>;
}

function Home({ lang, document }) {
  const en = lang === 'en';
  const route=routeFor(lang);
  const text=key=>copy(document,route,key);
  const link=key=>copyLink(document,route,key);
  const dates=festivalDates(document);
  const dateLabel=formatDates(dates,lang);
  const events = publishedEvents(document.programEvents);
  const mainPoster = image(document,desktopPoster);
  const phonePoster = document.images?.[imageKey(mobilePoster)] ?? (document.images?.[imageKey(desktopPoster)] || image(document,mobilePoster));
  return <>
    <section className="fn-hero" style={background(document,'/et_pb_section_0','var(--fn-coral)')}>
      <div className="fn-wrap fn-hero-grid">
        <div className="fn-hero-art"><Picture src={mainPoster} mobile={phonePoster} alt={localized(lang,'Illustreret festivalplakat','Illustrated festival poster')} sizes="(max-width: 700px) 100vw, 50vw" eager/></div>
        <div className="fn-hero-copy">
          <p className="fn-eyebrow">{text('hero.eyebrow')}</p>
          <h1>{text('hero.title1')}<br/>{text('hero.title2')}</h1>
          <p className="fn-hero-date">{dateLabel}</p>
          <p className="fn-lead">{text('hero.intro')}</p>
          <div className="fn-actions"><Button href={link('hero.program').href}>{link('hero.program').text}</Button><Button secondary href={link('hero.participate').href}>{link('hero.participate').text}</Button></div>
        </div>
      </div>
    </section>
    <div className="fn-ticker" style={background(document,'/et_pb_section_1','var(--fn-teal)')}>
      <span className="fn-sr-only">{dateLabel} · Nørrebro</span>
      <div className="fn-ticker-track" aria-hidden="true">{[0,1].map(copy => <div key={copy}>{[0,1,2,3].map(i => <span key={i}>{dateLabel.toUpperCase()} <b aria-hidden="true">·</b> NØRREBRO</span>)}</div>)}</div>
    </div>
    <section className="fn-section" style={background(document,'/et_pb_section_2','var(--fn-coral)')}>
      <div className="fn-wrap fn-program-promo" data-fn-reveal>
        <h2 className="fn-display">{text('program.heading')}</h2>
        <div><h3>{text(events.length?'program.available':'program.coming')}</h3>
          <p>{text(events.length?'program.availableBody':'program.comingBody')}</p>
          <div className="fn-actions"><Button href={link('program.button').href}>{link('program.button').text}</Button><SiteLink className="fn-text-link" href={link('program.facebook').href}>{link('program.facebook').text} <Arrow/></SiteLink></div>
        </div>
      </div>
    </section>
    <section className="fn-section" style={background(document,'/et_pb_section_3','var(--fn-teal)')}>
      <div className="fn-wrap">
        <div className="fn-section-heading" data-fn-reveal><h2 className="fn-display">{text('explore.heading')}</h2></div>
        <div className="fn-cards">
          {['card.participate','card.program','card.gallery'].map((key,index) => <SiteLink className="fn-card" data-fn-reveal key={key} href={link(key).href}><Picture src={image(document,photos[index])} alt="" sizes="(max-width: 700px) 90vw, 32vw"/><div><h3>{link(key).text}</h3><Arrow/></div></SiteLink>)}
        </div>
        <div className="fn-about" data-fn-reveal><h2>{text('about.heading')}</h2><div><p>{text('about.body')}</p><SiteLink className="fn-text-link" href={link('about.link').href}>{link('about.link').text} <Arrow/></SiteLink></div></div>
      </div>
    </section>
    <section className="fn-section fn-sponsors" style={background(document,'/et_pb_section_4','var(--fn-teal)')}>
      <div className="fn-wrap"><h2 className="fn-display">{text('sponsors.heading')}</h2><div className="fn-sponsor-grid">{sponsors.map(([name,src]) => <div key={src}><img src={optimized(image(document,assets+src),384)} data-original={image(document,assets+src)} alt={name} loading="lazy" decoding="async"/></div>)}</div></div>
    </section>
    <Countdown lang={lang} document={document}/>
  </>;
}

function dayLabel(day, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'da-DK', { weekday:'long', day:'numeric', month:'short', timeZone:'UTC' }).format(new Date(day + 'T12:00:00Z'));
}

function Program({ lang, document }) {
  const route=routeFor(lang,'program');
  const text=key=>copy(document,route,key);
  const link=key=>copyLink(document,route,key);
  const dates=festivalDates(document);
  const dateLabel=formatDates(dates,lang);
  const events = publishedEvents(document.programEvents);
  const venues = [...new Set(events.map(event => event.venue))].sort((a,b) => a.localeCompare(b));
  const en = lang === 'en';
  return <>
    <section className="fn-program-banner" style={background(document,'/program/et_pb_section_0','var(--fn-teal)')}><div className="fn-wrap"><p className="fn-eyebrow">{dateLabel} · Nørrebro</p><h1>{text('page.title')}</h1><p className="fn-lead">{text('page.intro')}</p></div></section>
    <section className="fn-section fn-program" style={background(document,'/program/et_pb_section_1','var(--fn-yellow)')}>
      <div className="fn-wrap">
        {events.length ? <>
          <form className="fn-filters" data-fn-filters>
            <label>{localized(lang,'Søg','Search')}<input name="search" type="search" placeholder={localized(lang,'Arrangement eller sted','Event or venue')}/></label>
            <label>{localized(lang,'Dag','Day')}<select name="day"><option value="">{localized(lang,'Alle dage','All days')}</option>{festivalDaysFor(dates).map(day => <option key={day} value={day}>{dayLabel(day,lang)}</option>)}</select></label>
            <label>{localized(lang,'Kategori','Category')}<select name="category"><option value="">{localized(lang,'Alle kategorier','All categories')}</option>{Object.entries(categories).map(([id,name])=><option value={id} key={id}>{name[lang]}</option>)}</select></label>
            <label>{localized(lang,'Sted','Location')}<select name="venue"><option value="">{localized(lang,'Alle steder','All locations')}</option>{venues.map(venue => <option value={venue} key={venue}>{venue}</option>)}</select></label>
            <button type="reset">{localized(lang,'Nulstil','Reset')}</button>
          </form>
          <p className="fn-results" data-fn-results aria-live="polite" data-label={localized(lang,'arrangementer','events')}>{events.length} {localized(lang,'arrangementer','events')}</p>
          <div className="fn-event-grid">
            {events.map(event => <article className="fn-event" key={event.id} data-fn-event data-day={event.day} data-category={event.category} data-venue={event.venue}>
              <div className="fn-event-meta"><span>{categories[event.category][lang]}</span><span>{dayLabel(event.day,lang)} · {event.start}{event.end && '–'+event.end}</span></div>
              <h2>{en ? event.titleEn : event.titleDa}</h2><p className="fn-event-venue">{event.venue}{event.address && ' · ' + event.address}</p>
              {(en ? event.descriptionEn : event.descriptionDa) && <p>{en ? event.descriptionEn : event.descriptionDa}</p>}
              {event.link && <a className="fn-text-link" href={event.link} target="_blank" rel="noreferrer">{localized(lang,'Læs mere','More information')} <Arrow/></a>}
            </article>)}
          </div>
          <p data-fn-no-results hidden>{localized(lang,'Ingen arrangementer matcher dine filtre.','No events match your filters.')}</p>
        </> : <div className="fn-empty-program"><h2 className="fn-display">{text('empty.heading')}</h2><p>{text('empty.body')}</p><div className="fn-actions"><Button href={link('empty.participate').href}>{link('empty.participate').text}</Button><Button secondary href={link('empty.facebook').href}>{link('empty.facebook').text}</Button></div></div>}
      </div>
    </section>
    <Countdown lang={lang} document={document}/>
  </>;
}

export function nativeTheme(document) {
  const fonts = fontSettings(document.fonts,document.typography);
  return { href:fonts.href, css:paletteCSS(document.colors ?? {}) + fonts.css };
}

export function NativeContent({ route, document }) {
  const lang = langFor(route);
  const home = route === '/' || route === '/en/';
  const program = route === '/program/' || route === '/en/program/';
  const theme = nativeTheme(document);
  return <div className="fn-native" lang={lang}>
    <link rel="stylesheet" href={theme.href} precedence="festival-fonts"/>
    <style>{theme.css}</style>
    <Header route={route} document={document}/>
    <main id="main-content" className="fn-main">{home ? <Home lang={lang} document={document}/> : program ? <Program lang={lang} document={document}/> : <InnerPage route={route} document={document} Countdown={Countdown}/>}</main>
    <Footer route={route} document={document}/>
    <PublicInteractions route={route}/>
  </div>;
}

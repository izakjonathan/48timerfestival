import React from 'react';
import { langFor, routeFor, localized, image, background, optimized, Header, Footer, Arrow, Button } from './native-chrome.jsx';
import { fontSettings } from './design.js';
import { imageKey, paletteCSS } from './appearance.js';
import { categories, festivalDays, publishedEvents } from './program.js';
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
      <h2 className="fn-display">{localized(lang,'Vi ses om','See you in')}</h2>
      <div className="fn-countdown-grid" data-fn-countdown data-date="2027-05-14T00:00:00+02:00">
        {[['days','Dage','Days'],['hours','Timer','Hours'],['minutes','Minutter','Minutes'],['seconds','Sekunder','Seconds']].map(([key,da,en]) => <div key={key}><strong data-unit={key}>–</strong><span>{localized(lang,da,en)}</span></div>)}
      </div>
    </div>
  </section>;
}

function Home({ lang, document }) {
  const en = lang === 'en';
  const events = publishedEvents(document.programEvents);
  const mainPoster = image(document,desktopPoster);
  const phonePoster = document.images?.[imageKey(mobilePoster)] ?? (document.images?.[imageKey(desktopPoster)] || mobilePoster);
  return <>
    <section className="fn-hero" style={background(document,'/et_pb_section_0','var(--fn-coral)')}>
      <div className="fn-wrap fn-hero-grid">
        <div className="fn-hero-art"><Picture src={mainPoster} mobile={phonePoster} alt={en ? 'Illustrated 48TIMER Festival 2027 poster' : 'Illustreret festivalplakat for 48TIMER Festival 2027'} sizes="(max-width: 700px) 100vw, 50vw" eager/></div>
        <div className="fn-hero-copy">
          <p className="fn-eyebrow">{localized(lang,'Nørrebro · København','Nørrebro · Copenhagen')}</p>
          <h1>48TIMER<br/>FESTIVAL</h1>
          <p className="fn-hero-date">{localized(lang,'14.–16. maj 2027','14–16 May 2027')}</p>
          <p className="fn-lead">{localized(lang,'En hel weekend med musik, kunst, mad og fællesskab på Nørrebro.','A whole weekend of music, art, food and community across Nørrebro.')}</p>
          <div className="fn-actions"><Button href={routeFor(lang,'program')}>{localized(lang,'Se program','Explore programme')}</Button><Button secondary href={routeFor(lang,'bliv-aktoer')}>{localized(lang,'Bliv aktør','Get involved')}</Button></div>
        </div>
      </div>
    </section>
    <div className="fn-ticker" style={background(document,'/et_pb_section_1','var(--fn-teal)')}>
      <span className="fn-sr-only">{localized(lang,'14.–16. maj 2027 · Nørrebro','14–16 May 2027 · Nørrebro')}</span>
      <div className="fn-ticker-track" aria-hidden="true">{[0,1].map(copy => <div key={copy}>{[0,1,2,3].map(i => <span key={i}>{localized(lang,'14.–16. MAJ 2027','14–16 MAY 2027')} <b aria-hidden="true">·</b> NØRREBRO</span>)}</div>)}</div>
    </div>
    <section className="fn-section" style={background(document,'/et_pb_section_2','var(--fn-coral)')}>
      <div className="fn-wrap fn-program-promo" data-fn-reveal>
        <h2 className="fn-display">{localized(lang,'Program','Programme')}</h2>
        <div><h3>{events.length ? localized(lang,'Find din næste festivaloplevelse','Find your next festival experience') : localized(lang,'Programmet er på vej!','The programme is on its way!')}</h3>
          <p>{events.length ? localized(lang,'Udforsk arrangementerne efter dag, kategori og sted.','Explore events by day, category and location.') : localized(lang,'Programmet offentliggøres efter tilmeldingsfristen. Følg med, eller vær med til at skabe festivalen.','The programme will be announced after the registration deadline. Follow along or help create the festival.')}</p>
          <div className="fn-actions"><Button href={routeFor(lang,'program')}>{localized(lang,'Se program','View programme')}</Button><a className="fn-text-link" href="https://www.facebook.com/48TimerFestival/events">{localized(lang,'Følg os på Facebook','Follow us on Facebook')} <Arrow/></a></div>
        </div>
      </div>
    </section>
    <section className="fn-section" style={background(document,'/et_pb_section_3','var(--fn-teal)')}>
      <div className="fn-wrap">
        <div className="fn-section-heading" data-fn-reveal><h2 className="fn-display">{localized(lang,'Oplev festivalen','Explore the festival')}</h2></div>
        <div className="fn-cards">
          {[
            ['bliv-aktoer','Bliv aktør','Get involved',photos[0]],
            ['program','Program','Programme',photos[1]],
            ['galleri','Galleri','Gallery',photos[2]],
          ].map(([path,da,en,src]) => <a className="fn-card" data-fn-reveal key={path} href={routeFor(lang,path)}><Picture src={image(document,src)} alt="" sizes="(max-width: 700px) 90vw, 32vw"/><div><h3>{localized(lang,da,en)}</h3><Arrow/></div></a>)}
        </div>
        <div className="fn-about" data-fn-reveal><h2>{localized(lang,'Om 48TIMER Festival','About 48TIMER Festival')}</h2><div><p>{localized(lang,'48TIMER Festival er en årlig kulturfestival på Nørrebro i midten af maj. Sammen med besøgende fra hele København fejrer vi alt det særlige ved vores bydel over en hel weekend – det personlige, nørdede og skæve, som Nørrebro rummer.','48TIMER Festival is an annual cultural festival in Nørrebro in mid-May. Together with visitors from across Copenhagen, we celebrate everything special about our neighbourhood over an entire weekend: its personal, quirky and creative sides.')}</p><a className="fn-text-link" href={routeFor(lang,'om-festivalen')}>{localized(lang,'Læs mere om festivalen','More about the festival')} <Arrow/></a></div></div>
      </div>
    </section>
    <section className="fn-section fn-sponsors" style={background(document,'/et_pb_section_4','var(--fn-teal)')}>
      <div className="fn-wrap"><h2 className="fn-display">{localized(lang,'En særlig tak til','A special thanks to')}</h2><div className="fn-sponsor-grid">{sponsors.map(([name,src]) => <div key={src}><img src={optimized(image(document,assets+src),384)} data-original={image(document,assets+src)} alt={name} loading="lazy" decoding="async"/></div>)}</div></div>
    </section>
    <Countdown lang={lang} document={document}/>
  </>;
}

function dayLabel(day, lang) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'da-DK', { weekday:'long', day:'numeric', month:'short', timeZone:'UTC' }).format(new Date(day + 'T12:00:00Z'));
}

function Program({ lang, document }) {
  const events = publishedEvents(document.programEvents);
  const venues = [...new Set(events.map(event => event.venue))].sort((a,b) => a.localeCompare(b));
  const en = lang === 'en';
  return <>
    <section className="fn-program-banner" style={background(document,'/program/et_pb_section_0','var(--fn-teal)')}><div className="fn-wrap"><p className="fn-eyebrow">{localized(lang,'14.–16. maj 2027 · Nørrebro','14–16 May 2027 · Nørrebro')}</p><h1>{localized(lang,'Program','Programme')}</h1><p className="fn-lead">{localized(lang,'Find det, du vil opleve til 48TIMER Festival.','Find your next experience at 48TIMER Festival.')}</p></div></section>
    <section className="fn-section fn-program" style={background(document,'/program/et_pb_section_1','var(--fn-yellow)')}>
      <div className="fn-wrap">
        {events.length ? <>
          <form className="fn-filters" data-fn-filters>
            <label>{localized(lang,'Søg','Search')}<input name="search" type="search" placeholder={localized(lang,'Arrangement eller sted','Event or venue')}/></label>
            <label>{localized(lang,'Dag','Day')}<select name="day"><option value="">{localized(lang,'Alle dage','All days')}</option>{festivalDays.map(day => <option key={day} value={day}>{dayLabel(day,lang)}</option>)}</select></label>
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
        </> : <div className="fn-empty-program"><h2 className="fn-display">{localized(lang,'Programmet er på vej!','The programme is on its way!')}</h2><p>{localized(lang,'Programmet offentliggøres efter tilmeldingsfristen. Indtil da kan du følge festivalen på Facebook eller læse om at blive aktør.','The programme will be published after the registration deadline. Until then, follow the festival on Facebook or find out how to get involved.')}</p><div className="fn-actions"><Button href={routeFor(lang,'bliv-aktoer')}>{localized(lang,'Bliv aktør','Get involved')}</Button><Button secondary href="https://www.facebook.com/48TimerFestival/events">{localized(lang,'Følg på Facebook','Follow on Facebook')}</Button></div></div>}
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
    <link rel="stylesheet" href={theme.href}/>
    <style>{theme.css}</style>
    <Header route={route} document={document}/>
    <main id="main-content" className="fn-main">{home ? <Home lang={lang} document={document}/> : program ? <Program lang={lang} document={document}/> : <InnerPage route={route} document={document} Countdown={Countdown}/>}</main>
    <Footer route={route} document={document}/>
  </div>;
}

import { renderSocialIcons } from './social-icons.js';
import { renderRegistration } from './registration.js';
import { load } from 'cheerio';
import parseCss from 'postcss-safe-parser';
import pages from './pages.js';
import { optimizePublicImages, posterSources } from './public-images.js';
import stylesheets from '../content/stylesheets.json';
import { imageKey, imagesFor, palette, paletteCSS, replaceImages, themeValue } from './appearance.js';

export const pageImages = Object.fromEntries(Object.entries(pages).map(([route, page]) => [route, imagesFor(page.html)]));
const imageKeys = new Set(Object.values(pageImages).flatMap(Object.keys));
const posterKeys = [...new Set(['/', '/en/'].flatMap((route) => Object.keys(pageImages[route])))].filter((key) => key.includes('plakat-til-hjemmeside'));

export const stylesheetSnapshot = stylesheets;
const cssOrigin = 'https://www.48timerfestival.dk';
const dynamicStylesheet = /https:[\\][\/][\\][\/]www\.48timerfestival\.dk((?:[\\][\/][^"\s\\]+)+\.css)/g;

function stylesheetPath(href) {
  if (href?.startsWith('/festival-assets/')) return href.slice('/festival-assets'.length).split('?')[0];
  if (href?.startsWith(cssOrigin + '/')) return href.slice(cssOrigin.length).split('?')[0];
  return href;
}

export function themedHref(path) {
  return path.startsWith('https://') ? '/festival-theme/external/leaflet.css' : '/festival-theme' + path;
}

export { palette };

// Keep same-site links within this deployment in both languages.
const festivalPageLink = /https?:\/\/(?:www\.)?48timerfestival\.dk(\/[^"'?#<>\s\\]*)(?=["'#?<>\s]|$)/gi;

function localizePageLinks(source) {
  const html = source.replace(festivalPageLink, (url, path, index) => {
    const prefix = source.slice(Math.max(0, index - 36), index);
    if (/(?:action|data-trp-original-action)=["']$/i.test(prefix)) return url;
    const route = path.endsWith('/') ? path : path + '/';
    return Object.hasOwn(pages, route) ? route : url;
  });
  return html.replace(/"https:[\\][\/][\\][\/]www\.48timerfestival\.dk((?:[\\][\/][^"\\]*)+)"/gi,
    (match, path) => {
      const local = path.replaceAll('\\/', '/');
      const route = local.endsWith('/') ? local : local + '/';
      return Object.hasOwn(pages, route) ? JSON.stringify(route) : match;
    });
}

export function validAppearance(key, edits) {
  return Object.entries(edits).every(([id, value]) => {
    if (typeof value !== 'string') return false;
    return key === 'colors'
      ? Object.hasOwn(palette, id) && /^#[\da-f]{6}$/i.test(value)
      : imageKeys.has(id) && /^\/media\/[0-9a-f-]{36}\.webp$/.test(value);
  });
}

export function themeStylesheet(css, originalPath) {
  const root = parseCss(css);
  root.walkDecls((decl) => {
    if (decl.prop === 'src' || decl.prop.startsWith('--festival-')) return;
    decl.value = themeValue(decl.value, decl.prop, palette);
  });
  if (originalPath) {
    const localize = (value) => value.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
      if (/^(?:data:|#|\/festival-assets\/)/i.test(url)) return match;
      const resolved = new URL(url, originalPath.startsWith('https://') ? originalPath : cssOrigin + originalPath);
      return resolved.origin === 'https://www.48timerfestival.dk'
        ? 'url("/festival-assets' + resolved.pathname + resolved.search + resolved.hash + '")'
        : 'url(' + JSON.stringify(resolved.href) + ')';
    });
    root.walkDecls((decl) => { decl.value = localize(decl.value); });
    root.walkAtRules('import', (rule) => { rule.params = localize(rule.params); });
  }
  return root.toString();
}

export function renderPage(route, document = {}, { preview = false } = {}) {
  const page = pages[route];
  if (!page) return null;
  const colors = Object.fromEntries(Object.entries(document.colors ?? {}).filter(([key]) => Object.hasOwn(palette, key)));
  const images = document.images ?? {};
  const edits = document[route] ?? {};
  const baseline = localizePageLinks(page.html).replace('</head>', '<link rel="stylesheet" href="/festival-menu.css"></head>');
  const $ = load(baseline);
  $('head').append('<script src="/festival-interface.js" defer></script><script src="/festival-motion.js" defer></script>');
  $('#menu-open strong').first().addClass('festival-menu-icon').attr('aria-hidden', 'true')
    .html('<span></span><span></span><span></span>');
  $('.et-l--header .et_pb_image_0_tb_header img').addClass('festival-header-logo');
  $('body').prepend(
    '<svg class="festival-logo-filter" width="0" height="0" aria-hidden="true" focusable="false">' +
    '<filter id="festival-logo-yellow" color-interpolation-filters="sRGB">' +
    '<feFlood class="festival-logo-tint" result="tint"/>' +
    '<feBlend in="SourceGraphic" in2="tint" mode="multiply" result="colored"/>' +
    '<feComposite in="colored" in2="SourceGraphic" operator="in"/>' +
    '</filter></svg>'
  );
  const english = route.startsWith('/en/');
  if (route === '/bliv-aktoer/' || route === '/en/bliv-aktoer/') renderRegistration($, english);
  const danishPath = english ? route.slice(3) : route;
  const englishPath = '/en' + danishPath;
  const languageSwitch = $('<nav class="festival-language" aria-label="Language / Sprog"></nav>');
  for (const [label, language, href] of [['DA', 'da', danishPath], ['EN', 'en', englishPath]]) {
    const link = $('<a></a>').text(label).attr({ href, target: preview ? '_self' : '_top', lang: language, hreflang: language, 'aria-label': language === 'da' ? 'Dansk' : 'English' });
    if (href === route) link.attr('aria-current', 'page');
    languageSwitch.append(link);
  }
  $('body').append(languageSwitch);
  renderSocialIcons($);

  if (route === '/' || route === '/en/') {
    const phone = $('#main-content .et_parallax_bg_phone').first();
    const section = phone.closest('.et_pb_section');
    const posterSource = (element) => element.attr('style')?.match(/url\(\s*['"]?([^'"\s)]+)/)?.[1];
    const mobile = posterSource(phone);
    const desktop = posterSource(section.find('.et_parallax_bg').last()) ?? mobile;
    if (mobile && desktop) {
      section.addClass('festival-poster').removeClass('et_pb_section_parallax');
      section.children('.et_parallax_bg_wrap').remove();
      const picture = $('<picture class="festival-poster-image"></picture>');
      picture.append($('<source media="(max-width: 767px)">').attr('srcset', mobile));
      picture.append($('<img decoding="async" fetchpriority="high">').attr({
        src: desktop,
        alt: english ? '48 Timer Festival poster' : '48 Timer Festival-plakat',
      }));
      section.append(picture);
    }
    $('#main-content h1').each((_, node) => {
      if ($(node).text().trim().toLowerCase() === 'program') {
        $(node).addClass('festival-program-centered').closest('.et_pb_text').addClass('festival-program-column');
      }
    });
    $('#main-content .et_pb_gallery_0').addClass('festival-sponsors');
    $('#main-content .et_pb_row_5').has('.et_pb_heading_1 .et_pb_module_heading').addClass('festival-home-cards');
  }

  $('#main-content .hurrytimer-cdt').closest('.et_pb_section').addClass('festival-countdown');

  $('#main-content .et_pb_text_inner h1').each((_, node) => {
    if ($(node).text().trim().toLowerCase() === 'program') $(node).attr('data-festival-program', '');
  });

  const headingMarquee = $('marquee').first();
  if (headingMarquee.length) {
    const text = headingMarquee.text().trim().split(/\s{3,}/)[0];
    const style = headingMarquee.find('[style]').first().attr('style');
    const ticker = $('<span class="festival-date-ticker"></span>');
    ticker.append($('<span class="festival-date-label"></span>').text(text));
    const track = $('<span class="festival-date-track" aria-hidden="true"></span>').attr('style', style ?? '');
    for (let copy = 0; copy < 2; copy++) {
      const group = $('<span class="festival-date-group"></span>');
      for (let item = 0; item < 5; item++) group.append($('<span></span>').text(text));
      track.append(group);
    }
    ticker.append(track);
    headingMarquee.replaceWith(ticker);
  }

  if (!$('#main-content .ajde_evcal_calendar, #main-content .evo_cal_listing, #main-content .evo_eventcard').length) {
    $('#evcal_gmaps-js, #evo_jitsi-js').remove();
  }

  if (preview) $('head').prepend('<base href="' + route + '">');

  const hasColors = Object.keys(colors).length > 0;
  const fontLinks = new Set();
  $('link[href]').each((_, node) => {
    const link = $(node);
    const href = link.attr('href');
    if (href.startsWith('https://fonts.googleapis.com/css') && link.attr('rel') === 'stylesheet') {
      if (fontLinks.has(href)) link.remove();
      fontLinks.add(href);
    }
    if (href === 'http://fonts.googleapis.com') link.attr('href', 'https://fonts.googleapis.com');
    const path = stylesheetPath(href);
    if (!Object.hasOwn(stylesheets, path)) return;
    link.attr('href', themedHref(path));
    if (preview && link.attr('as') === 'style') link.attr('rel', 'stylesheet').removeAttr('onload').removeAttr('as');
  });
  $('script:not([src])').each((_, node) => {
      const script = $(node);
      const source = script.html().replace(dynamicStylesheet, (match, escapedPath) => {
        const path = escapedPath.replaceAll('\\/', '/');
        if (!Object.hasOwn(stylesheets, path)) return match;
        const href = themedHref(path);
        if (preview) {
          if (!$('link').toArray().some((link) => $(link).attr('href') === href)) {
            script.before($('<link rel="stylesheet">').attr('href', href));
          }
        }
        return href;
      });
      script.text(source.replace(/("accent_color"\s*:\s*")#([\da-f]{6})(")/gi,
        (match, start, key, end) => colors[key.toLowerCase()] ? start + colors[key.toLowerCase()] + end : match));
  });
  $('script:not([src])').each((_, node) => {
    const script = $(node);
    const source = script.html();
    if (!source.includes('var et_link_options_data')) return;
    script.text(source.replace(/(var et_link_options_data\s*=\s*)(\[[^;]*?\]);/s, (match, prefix, data) => {
      let options;
      try { options = JSON.parse(data); } catch { return match; }
      const remaining = options.filter((option) => {
        if (!/^et_pb_text_\d+_tb_header$/.test(option.class) || !Object.hasOwn(pages, option.url)) return true;
        const text = $('.section-transform .' + option.class + ' .et_pb_text_inner p');
        if (!text.length || text.find('a').length) return true;
        text.wrapInner($('<a class="festival-menu-link"></a>').attr('href', option.url));
        return false;
      });
      return prefix + JSON.stringify(remaining) + ';';
    }));
  });

  {
    $('style').each((_, node) => {
      try { $(node).text(themeStylesheet($(node).html())); } catch { /* Preserve malformed imported styles. */ }
    });
    $('[style],[fill],[stroke],[color],[bgcolor]').each((_, node) => {
      const element = $(node);
      for (const attribute of ['style', 'fill', 'stroke', 'color', 'bgcolor']) {
        const value = element.attr(attribute);
        if (!value) continue;
        if (attribute === 'style') {
          try { element.attr(attribute, themeStylesheet('x{' + value + '}').slice(2, -1)); } catch { /* Keep original. */ }
        } else if (attribute === 'color' || attribute === 'bgcolor') {
          element.css(attribute === 'color' ? 'color' : 'background-color', themeValue(value, attribute === 'color' ? 'color' : 'background-color', palette));
        } else {
          element.attr(attribute, themeValue(value, attribute, palette));
        }
      }
    });
    if (hasColors) $('head').append('<style>' + paletteCSS(colors) + '</style>');
  }

  if (preview || document.elementColors?.[route]) {
    const targets = $('main, #main-content, .et-l--header, .et-l--footer, .festival-language')
      .find('h1,h2,h3,h4,h5,h6,p,a,button,label,section,.et_pb_section');
    const assignments = document.elementColors?.[route] ?? {};
    targets.each((index, node) => {
      const id = 'element-' + index;
      const element = $(node);
      if (preview) element.attr('data-festival-element', id);
      const assignment = assignments[id];
      if (!assignment) return;
      for (const [property, swatch] of Object.entries(assignment)) {
        if (!['color', 'background-color'].includes(property) || !Object.hasOwn(palette, swatch)) continue;
        const value = 'var(--festival-' + swatch + ', #' + swatch + ') !important';
        const apply = (item) => {
          const fill = property === 'color' ? '-webkit-text-fill-color:currentColor !important;' : '';
          item.attr('style', (item.attr('style') ?? '') + ';' + property + ':' + value + ';' + fill);
        };
        apply(element);
        if (property === 'color' && !element.is('section,.et_pb_section')) {
          element.find('span,strong,em,b,i,a').each((_, child) => apply($(child)));
        }
      }
    });
  }

  for (const [key, edit] of Object.entries(edits)) {
    const field = page.fields[key];
    if (!field) continue;
    const node = $('[data-edit-key="' + key + '"]');
    if (field.kind === 'image') {
      if (edit.value && (!field.value.includes('/wp-content/') || !images[imageKey(field.value)])) node.attr('src', edit.value).removeAttr('srcset').removeAttr('sizes');
    } else {
      if (edit.value !== undefined) node.text(edit.value);
      if (edit.href !== undefined) node.attr('href', edit.href);
    }
  }

  // A single uploaded poster can serve both layouts until a mobile variant is supplied.
  const desktop = posterKeys.find((key) => !key.includes('_mobil'));
  const mobile = posterKeys.find((key) => key.includes('_mobil'));
  const replacements = { ...images };
  if (images[desktop] && !images[mobile]) replacements[mobile] = images[desktop];
  const output = Object.keys(replacements).length ? load(replaceImages($.html(), replacements)) : $;
  const mobilePoster = output('.festival-poster-image source');
  if (mobilePoster.length) {
    mobilePoster.attr('srcset', posterSources(mobilePoster.attr('srcset'))).attr('sizes', '100vw');
  }
  const desktopPoster = output('.festival-poster-image img');
  if (desktopPoster.length) {
    desktopPoster.attr('srcset', posterSources(desktopPoster.attr('src'))).attr('sizes', '(max-width: 767px) 100vw, min(65vh, 760px)');
  }
  optimizePublicImages(output);
  return output.html();
}

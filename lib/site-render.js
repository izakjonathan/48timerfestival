import { load } from 'cheerio';
import parseCss from 'postcss-safe-parser';
import pages from './pages.js';
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
  const english = route.startsWith('/en/');
  const danishPath = english ? route.slice(3) : route;
  const englishPath = '/en' + danishPath;
  const languageSwitch = $('<nav class="festival-language" aria-label="Language / Sprog"></nav>');
  for (const [label, language, href] of [['DA', 'da', danishPath], ['EN', 'en', englishPath]]) {
    const link = $('<a></a>').text(label).attr({ href, lang: language, hreflang: language, 'aria-label': language === 'da' ? 'Dansk' : 'English' });
    if (href === route) link.attr('aria-current', 'page');
    languageSwitch.append(link);
  }
  $('body').append(languageSwitch);

  if (route === '/' || route === '/en/') {
    const phone = $('#main-content .et_parallax_bg_phone').first();
    const posterUrl = phone.attr('style')?.match(/url\(\s*['"]?([^'"\s)]+)/)?.[1];
    if (posterUrl) {
      const section = phone.closest('.et_pb_section').addClass('festival-poster');
      const picture = $('<picture class="festival-poster-image"></picture>');
      picture.append($('<source media="(max-width: 767px)">').attr('srcset', posterUrl));
      picture.append($('<img decoding="async" fetchpriority="high">').attr({
        src: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
        alt: english ? '48 Timer Festival poster' : '48 Timer Festival-plakat',
      }));
      section.append(picture);
    }
    $('#main-content .et_pb_gallery_0').addClass('festival-sponsors');
  }

  if (preview) $('head').prepend('<base href="' + route + '">');

  const hasColors = Object.keys(colors).length > 0;
  $('link[href]').each((_, node) => {
    const link = $(node);
    const path = stylesheetPath(link.attr('href'));
    if (!Object.hasOwn(stylesheets, path)) return;
    if (hasColors) link.attr('href', themedHref(path));
    if (preview && link.attr('as') === 'style') link.attr('rel', 'stylesheet').removeAttr('onload').removeAttr('as');
  });
  if (hasColors || preview) {
    $('script:not([src])').each((_, node) => {
      const script = $(node);
      const source = script.html().replace(dynamicStylesheet, (match, escapedPath) => {
        const path = escapedPath.replaceAll('\\/', '/');
        if (!Object.hasOwn(stylesheets, path)) return match;
        const href = hasColors ? themedHref(path) : '/festival-assets' + path;
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
  }
  if (Object.keys(colors).length) {
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
          element.css(attribute === 'color' ? 'color' : 'background-color', themeValue(value, 'color', palette));
        } else {
          element.attr(attribute, themeValue(value, attribute, palette));
        }
      }
    });
    $('head').append('<style>' + paletteCSS(colors) + '</style>');
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
  return replaceImages($.html(), replacements);
}

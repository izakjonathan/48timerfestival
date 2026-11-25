import { load } from 'cheerio';
import parseCss from 'postcss-safe-parser';
import pages from '../content/pages.json';
import stylesheets from '../content/stylesheets.json';
import { colorLabels, imageKey, imagesFor, paletteCSS, replaceImages, themeValue, visitColors } from './appearance.js';

export const pageImages = Object.fromEntries(Object.entries(pages).map(([route, page]) => [route, imagesFor(page.html)]));
const imageKeys = new Set(Object.values(pageImages).flatMap(Object.keys));
const posterKeys = Object.keys(pageImages['/en/']).filter((key) => key.includes('plakat-til-hjemmeside'));

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

const counts = new Map();

function collect(value, property) {
  visitColors(value, property, (token, { key }) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return token;
  });
}

function collectStyles(css) {
  try {
    parseCss(css).walkDecls(({ value, prop }) => collect(value, prop));
  } catch { /* Keep invalid imported CSS as supplied. */ }
}

for (const css of Object.values(stylesheets)) collectStyles(css);
for (const page of Object.values(pages)) {
  const $ = load(page.html);
  $('style').each((_, node) => collectStyles($(node).html()));
  $('[style]').each((_, node) => collectStyles('x{' + $(node).attr('style') + '}'));
  for (const attribute of ['fill', 'stroke', 'color', 'bgcolor']) {
    $('[ ' + attribute + ' ]').each((_, node) => collect($(node).attr(attribute), attribute === 'bgcolor' ? 'color' : attribute));
  }
}

export const palette = Object.fromEntries([
  ...Object.entries(colorLabels),
  ...[...counts].filter(([key]) => !Object.hasOwn(colorLabels, key))
    .sort(([first, firstCount], [second, secondCount]) => secondCount - firstCount || first.localeCompare(second))
    .map(([key]) => [key, '#' + key.toUpperCase()]),
]);

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
    decl.value = themeValue(decl.value, decl.prop);
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
  const colors = document.colors ?? {};
  const images = document.images ?? {};
  const edits = document[route] ?? {};
  const baseline = page.html.replace('</head>', '<link rel="stylesheet" href="/festival-menu.css"></head>');
  if (!preview && [colors, images, edits].every((group) => Object.keys(group).length === 0)) return baseline;
  const $ = load(baseline);
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
          element.css(attribute === 'color' ? 'color' : 'background-color', themeValue(value));
        } else {
          element.attr(attribute, themeValue(value, attribute));
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

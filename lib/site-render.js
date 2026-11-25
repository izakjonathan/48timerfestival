import { load } from 'cheerio';
import postcss from 'postcss';
import pages from '../content/pages.json';
import { imageKey, imagesFor, palette, paletteCSS, replaceImages, themeValue } from './appearance.js';

export const pageImages = Object.fromEntries(Object.entries(pages).map(([route, page]) => [route, imagesFor(page.html)]));
const imageKeys = new Set(Object.values(pageImages).flatMap(Object.keys));
const posterKeys = Object.keys(pageImages['/en/']).filter((key) => key.includes('plakat-til-hjemmeside'));

export function validAppearance(key, edits) {
  return Object.entries(edits).every(([id, value]) => {
    if (typeof value !== 'string') return false;
    return key === 'colors'
      ? Object.hasOwn(palette, id) && /^#[\da-f]{6}$/i.test(value)
      : imageKeys.has(id) && /^\/media\/[0-9a-f-]{36}\.webp$/.test(value);
  });
}

export function themeStylesheet(css, originalPath) {
  const root = postcss.parse(css);
  root.walkDecls((decl) => {
    if (decl.prop === 'src' || decl.prop.startsWith('--festival-')) return;
    decl.value = themeValue(decl.value);
  });
  if (originalPath) {
    const localize = (value) => value.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (match, quote, url) => {
      if (/^(?:data:|#|\/festival-assets\/)/i.test(url)) return match;
      const resolved = new URL(url, 'https://www.48timerfestival.dk' + originalPath);
      return resolved.origin === 'https://www.48timerfestival.dk'
        ? 'url("/festival-assets' + resolved.pathname + resolved.search + resolved.hash + '")'
        : match;
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

  $('link[href^="/festival-assets/"]').each((_, node) => {
    const link = $(node);
    const href = link.attr('href');
    if (/\.css(?:\?|$)/.test(href)) {
      if (Object.keys(colors).length) link.attr('href', href.replace('/festival-assets/', '/festival-theme/'));
      if (preview && link.attr('as') === 'style') link.attr('rel', 'stylesheet').removeAttr('onload').removeAttr('as');
    }
  });
  if (Object.keys(colors).length) {
    $('style').each((_, node) => {
      try { $(node).text(themeStylesheet($(node).html())); } catch { /* Preserve malformed imported styles. */ }
    });
    $('[style],[fill],[stroke],[color],[bgcolor]').each((_, node) => {
      const element = $(node);
      for (const attribute of ['style', 'fill', 'stroke', 'color', 'bgcolor']) {
        const value = element.attr(attribute);
        if (value && !['color', 'bgcolor'].includes(attribute)) element.attr(attribute, themeValue(value));
        else if (value) element.css(attribute === 'color' ? 'color' : 'background-color', themeValue(value));
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

export const stylesheets = new Set(Object.values(pages).flatMap(({ html }) =>
  [...html.matchAll(/href="\/festival-assets(\/[^"]+?\.css)"/g)].map((match) => match[1])
));

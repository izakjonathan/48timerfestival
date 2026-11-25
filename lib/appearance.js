const imagePattern = /(?:https?:\/\/(?:www\.)?48timerfestival\.dk)?\/(?:festival-assets\/)?wp-content\/uploads\/[\w%./+~-]+\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?![\w.-])/gi;

export const palette = {
  '2b141e': 'Burgundy',
  f9f5c7: 'Cream',
  eabc48: 'Gold',
  b39a9b: 'Muted rose',
  ffffff: 'White',
  '000000': 'Black',
  '2200b7': 'Violet',
  cef293: 'Lime',
  '2ea3f2': 'Blue',
  '666666': 'Medium grey',
  '333333': 'Charcoal',
  eeeeee: 'Light grey',
  dddddd: 'Grey',
  '999999': 'Muted grey',
};

function localAsset(url) {
  return '/festival-assets' + url.slice(url.indexOf('/wp-content/'));
}

export function imageKey(url) {
  return localAsset(url).replace(/-(?:\d+x\d+|scaled)(?=\.[^.]+$)/gi, '').toLowerCase();
}

function labelForImage(url) {
  if (url.includes('plakat-til-hjemmeside_mobil')) return 'Main poster · mobile';
  if (url.includes('plakat-til-hjemmeside')) return 'Main poster · desktop';
  if (url.includes('LogoFritlagt')) return 'Festival logo';
  const filename = url.split('/').at(-1);
  let label;
  try { label = decodeURIComponent(filename); } catch { label = filename; }
  return label.replace(/\.[^.]+$/, '').replaceAll('_', ' ');
}

export function imagesFor(html) {
  const images = {};
  for (const [url] of html.matchAll(imagePattern)) {
    const key = imageKey(url);
    const value = localAsset(url);
    if (!images[key] || !/-\d+x\d+\./i.test(value)) {
      images[key] = { value, label: labelForImage(value) };
    }
  }
  return images;
}

export function replaceImages(source, images) {
  return source.replace(imagePattern, (url) => images[imageKey(url)] ?? url);
}

const tokens = /\/\*[\s\S]*?\*\/|url\([^)]*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[a-f\d]{3,8}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*\d*\.?\d+)?\s*\)|\b(?:white|black)\b/gi;

function colorToken(token) {
  const lower = token.toLowerCase();
  if (lower === 'white') return ['ffffff', 1];
  if (lower === 'black') return ['000000', 1];
  if (lower.startsWith('#')) {
    let hex = lower.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((n) => n.repeat(2)).join('');
    if (hex.length === 6 || hex.length === 8) return [hex.slice(0, 6), hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1];
  }
  if (lower.startsWith('rgb')) {
    const [r, g, b, opacity = 1] = lower.match(/[\d.]+/g).map(Number);
    if ([r, g, b].every((n) => n <= 255)) return [[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join(''), opacity];
  }
  return [];
}

export function themeValue(value) {
  return value.replace(tokens, (token) => {
    const [key, opacity] = colorToken(token);
    if (!Object.hasOwn(palette, key) || opacity === 0) return token;
    if (opacity === 1) return 'var(--festival-' + key + ', ' + token + ')';
    return 'rgb(var(--festival-rgb-' + key + ', ' + [0, 2, 4].map((i) => parseInt(key.slice(i, i + 2), 16)).join(' ') + ') / ' + opacity + ')';
  });
}

export function paletteCSS(colors) {
  return ':root{' + Object.entries(colors).map(([key, value]) =>
    '--festival-' + key + ':' + value + ';--festival-rgb-' + key + ':' +
    [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' ') + ';'
  ).join('') + '}';
}

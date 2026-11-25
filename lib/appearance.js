import colorString from 'color-string';

const imagePattern = /(?:https?:\/\/(?:www\.)?48timerfestival\.dk)?\/(?:festival-assets\/)?wp-content\/uploads\/[\w%./+~-]+\.(?:avif|gif|ico|jpe?g|png|svg|webp)(?![\w.-])/gi;

export const palette = {
  '2b141e': 'Burgundy',
  eabc48: 'Gold',
  f9f5c7: 'Cream',
  b39a9b: 'Muted rose',
  ffffff: 'White',
  '000000': 'Black',
  f43372: 'Festival pink',
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

const tokens = /\/\*[\s\S]*?\*\/|url\((?:\\.|[^)])*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[a-f\d]{3,8}\b|\b(?:rgba?|hsla?|hwb)\([^()]*\)|[a-z_][\w-]*/gi;

function colorToken(token) {
  const source = token.toLowerCase();
  const modern = /^(hsl|hwb)\(\s*(-?[\d.]+)(?:deg)?\s+([\d.]+)%\s+([\d.]+)%(?:\s*\/\s*([\d.]+)(%)?)?\s*\)$/.exec(source);
  const result = modern
    ? { model: modern[1], value: [((Number(modern[2]) % 360) + 360) % 360,
      Number(modern[3]), Number(modern[4]), modern[5] === undefined ? 1 : Number(modern[5]) / (modern[6] ? 100 : 1)] }
    : colorString.get(source);
  if (!result) return null;
  let { value: [r, g, b, opacity] } = result;
  if (result.model === 'hsl') {
    const [hue, saturation, lightness] = [r / 60, g / 100, b / 100];
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const intermediate = chroma * (1 - Math.abs(hue % 2 - 1));
    const offset = lightness - chroma / 2;
    const sectors = [[chroma, intermediate, 0], [intermediate, chroma, 0], [0, chroma, intermediate],
      [0, intermediate, chroma], [intermediate, 0, chroma], [chroma, 0, intermediate]];
    [r, g, b] = sectors[Math.floor(hue) % 6].map((channel) => (channel + offset) * 255);
  }
  if (result.model === 'hwb') {
    const white = g / 100;
    const black = b / 100;
    if (white + black >= 1) {
      r = g = b = 255 * white / (white + black);
    } else {
      const hue = r / 60;
      const channels = [5, 3, 1].map((shift) => {
        const k = (shift + hue) % 6;
        return 1 - Math.max(0, Math.min(k, 4 - k, 1));
      });
      [r, g, b] = channels.map((channel) => 255 * (white + channel * (1 - white - black)));
    }
  }
  const key = [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  return opacity > 0 ? { key, opacity } : null;
}

const acceptsNames = /^(?:--|(?:.*-)?(?:color|background|border|outline|shadow|fill|stroke|decoration|gradient|accent))/i;

export function visitColors(value, property, visit) {
  return value.replace(tokens, (token) => {
    if (!/^(?:#|rgb[a]?\(|hsl[a]?\(|hwb\()/i.test(token) && !acceptsNames.test(property)) return token;
    const color = colorToken(token);
    return color ? visit(token, color) : token;
  });
}

export function themeValue(value, property = 'color', colors) {
  return visitColors(value, property, (token, { key, opacity }) => {
    if (colors && !Object.hasOwn(colors, key)) return token;
    if (opacity === 1) return 'var(--festival-' + key + ', ' + token + ')';
    const channels = [0, 2, 4].map((i) => parseInt(key.slice(i, i + 2), 16)).join(' ');
    return 'rgb(var(--festival-rgb-' + key + ', ' + channels + ') / ' + opacity + ')';
  });
}

export function paletteCSS(colors) {
  return ':root{' + Object.entries(colors).map(([key, value]) =>
    '--festival-' + key + ':' + value + ';--festival-rgb-' + key + ':' +
    [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' ') + ';'
  ).join('') + '}';
}

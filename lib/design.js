export const sectionColors = {
  '#ff533d': 'Coral',
  '#f43372': 'Pink',
  '#fff642': 'Yellow',
  '#47c2c3': 'Turquoise',
};

export const fontRoles = {
  h1: { label: 'H1 · Main headings', defaultFamily: 'Fjalla One', lineHeight: 1.12, letterSpacing: .005 },
  h2: { label: 'H2 · Subheadings', defaultFamily: 'Fjalla One', lineHeight: 1.2, letterSpacing: .01 },
  buttons: { label: 'Buttons and menu links', defaultFamily: 'Fjalla One', lineHeight: 1.18, letterSpacing: .025 },
  body: { label: 'Body text', defaultFamily: 'Noto Sans', lineHeight: 1.6, letterSpacing: 0 },
};

const weights = (min, max) => Array.from({ length: (max - min) / 100 + 1 }, (_, index) => min + index * 100);

// Available upright weights and whether Google Fonts also supplies an italic face.
export const googleFonts = {
  'Anton': { weights: [400] },
  'Archivo Black': { weights: [400] },
  'Bebas Neue': { weights: [400] },
  'Archivo': { weights: weights(100, 900), italic: true },
  'Barlow Condensed': { weights: weights(100, 900), italic: true },
  'Bricolage Grotesque': { weights: weights(200, 800) },
  'DM Sans': { weights: weights(100, 900), italic: true },
  'Fjalla One': { weights: [400] },
  'Inter': { weights: weights(100, 900), italic: true },
  'Lexend': { weights: weights(100, 900) },
  'Manrope': { weights: weights(200, 800) },
  'Montserrat': { weights: weights(100, 900), italic: true },
  'Noto Sans': { weights: weights(100, 900), italic: true },
  'Oswald': { weights: weights(200, 700) },
  'Outfit': { weights: weights(100, 900) },
  'Playfair Display': { weights: weights(400, 900), italic: true },
  'Roboto': { weights: weights(100, 900), italic: true },
  'Rubik': { weights: weights(300, 900), italic: true },
  'Source Sans 3': { weights: weights(200, 900), italic: true },
  'Space Grotesk': { weights: weights(300, 700) },
  'Work Sans': { weights: weights(100, 900), italic: true },
};

export const typographyLimits = {
  lineHeight: { min: .85, max: 2.5 },
  letterSpacing: { min: -.1, max: .25 },
};

export function resolveTypography(role, choices = {}, typography = {}) {
  const defaults = fontRoles[role];
  const family = Object.hasOwn(googleFonts, choices[role]) ? choices[role] : defaults.defaultFamily;
  const settings = typography[role] ?? {};
  const available = googleFonts[family].weights;
  const weight = available.includes(settings.weight) ? settings.weight : 400;
  return {
    family, weight,
    lineHeight: settings.lineHeight ?? defaults.lineHeight,
    letterSpacing: settings.letterSpacing ?? defaults.letterSpacing,
  };
}

export function validTypography(choices, typography) {
  return Object.entries(typography).every(([role, settings]) => {
    if (!Object.hasOwn(fontRoles, role) || !settings || typeof settings !== 'object' || Array.isArray(settings)) return false;
    const { family } = resolveTypography(role, choices);
    return Object.entries(settings).every(([key, value]) => {
      if (key === 'weight') return googleFonts[family].weights.includes(value);
      const limits = typographyLimits[key];
      return Object.hasOwn(typographyLimits, key) && Number.isFinite(value) && value >= limits.min && value <= limits.max;
    });
  });
}

export function fontSettings(choices = {}, typography = {}) {
  const roles = Object.fromEntries(Object.keys(fontRoles).map(role => [role, resolveTypography(role, choices, typography)]));
  const params = new URLSearchParams();
  for (const family of [...new Set(Object.values(roles).map(role => role.family))].sort()) {
    const font = googleFonts[family];
    if (font.weights.length === 1) {
      params.append('family', family);
      continue;
    }
    const used = Object.values(roles).filter(role => role.family === family).map(role => role.weight);
    // Keep a normal and bold face for inline emphasis and inherited text.
    const selected = [...new Set([400, 700, ...used].filter(weight => font.weights.includes(weight)))].sort((a, b) => a - b);
    const styles = font.italic
      ? 'ital,wght@' + selected.flatMap(weight => ['0,' + weight]).concat('1,400').join(';')
      : 'wght@' + selected.join(';');
    params.append('family', family + ':' + styles);
  }
  params.set('display', 'swap');
  return {
    href: 'https://fonts.googleapis.com/css2?' + params,
    css: ':root{' + Object.entries(roles).map(([role, settings]) =>
      '--festival-font-' + role + ':"' + settings.family + '";' +
      '--festival-weight-' + role + ':' + settings.weight + ';' +
      '--festival-line-height-' + role + ':' + settings.lineHeight + ';' +
      '--festival-letter-spacing-' + role + ':' + settings.letterSpacing + 'em;'
    ).join('') + '}',
  };
}

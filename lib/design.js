export const sectionColors = {
  '#ff533d': 'Coral',
  '#f43372': 'Pink',
  '#fff642': 'Yellow',
  '#47c2c3': 'Turquoise',
};

export const fontRoles = {
  h1: { label: 'H1 · Main headings', defaultFamily: 'Fjalla One' },
  h2: { label: 'H2 · Subheadings', defaultFamily: 'Fjalla One' },
  buttons: { label: 'Buttons and menu links', defaultFamily: 'Fjalla One' },
  body: { label: 'Body text', defaultFamily: 'Noto Sans' },
};

// Families with Latin Extended coverage and the styles used by the site.
export const googleFonts = {
  'Anton': '',
  'Archivo Black': '',
  'Bebas Neue': '',
  'Archivo': 'ital,wght@0,400;0,600;0,700;1,400',
  'Barlow Condensed': 'ital,wght@0,400;0,600;0,700;1,400',
  'Bricolage Grotesque': 'wght@400;600;700',
  'DM Sans': 'ital,wght@0,400;0,600;0,700;1,400',
  'Fjalla One': '',
  'Inter': 'ital,wght@0,400;0,600;0,700;1,400',
  'Lexend': 'wght@400;600;700',
  'Manrope': 'wght@400;600;700',
  'Montserrat': 'ital,wght@0,400;0,600;0,700;1,400',
  'Noto Sans': 'ital,wght@0,400;0,600;0,700;1,400',
  'Oswald': 'wght@400;600;700',
  'Outfit': 'wght@400;600;700',
  'Playfair Display': 'ital,wght@0,400;0,600;0,700;1,400',
  'Roboto': 'ital,wght@0,400;0,600;0,700;1,400',
  'Rubik': 'ital,wght@0,400;0,600;0,700;1,400',
  'Source Sans 3': 'ital,wght@0,400;0,600;0,700;1,400',
  'Space Grotesk': 'wght@400;600;700',
  'Work Sans': 'ital,wght@0,400;0,600;0,700;1,400',
};

export function fontSettings(choices = {}) {
  const families = Object.fromEntries(Object.entries(fontRoles).map(([role, { defaultFamily }]) => {
    const chosen = choices[role];
    return [role, Object.hasOwn(googleFonts, chosen) ? chosen : defaultFamily];
  }));
  const params = new URLSearchParams();
  for (const family of [...new Set(Object.values(families))].sort()) {
    const styles = googleFonts[family];
    params.append('family', family + (styles ? ':' + styles : ''));
  }
  params.set('display', 'swap');
  return {
    href: 'https://fonts.googleapis.com/css2?' + params,
    css: ':root{' + Object.entries(families).map(([role, family]) =>
      '--festival-font-' + role + ':"' + family + '";'
    ).join('') + '}',
  };
}

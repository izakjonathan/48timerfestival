export const colorRoles = {
  'body-text': { group: 'Sitewide', name: 'Body text', selector: '#main-content .et_pb_text_inner :is(p,li,blockquote)' },
  'home-program-heading': { group: 'Homepage', name: 'Program section heading', selector: '#main-content .festival-program-column h1' },
  'home-program-card': { group: 'Homepage', name: 'Program card title', selector: '#main-content .festival-home-cards .et_pb_heading_2 h1' },
  'menu-links': { group: 'Menu', name: 'Link text', selector: '.section-transform .festival-menu-link' },
  'menu-icon-closed': { group: 'Menu', name: 'Burger icon over the page', defaultLabel: 'Automatic contrast' },
  'menu-icon-open': { group: 'Menu', name: 'Close icon in the open menu' },
  'footer-text': { group: 'Footer', name: 'Text and headings', selector: '.et-l--footer :is(.et_pb_text_inner,.et_pb_heading_container,p,h1,h2,h3,h4,h5,h6,li)' },
  'footer-links': { group: 'Footer', name: 'Links', selector: '.et-l--footer a:not(.festival-social-icon)' },
  'footer-icons': { group: 'Footer', name: 'Social icons', selector: '.et-l--footer .festival-social-icon' },
};

const colorNames = {
  '#ff533d': 'Coral', '#f43372': 'Pink', '#fff642': 'Yellow',
  '#222453': 'Navy', '#47c2c3': 'Turquoise', '#ffffff': 'White',
};

export function swatchName(hex) {
  return colorNames[hex.toLowerCase()] ?? 'Custom';
}

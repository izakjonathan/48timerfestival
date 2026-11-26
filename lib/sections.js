import { load } from 'cheerio';
import { sectionColors } from './design.js';
import pages from './pages.js';

const homeNames = ['Poster frame', 'Date strip', 'Program', 'Homepage cards and about', 'Sponsors', 'Countdown'];
const sharedSections = {
  et_pb_section_0_tb_header: ['menu', 'Open menu'],
  et_pb_section_0_tb_footer: ['footer', 'Footer'],
  et_pb_section_1_tb_footer: ['footer', 'Footer'],
  et_pb_section_2_tb_footer: ['copyright', 'Copyright strip'],
};

function pageSections($, route) {
  const canonical = route.startsWith('/en/') ? route.slice(3) : route;
  return $('.et_pb_section').toArray().flatMap((node) => {
    const section = $(node);
    const builderId = section.attr('class')?.match(/\bet_pb_section_(\d+)(?:_tb_(?:header|footer))?\b/);
    if (!builderId) return [];
    const [className, index] = builderId;
    if (Object.hasOwn(sharedSections, className)) {
      const [id, name] = sharedSections[className];
      return [{ node, id, name, shared: true }];
    }
    // The second header section only holds a scroll-triggered Divi helper.
    if (!section.closest('#main-content').length) return [];
    if (section.find('.hurrytimer-cdt').length) {
      return [{ node, id: 'countdown', name: 'Countdown (Vi ses om)', shared: true }];
    }
    const heading = section.find('h1,h2,h3').first().text().trim().replace(/\s+/g, ' ');
    const name = (canonical === '/' && homeNames[index]) || heading.slice(0, 70) ||
      (section.find('.leaflet-map').length ? 'Map' : index === '0' ? 'Page banner' : 'Content');
    return [{ node, id: canonical + className, name }];
  });
}

let catalog;
export function getSectionsByPage() {
  return catalog ??= Object.fromEntries(Object.entries(pages).map(([route, page]) => {
    const unique = new Map(pageSections(load(page.html), route).map(({ node, ...section }) => [section.id, section]));
    return [route, [...unique.values()]];
  }));
}

export function validSectionColors(edits) {
  const sectionIds = new Set(Object.values(getSectionsByPage()).flatMap((sections) => sections.map(({ id }) => id)));
  return Object.entries(edits).every(([id, color]) => sectionIds.has(id) && Object.hasOwn(sectionColors, color));
}

export function applySectionColors($, route, edits = {}) {
  for (const { node, id } of pageSections($, route)) {
    const color = edits[id];
    if (!Object.hasOwn(sectionColors, color)) continue;
    const section = $(node);
    if (id === 'menu') {
      section.css('--festival-open-menu-background', color);
    } else {
      section.attr('style', (section.attr('style') ?? '') + ';background-color:' + color + ' !important;');
    }
  }
}

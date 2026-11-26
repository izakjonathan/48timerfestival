import { sectionColors } from './design.js';
import pages from './pages.js';
export const getSectionsByPage = () => Object.fromEntries(Object.entries(pages).map(([route,page])=>[route,page.sections]));
const sectionIds = new Set(Object.values(pages).flatMap(page=>page.sections.map(section=>section.id)));
export function validSectionColors(edits) {
  return Object.entries(edits).every(([id,color])=>sectionIds.has(id)&&Object.hasOwn(sectionColors,color));
}

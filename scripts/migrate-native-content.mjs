import { readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { load } from 'cheerio';
import parseCSS from 'postcss-safe-parser';
import { imagesFor } from '../lib/appearance.js';

const read = name => JSON.parse(gunzipSync(readFileSync(new URL('../content/' + name + '.json.gz', import.meta.url))));
const snapshots = { ...read('pages'), ...read('pages-da') };
const newPages = {};
const allowed = new Set(['p','h1','h2','h3','h4','h5','h6','ul','ol','li','a','strong','b','em','i','span','br','blockquote','hr','table','thead','tbody','tr','td','th','sup','sub','small']);
const localLink = value => {
  if (!value) return '';
  let href = value.replace(/^https?:\/\/(?:www\.)?48timerfestival\.dk(?=\/)/i, '');
  if (href.startsWith('/wp-content/uploads/')) href = '/festival-assets' + href;
  href = href.replace(/\/kontakt-og-info\/?$/, '/kontakt-og-information/');
  if (/^(?:https?:\/\/|mailto:|tel:|#|\/(?![\/\\]))/i.test(href)) return href;
  return '';
};
function rich(nodes) {
  return nodes.flatMap(node => {
    if (node.type === 'text') return node.data ? [node.data] : [];
    if (node.type !== 'tag' || ['script','style','iframe','object'].includes(node.name)) return [];
    const children = rich(node.children ?? []);
    if (!allowed.has(node.name)) return children;
    const result = { tag:node.name, children };
    if (node.attribs['data-edit-key']) result.key = node.attribs['data-edit-key'];
    if (node.name === 'a') {
      result.href = localLink(node.attribs.href);
      if (node.attribs.target === '_blank') result.external = true;
    }
    return [result];
  });
}
const urlFrom = value => value?.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/)?.[1];
const classes = node => (node.attr('class') ?? '').split(/\s+/);
function mapData($) {
  const markers = [], lines = [];
  $('#main-content script').each((_,node) => {
    const source = $(node).text();
    const position = source.match(/new L\.SVGMarker\(\s*(\[[^\]]+\])/);
    const popup = source.match(/\.unescape\('([\s\S]*?)'\)/);
    if (position && popup) {
      const parsed = position[1].slice(1,-1).split(',').map(value=>value.trim());
      const coords = parsed.length === 2 && parsed.every(value=>value && Number.isFinite(Number(value))) ? parsed.map(Number) : null;
      const decoded = load('<textarea>'+popup[1]+'</textarea>')('textarea').text();
      const content = load(decoded);
      const href = localLink(content('a').first().attr('href'));
      content('a').remove();
      content('br').replaceWith('\n');
      const text = content('body').text().trim().split(/\n/).map(s=>s.trim()).filter(Boolean);
      if (text.length) markers.push({ coords, title:text[0], details:text.slice(1), href });
    }
    const line = source.match(/L\.polyline\((\[\[[\s\S]*?\]\]),/);
    if (line) lines.push(JSON.parse(line[1]));
  });
  return { markers, lines };
}

for (const [route,page] of Object.entries(snapshots)) {
  const $ = load(page.html);
  const canonical = route.startsWith('/en/') ? route.slice(3) : route;
  const sections = [
    { id:'menu', name:'Open menu', shared:true },
    { id:'footer', name:'Footer', shared:true },
    { id:'copyright', name:'Copyright strip', shared:true },
  ];
  const content = [];
  const rules = parseCSS($('style').map((_,node)=>$(node).text()).get().join('\n'));
  const sectionCSS = {};
  rules.walkRules(rule => {
    for (const selector of rule.selector.split(',')) {
      const match = selector.trim().match(/^(?:div)?(?:\.et_pb_section)?\.(et_pb_section_\d+)(?:\.et_pb_section)?$/);
      if (!match) continue;
      const id = match[1].replace(/^\./,'');
      sectionCSS[id] ??= {};
      rule.walkDecls(/^background(?:-color|-image)?$/, decl => {
        if (decl.prop === 'background-color') sectionCSS[id].color = decl.value;
        const image = urlFrom(decl.value);
        if (image) sectionCSS[id].image = localLink(image);
      });
    }
  });
  const linkData = $('script').map((_,node)=>$(node).text()).get().find(text=>text.includes('var et_link_options_data'));
  let moduleLinks = {};
  try { moduleLinks = Object.fromEntries(JSON.parse(linkData.match(/var et_link_options_data\s*=\s*(\[[^;]*?\]);/s)[1]).map(item=>[item.class, localLink(item.url)])); } catch {}
  const homeNames = ['Poster frame','Date strip','Program','Homepage cards and about','Sponsors','Countdown'];
  $('#main-content .et_pb_section').each((_,node) => {
    const section = $(node);
    const className = classes(section).find(name=>/^et_pb_section_\d+$/.test(name));
    if (!className) return;
    const index = Number(className.split('_').at(-1));
    const countdown = section.find('.hurrytimer-cdt').length || /HurryTimer: Invalid campaign ID/.test(section.text()) ||
      (/^(vi ses om|see you in)$/i.test(section.find('h1,h2,h3,h4').first().text().trim()) && section.find('.et_pb_code').length);
    const id = section.find('.hurrytimer-cdt').length ? 'countdown' : canonical + className;
    const heading = section.find('h1,h2,h3').first().text().trim().replace(/\s+/g,' ');
    const name = countdown ? 'Countdown (Vi ses om)' : (canonical==='/' && homeNames[index]) || heading.slice(0,70) || (canonical==='/kort/' ? 'Map' : index===0 ? 'Page banner' : 'Content');
    sections.push({id,name,...(id === 'countdown' ? {shared:true} : {})});
    if (['/','/program/'].includes(canonical)) return;
    if (countdown) { content.push({type:'countdown',id}); return; }
    const config = sectionCSS[className] ?? {};
    const image = localLink(urlFrom(section.find('.et_parallax_bg').last().attr('style')) || config.image);
    const originalColor = config.color?.toLowerCase();
    const color = ({'#2b141e':'var(--fn-coral)','#eabc48':'var(--festival-eabc48, #47c2c3)','#b39a9b':'var(--fn-teal)','#f9f5c7':'var(--fn-yellow)'})[originalColor] ?? 'var(--fn-coral)';
    const rows = [];
    section.children('.et_pb_row').each((_,row) => {
      const columns = [];
      $(row).children('.et_pb_column').each((_,column)=>{
        const modules = [];
        $(column).children('.et_pb_module').each((_,node)=>{
          const module = $(node);
          const cls = classes(module);
          const href = cls.map(name=>moduleLinks[name]).find(Boolean);
          if (cls.includes('et_pb_text')) {
            const container = module.find('.et_pb_text_inner').first();
            const children = rich(container.contents().toArray());
            const plain = container.text().trim();
            if (plain) modules.push({type:cls.includes('et_pb_text_0') && cls.includes('breadcrumb')?'breadcrumb':'text',children,...(href?{href}:{})});
          } else if (cls.includes('et_pb_gallery')) {
            const images = module.find('.et_pb_gallery_image img').map((_,img)=>{
              const item=$(img), link=item.closest('a');
              return {src:localLink(item.attr('src')),full:localLink(link.attr('href')||item.attr('src')),alt:item.attr('alt')||link.attr('title')||'',key:item.attr('data-edit-key')};
            }).get();
            modules.push({type:'gallery',images});
          } else if (cls.includes('et_pb_image')) {
            const item=module.find('img').first();
            if(item.attr('src')) modules.push({type:'image',src:localLink(item.attr('src')),alt:item.attr('alt')||'',key:item.attr('data-edit-key'),href:localLink(item.closest('a').attr('href'))});
          } else if (cls.includes('et_pb_button_module_wrapper')) {
            const item=module.find('a.et_pb_button').first();
            if (item.length) modules.push({type:'button',title:item.text().trim(),href:localLink(item.attr('href')),key:item.attr('data-edit-key')});
          } else if (cls.includes('et_pb_blurb') && href) {
            modules.push({type:'location',href});
          } else if (module.find('form.et_pb_contact_form').length) {
            modules.push({type:'volunteer'});
          } else if (cls.includes('et_pb_code')) {
            if (module.find('iframe[src*="docs.google.com/forms"]').length) modules.push({type:'registration'});
            else if (canonical==='/kort/') modules.push({type:'map',...mapData($)});
          }
        });
        if (modules.length) columns.push(modules);
      });
      if (columns.length) rows.push(columns);
    });
    content.push({type:rows.length?'content':'banner',id,color,...(image?{image}:{}),rows});
  });
  if (canonical === '/bliv-frivillig/') sections.push({id:'/bliv-frivillig/content',name:'Volunteer teams'});
  if (canonical === '/bliv-partner/') sections.push({id:'/bliv-partner/content',name:'Partner page'});
  const uniqueSections = [...new Map(sections.map(s=>[s.id,s])).values()];
  newPages[route] = { title:$('title').text().trim(), fields:page.fields, images:imagesFor(page.html), sections:uniqueSections, content };
}
writeFileSync(new URL('../content/native-pages.json',import.meta.url), JSON.stringify(newPages)+'\n');
console.log('Migrated', Object.keys(newPages).length,'routes');
for (const [route,page] of Object.entries(newPages)) console.log(route,page.content.map(s=>s.type+':'+s.rows?.flat(2).map(m=>m.type).join(',')).join(' | '));

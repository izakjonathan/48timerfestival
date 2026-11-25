import { randomUUID } from 'node:crypto';
import { load } from 'cheerio';
import { renderPage, palette } from './site-render.js';
import { colorRoles } from './color-roles.js';

const foreground = 'h1,h2,h3,h4,h5,h6,p,a,button,label,li,blockquote,figcaption,span,strong,em,b,i,dt,dd,small,.et_pb_text_inner,#menu-open';

export function renderCanvas(path, draft, origin, instance) {
  const { colors, colorRoles: roles, elementColors, ...content } = draft;
  const $ = load(renderPage(path, content, { preview: true }));
  $('script,iframe,object,embed,meta[http-equiv="refresh"]').remove();
  $('*').each((_, node) => {
    for (const name of Object.keys(node.attribs ?? {})) {
      if (/^on/i.test(name)) $(node).removeAttr(name);
    }
  });
  $('a').removeAttr('href target ping download');
  $('form').removeAttr('action target');
  $('input,select,textarea').attr('tabindex', '-1').attr('inert', '');

  $('[data-festival-element]').filter(foreground).each((_, node) => {
    const item = $(node);
    if (item.is('#menu-open') || item.attr('aria-label') || item.text().trim()) {
      if (!item.closest('[aria-hidden="true"],.trp-floater-ls').length) item.attr('data-canvas-pick', '');
    }
  });
  for (const [role, { group, selector }] of Object.entries(colorRoles)) {
    if (!selector || (group === 'Homepage' && path !== '/' && path !== '/en/')) continue;
    $(selector).each((_, node) => {
      const item = $(node);
      item.attr('data-canvas-roles', ((item.attr('data-canvas-roles') ?? '') + ' ' + role).trim());
      item.attr('data-canvas-pick', '');
    });
  }
  $('[data-canvas-pick]').attr('tabindex', '0');
  const nonce = randomUUID().replaceAll('-', '');
  $('head').prepend($('<meta http-equiv="Content-Security-Policy">').attr(
    'content', "script-src 'nonce-" + nonce + "'; object-src 'none'; form-action 'none'; frame-src 'none'",
  ));
  $('head').append('<style>[data-canvas-pick]{cursor:crosshair}[data-canvas-selected]{outline:2px solid #5265ff!important;outline-offset:2px} html,body{overscroll-behavior-y:contain}</style>');
  $('body').append($('<script src="/festival-canvas.js"></script>').attr({
    nonce, 'data-parent-origin': origin, 'data-instance': instance, 'data-palette': Object.keys(palette).join(' '),
    'data-roles': Object.keys(colorRoles).join(' '),
  }));
  return $.html();
}

const icons = {
  Facebook: '<path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.2-2.4-.2-2.4 0-4.1 1.5-4.1 4.2V10H8v3h2.8v8H14Z"/>',
  Instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.2"/>',
  YouTube: '<path fill-rule="evenodd" d="M21.6 6.4C22 8 22 12 22 12s0 4-.4 5.6c-.2.9-.9 1.6-1.8 1.8-1.6.4-7.8.4-7.8.4s-6.2 0-7.8-.4c-.9-.2-1.6-.9-1.8-1.8C2 16 2 12 2 12s0-4 .4-5.6c.2-.9.9-1.6 1.8-1.8 1.6-.4 7.8-.4 7.8-.4s6.2 0 7.8.4c.9.2 1.6.9 1.8 1.8ZM10 8.5v7l6-3.5-6-3.5Z"/>',
};

export function renderSocialIcons($) {
  for (const [name, drawing] of Object.entries(icons)) {
    $('li.et-social-' + name.toLowerCase() + ' > a.icon').each((_, node) => {
      $(node).addClass('festival-social-icon').attr('aria-label', name)
        .prepend('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' + drawing + '</svg>');
    });
  }
}

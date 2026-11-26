(() => {
  const header = document.querySelector('[data-fn-header]');
  const toggle = header?.querySelector('.fn-menu-toggle');
  const menu = header?.querySelector('.fn-mobile-nav');
  let closeTimer;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function setMenu(open, immediate = false) {
    if (!menu) return;
    clearTimeout(closeTimer);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    if (open) {
      menu.hidden = false; menu.inert = false;
      delete menu.dataset.closing; menu.dataset.open = '';
      document.body.style.overflow = 'hidden';
      menu.querySelector('a')?.focus({ preventScroll: true });
      return;
    }
    menu.inert = true; delete menu.dataset.open;
    const finish = () => { menu.hidden = true; delete menu.dataset.closing; document.body.style.overflow = ''; };
    if (immediate || reduced.matches || menu.hidden) finish();
    else { menu.dataset.closing = ''; closeTimer = setTimeout(finish,230); }
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (toggle?.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { setMenu(false); toggle.focus(); }
    if (event.key === 'Tab') {
      const targets = [toggle, ...header.querySelectorAll('.fn-languages a,.fn-logo'), ...menu.querySelectorAll('a')];
      if (event.shiftKey && document.activeElement === targets[0]) { event.preventDefault(); targets.at(-1).focus(); }
      if (!event.shiftKey && document.activeElement === targets.at(-1)) { event.preventDefault(); targets[0].focus(); }
    }
  });
  matchMedia('(min-width: 1051px)').addEventListener('change', event => { if (event.matches) setMenu(false,true); });
  addEventListener('pageshow', event => { if (event.persisted) setMenu(false,true); });

  function fallback(image) {
    if (!(image instanceof HTMLImageElement) || !image.dataset.original || image.dataset.failed) return;
    image.dataset.failed = 'true';
    image.closest('picture')?.querySelectorAll('source').forEach(source => source.remove());
    image.removeAttribute('srcset');
    image.src = matchMedia('(max-width:700px)').matches && image.dataset.mobileOriginal ? image.dataset.mobileOriginal : image.dataset.original;
  }
  document.addEventListener('error', event => fallback(event.target), true);
  document.querySelectorAll('img[data-original]').forEach(image => { if (image.complete && !image.naturalWidth) fallback(image); });

  const clock = document.querySelector('[data-fn-countdown]');
  if (clock) {
    const target = Date.parse(clock.dataset.date);
    const draw = () => {
      const seconds = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const values = { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
      for (const [key,value] of Object.entries(values)) clock.querySelector('[data-unit="'+key+'"]').textContent = String(value).padStart(2,'0');
    };
    draw(); setInterval(draw, 1000);
  }
  const form = document.querySelector('[data-fn-filters]');
  if (form) {
    const items = [...document.querySelectorAll('[data-fn-event]')];
    const status = document.querySelector('[data-fn-results]');
    const empty = document.querySelector('[data-fn-no-results]');
    const filter = () => {
      const values = Object.fromEntries(new FormData(form));
      const search = values.search.trim().toLocaleLowerCase();
      let count = 0;
      for (const item of items) {
        const matches = (!search || item.textContent.toLocaleLowerCase().includes(search)) &&
          (!values.day || item.dataset.day === values.day) && (!values.category || item.dataset.category === values.category) && (!values.venue || item.dataset.venue === values.venue);
        item.hidden = !matches; if (matches) count++;
      }
      status.textContent = count + ' ' + status.dataset.label; empty.hidden = count !== 0;
    };
    form.addEventListener('input', filter);
    form.addEventListener('change', filter);
    form.addEventListener('reset', () => requestAnimationFrame(filter));
    form.addEventListener('submit', event => { event.preventDefault(); filter(); });
  }
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('fn-reveal'); observer.unobserve(entry.target); }
    }), { threshold: .12 });
    document.documentElement.classList.add('fn-reveal-ready');
    document.querySelectorAll('[data-fn-reveal]').forEach(element => observer.observe(element));
  }
})();

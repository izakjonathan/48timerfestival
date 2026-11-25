(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('menu-open');
  const menu = toggle?.closest('.section-transform');
  const menuActive = 'section-transform-active';

  if (menu) {
    const links = [...menu.querySelectorAll('.menu-item-click')];
    links.forEach((link, index) => link.style.setProperty('--festival-item', index));
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');
    toggle.setAttribute('aria-label', document.documentElement.lang.startsWith('da') ? 'Menu' : 'Navigation menu');
    toggle.setAttribute('aria-expanded', String(menu.classList.contains(menuActive)));
    let closeTimer;

    function setOpen(open) {
      clearTimeout(closeTimer);
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        menu.classList.add(menuActive);
        menu.dataset.festivalMenu = 'open';
        return;
      }
      const finish = () => {
        menu.classList.remove(menuActive);
        delete menu.dataset.festivalMenu;
      };
      if (reduced.matches) {
        finish();
      } else {
        menu.dataset.festivalMenu = 'closing';
        closeTimer = setTimeout(finish, 330);
      }
    }

    toggle.addEventListener('click', (event) => {
      event.stopImmediatePropagation();
      setOpen(!menu.classList.contains(menuActive) || menu.dataset.festivalMenu === 'closing');
    }, true);
    toggle.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      toggle.click();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !menu.classList.contains(menuActive)) return;
      setOpen(false);
      toggle.focus();
    });
  }

  if (reduced.matches || !('IntersectionObserver' in window)) return;
  const selector = [
    '.et_pb_text', '.et_pb_heading', '.et_pb_button_module_wrapper',
    '.et_pb_image', '.et_pb_gallery', '.et_pb_countdown_timer',
    '.et_pb_contact_form_container', '.et_pb_social_media_follow',
    '.et_pb_blurb', '.et_pb_accordion', '.et_pb_video',
  ].join(',');
  const selectorRoots = ['#main-content', '.et-l--footer'];
  const modules = selectorRoots.flatMap((root) => [...document.querySelector(root)?.querySelectorAll(selector) ?? []]);
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting)
      .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)
      .forEach(({ target }, index) => reveal(target, Math.min(index * 60, 240)));
  }, { rootMargin: '0px 0px -5% 0px' });

  function reveal(element, delay = 0) {
    observer.unobserve(element);
    element.style.setProperty('--festival-reveal-delay', delay + 'ms');
    element.classList.replace('festival-reveal-pending', 'festival-reveal-visible');
  }

  for (const element of modules) {
    if (element.closest('header, .festival-poster, .et_animated') || element.parentElement.closest(selector)) continue;
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.top < innerHeight) continue;
    element.classList.add('festival-reveal-pending');
    if (element.querySelector('h1,h2,h3,h4')) element.classList.add('festival-reveal-heading');
    element.addEventListener('focusin', () => reveal(element), { once: true });
    observer.observe(element);
  }

  reduced.addEventListener('change', (event) => {
    if (!event.matches) return;
    observer.disconnect();
    for (const element of modules) element.classList.remove('festival-reveal-pending', 'festival-reveal-visible');
  });
})();

(() => {
  const ticker = document.querySelector('.festival-date-ticker');
  if (!ticker || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    ticker.toggleAttribute('data-offscreen', !entry.isIntersecting);
  });
  observer.observe(ticker);
})();

(() => {
  const config = document.currentScript.dataset;
  const palette = new Set(config.palette.split(' '));
  const roles = config.roles.split(' ');
  const baseline = new Map();
  let selection;
  let down;
  let menuOpen = false;

  function send(data) {
    parent.postMessage({ ...data, instance: config.instance, channel: 'festival-canvas' }, config.parentOrigin);
  }

  function apply(node, property, value, priority = '') {
    if (!baseline.has(node)) baseline.set(node, node.style.cssText);
    node.style.setProperty(property, value, priority);
  }

  function swatchValue(key) {
    return 'var(--festival-' + key + ', #' + key + ')';
  }

  function ink(element, color) {
    apply(element, 'color', color, 'important');
    apply(element, '-webkit-text-fill-color', 'currentColor', 'important');
  }

  function showColors(data) {
    for (const [element, original] of baseline) element.style.cssText = original;
    baseline.clear();
    for (const key of palette) {
      const value = data.colors?.[key];
      if (!/^#[0-9a-f]{6}$/i.test(value)) continue;
      apply(document.documentElement, '--festival-' + key, value);
      apply(document.documentElement, '--festival-rgb-' + key,
        [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)).join(' '));
    }
    function applyRole(role) {
      const key = data.roles?.[role];
      if (!palette.has(key)) return;
      for (const element of document.querySelectorAll('[data-canvas-roles~="' + role + '"]')) {
        ink(element, swatchValue(key));
        element.querySelectorAll('span,strong,em,b,i,small').forEach((child) => ink(child, swatchValue(key)));
      }
    }
    applyRole('body-text');
    for (const [id, properties] of Object.entries(data.elements ?? {})) {
      if (!/^element-\d{1,5}$/.test(id)) continue;
      const element = document.querySelector('[data-festival-element="' + id + '"]');
      if (!element) continue;
      if (palette.has(properties.color)) {
        ink(element, swatchValue(properties.color));
        if (!element.matches('section,.et_pb_section')) {
          element.querySelectorAll('span,strong,em,b,i,a').forEach((child) => ink(child, swatchValue(properties.color)));
        }
      }
      if (palette.has(properties['background-color'])) {
        apply(element, 'background-color', swatchValue(properties['background-color']), 'important');
      }
    }
    for (const role of roles) {
      if (role !== 'body-text') applyRole(role);
    }
    const toggle = document.getElementById('menu-open');
    const icon = toggle?.querySelector('.festival-menu-icon');
    if (icon) {
      const role = menuOpen ? 'menu-icon-open' : 'menu-icon-closed';
      if (palette.has(data.roles?.[role])) ink(icon, swatchValue(data.roles[role]));
    }
  }

  function select(target) {
    let element = target?.closest('[data-canvas-pick]');
    if (!element) return;
    const named = target.closest('[data-canvas-roles]');
    if (named && named.dataset.canvasRoles !== 'body-text') element = named;
    selection?.removeAttribute('data-canvas-selected');
    selection = element;
    selection.setAttribute('data-canvas-selected', '');
    const menuButton = element.id === 'menu-open';
    send({
      type: 'selected',
      id: element.dataset.festivalElement ?? '',
      roles: menuButton ? [menuOpen ? 'menu-icon-open' : 'menu-icon-closed']
        : (element.dataset.canvasRoles ?? '').split(' ').filter(Boolean),
      name: menuButton ? (menuOpen ? 'Close menu icon' : 'Menu icon')
        : (element.getAttribute('aria-label') || element.textContent).trim().replace(/\s+/g, ' ').slice(0, 80),
    });
  }

  document.addEventListener('pointerdown', (event) => {
    if (event.isPrimary && event.button === 0) down = { x: event.clientX, y: event.clientY };
  }, true);
  document.addEventListener('pointercancel', () => { down = undefined; }, true);
  document.addEventListener('pointerup', (event) => {
    if (!event.isPrimary) return;
    const tap = down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 9;
    down = undefined;
    if (tap) select(document.elementFromPoint(event.clientX, event.clientY) ?? event.target);
  }, true);
  document.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.detail === 0) select(event.target);
  }, true);
  document.addEventListener('keydown', (event) => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-canvas-pick]')) {
      event.preventDefault();
      select(event.target);
    }
  }, true);
  document.addEventListener('submit', (event) => event.preventDefault(), true);

  addEventListener('message', (event) => {
    const data = event.data;
    if (event.source !== parent || event.origin !== config.parentOrigin || data?.instance !== config.instance ||
        data.channel !== 'festival-canvas') return;
    if (data.type === 'ping') { send({ type: 'ready' }); return; }
    if (data.type !== 'colors') return;
    if (menuOpen !== data.menuOpen) {
      menuOpen = data.menuOpen;
      const button = document.getElementById('menu-open');
      button?.closest('.section-transform')?.classList.toggle('section-transform-active', menuOpen);
      button?.setAttribute('aria-expanded', String(menuOpen));
      selection?.removeAttribute('data-canvas-selected');
      selection = undefined;
    }
    showColors(data);
  });
  send({ type: 'ready' });
})();

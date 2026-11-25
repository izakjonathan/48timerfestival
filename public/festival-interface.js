(() => {
  const toggle = document.getElementById('menu-open');
  const header = toggle?.closest('header');
  if (!header) return;

  const rgb = (value) => value.match(/[\d.]+/g)?.map(Number);
  const luminance = (channels) => channels.slice(0, 3).reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);

  const probe = document.createElement('span');
  probe.hidden = true;
  toggle.append(probe);
  const contrast = (first, second) => (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);

  const candidates = [
    'var(--festival-ffffff, #fff)',
    'var(--festival-2b141e, #2b141e)',
    'var(--festival-000000, #000)',
    'var(--festival-eabc48, #eabc48)',
  ].map((value) => {
    probe.style.color = value;
    return { value, light: luminance(rgb(getComputedStyle(probe).color) ?? [0, 0, 0]) };
  });
  probe.remove();
  let frame = 0;
  let lastInk;
  function update() {
    frame = 0;
    if (toggle.closest('.section-transform-active')) return;
    const rect = toggle.querySelector('strong')?.getBoundingClientRect() ?? toggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return;
    const layers = document.elementsFromPoint(x, y).filter((element) => !header.contains(element));
    const seen = new Set();
    let surface;
    let hasImage = false;
    for (const layer of layers) {
      for (let node = layer; node && !seen.has(node); node = node.parentElement) {
        seen.add(node);
        const style = getComputedStyle(node);
        const color = rgb(style.backgroundColor);
        if (node instanceof HTMLImageElement || style.backgroundImage !== 'none') hasImage = true;
        if (color?.length === 3 || color?.[3] >= 0.95) {
          surface = color;
          break;
        }
      }
      if (surface || hasImage) break;
    }

    let ink = 'var(--festival-ffffff, #fff)';
    if (surface && !hasImage) {
      const background = luminance(surface);
      ink = candidates.reduce((best, option) =>
        contrast(option.light, background) > contrast(best.light, background) ? option : best
      ).value;
    }
    if (ink !== lastInk) {
      toggle.style.setProperty('--festival-menu-ink', ink);
      lastInk = ink;
    }
    if (!toggle.dataset.festivalContrast) toggle.dataset.festivalContrast = 'on';
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('load', schedule);
  new MutationObserver(schedule).observe(toggle.closest('.section-transform'), { attributes: true, attributeFilter: ['class'] });
  schedule();
})();

(() => {
  const prefetched = new Set();
  let timer;
  const nav = document.querySelector('header .section-transform');
  if (!nav || navigator.connection?.saveData) return;
  function prefetch(event) {
    const link = event.target.closest('a.festival-menu-link');
    if (!link || prefetched.has(link.href)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const hint = document.createElement('link');
      hint.rel = 'prefetch';
      hint.href = link.href;
      document.head.append(hint);
      prefetched.add(link.href);
    }, 100);
  }
  nav.addEventListener('pointerover', prefetch);
  nav.addEventListener('focusin', prefetch);
})();

(() => {
  function useOriginal(image) {
    if (!(image instanceof HTMLImageElement) || image.dataset.festivalImageFallback) return;
    const candidate = image.currentSrc || image.src;
    const source = new URL(candidate, location.href);
    if (source.origin !== location.origin || source.pathname !== '/_next/image') return;
    const original = source.searchParams.get('url');
    if (!original) return;
    image.dataset.festivalImageFallback = 'true';
    image.closest('picture')?.querySelectorAll('source').forEach((node) => node.removeAttribute('srcset'));
    image.removeAttribute('srcset');
    image.src = original.replace('https://www.48timerfestival.dk/wp-content/uploads/', '/festival-assets/wp-content/uploads/');
  }
  document.addEventListener('error', (event) => useOriginal(event.target), true);
  for (const image of document.images) {
    if (image.complete && !image.naturalWidth) useOriginal(image);
  }
})();

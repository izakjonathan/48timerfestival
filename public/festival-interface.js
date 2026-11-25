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

  let frame = 0;
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

    const candidates = [
      'var(--festival-ffffff, #fff)',
      'var(--festival-2b141e, #2b141e)',
      'var(--festival-000000, #000)',
      'var(--festival-eabc48, #eabc48)',
    ];
    let ink = '#fff';
    if (surface && !hasImage) {
      const background = luminance(surface);
      ink = candidates.map((candidate) => {
        probe.style.color = candidate;
        return { candidate, score: contrast(luminance(rgb(getComputedStyle(probe).color)), background) };
      }).sort((first, second) => second.score - first.score)[0].candidate;
    }
    toggle.style.setProperty('--festival-menu-ink', ink);
    toggle.dataset.festivalContrast = hasImage ? 'image' : 'solid';
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

const origin = 'https://www.48timerfestival.dk';
const widths = [384, 640, 828, 1080, 1440, 1920];

function imageOrigin(value) {
  if (!/(?:\.png|\.jpe?g|\.webp|\.avif)$/i.test(value ?? '')) return null;
  if (value.startsWith('/media/')) return value;
  if (value.startsWith('/festival-assets/wp-content/uploads/')) {
    return origin + value.slice('/festival-assets'.length);
  }
  return null;
}

function optimized(value, width, quality) {
  const src = imageOrigin(value);
  return src ? '/_next/image?url=' + encodeURIComponent(src) + '&w=' + width + '&q=' + quality : value;
}

export function posterSources(value) {
  return widths.slice(1, 4).map((width) => optimized(value, width, 85) + ' ' + width + 'w').join(', ');
}

export function optimizePublicImages($) {
  $('img[src]').each((_, node) => {
    const image = $(node);
    if (image.closest('.festival-poster-image')) return;
    const src = image.attr('src');
    if (!imageOrigin(src)) return;
    const originalCandidates = image.attr('srcset')?.split(',').map((candidate) => candidate.trim().split(/\s+/));
    const allSame = originalCandidates?.every(([url]) => url === src);
    const intrinsicWidth = Number(image.attr('width')) || 1080;
    const isLogo = image.closest('.et-l--header').length > 0;
    const width = isLogo ? 256 : (widths.find((candidate) => candidate >= Math.min(intrinsicWidth, 828)) ?? 828);
    image.attr('src', optimized(src, width, 75)).attr('decoding', 'async');
    if (isLogo) {
      image.attr('srcset', [128, 256].map((w) => optimized(src, w, 75) + ' ' + w + 'w').join(', '))
        .attr('sizes', '90px');
      return;
    }
    if (originalCandidates?.length && !allSame) {
      image.attr('srcset', originalCandidates.map(([url, descriptor]) => {
        const requested = parseInt(descriptor, 10) || width;
        const bucket = widths.find((candidate) => candidate >= requested) ?? 1920;
        return [optimized(url, bucket, 75), descriptor].filter(Boolean).join(' ');
      }).join(', '));
    } else if (intrinsicWidth >= 640) {
      const choices = widths.filter((candidate) => candidate <= Math.max(intrinsicWidth, 640));
      image.attr('srcset', choices.map((w) => optimized(src, w, 75) + ' ' + w + 'w').join(', '))
        .attr('sizes', image.attr('sizes') || '(max-width: 767px) 90vw, 60vw');
    }
    if (image.attr('fetchpriority') !== 'high' && !image.attr('loading')) image.attr('loading', 'lazy');
  });

  $('#main-content .et_parallax_bg[style]').each((_, node) => {
    const image = $(node);
    const width = image.hasClass('et_parallax_bg_phone') ? 828 : image.hasClass('et_parallax_bg_tablet') ? 1080 : 1920;
    image.attr('style', image.attr('style').replace(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g,
      (_, src) => 'url("' + optimized(src, width, 85) + '")'));
  });
}

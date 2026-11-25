const origin = 'https://www.48timerfestival.dk';

export default {
  skipTrailingSlashRedirect: true,
  images: {
    minimumCacheTTL: 86400,
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75, 85],
    remotePatterns: [new URL(origin + '/wp-content/uploads/**')],
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/festival-assets/wp-content/uploads/**' }],
  },
  async rewrites() {
    return {
      afterFiles: [{ source: '/festival-assets/:asset*', destination: origin + '/:asset*' }],
    };
  },
};

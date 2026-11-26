export default {
  skipTrailingSlashRedirect: true,
  images: {
    minimumCacheTTL: 86400,
    deviceSizes: [640, 828, 1080, 1440, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75, 85],
    localPatterns: [{ pathname: '/media/**' }, { pathname: '/festival-media/**' }],
  },
};

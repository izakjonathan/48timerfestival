const origin = 'https://www.48timerfestival.dk';

export default {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return {
      fallback: [{ source: '/festival-assets/:asset*', destination: origin + '/:asset*' }],
    };
  },
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/help',
        destination: '/contribute?tab=support',
        permanent: true,
      },
      {
        source: '/help/:path*',
        destination: '/contribute?tab=support',
        permanent: true,
      },
    ];
  },
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: true,
  },
  api: {
    responseLimit: false,
  },
  webpack: (config) => {
    // Required for puppeteer to work
    if (!config.node) {
      config.node = {};
    }
    config.node.__dirname = true;

    return config;
  },
};

module.exports = nextConfig;

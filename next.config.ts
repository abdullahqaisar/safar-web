import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  images: {
    domains: [],
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;

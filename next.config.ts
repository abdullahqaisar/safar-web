import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    domains: [], // Add allowed image domains
  },
  // Enable source maps in production
  productionBrowserSourceMaps: true,
};

export default nextConfig;

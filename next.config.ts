import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */

  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    useCache: true,
  },
  images: {
    localPatterns: [
      {
        pathname: '/**',
      },
      {
        pathname: '/api/images/:path*',
        search: '{size}',
      },
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'onsmierloostheater.nl',
      },
    ],
  },
};

export default nextConfig;

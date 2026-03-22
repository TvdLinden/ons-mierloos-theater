import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@ons-mierloos-theater/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    useCache: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    localPatterns: [
      {
        pathname: '/**',
      },
      {
        pathname: '/api/images/:path*',
      },
    ],
  },
};

export default nextConfig;

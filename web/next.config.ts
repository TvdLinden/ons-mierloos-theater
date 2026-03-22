import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Required for standalone to correctly trace shared workspace files
  outputFileTracingRoot: path.join(__dirname, '../'),
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

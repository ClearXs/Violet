import type { NextConfig } from 'next';
import { i18n } from './next-i18next.config';

const nextConfig: NextConfig = {
  /* config options here */
  i18n,
  output: 'standalone',
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:47283/:path*', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

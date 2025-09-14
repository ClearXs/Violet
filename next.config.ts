import type { NextConfig } from 'next';
import { i18n } from './next-i18next.config';

const nextConfig: NextConfig = {
  /* config options here */
  i18n,
  reactStrictMode: false,
  output: 'standalone',
  experimental: {
    turbo: {
      rules: {
        '*.vert': {
          loaders: ['raw-loader'],
          as: '*.js',
        },
        '*.frag': {
          loaders: ['raw-loader'],
          as: '*.js',
        },
        '*.glsl': {
          loaders: ['raw-loader'],
          as: '*.js',
        },
      },
    },
  },
  transpilePackages: ['three'],
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:10890/:path*', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;

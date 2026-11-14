import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['ffmpeg-static'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;

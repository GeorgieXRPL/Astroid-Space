import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root to this folder so Turbopack doesn't reach
  // up the tree and pick up a sibling project's lockfile.
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;

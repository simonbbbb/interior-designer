import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (no server-side API routes)
  output: 'export',
  // Base path matches the repo name: repo-interior-designer
  basePath: process.env.NODE_ENV === 'production' ? '/interior-designer' : '',
  // Don't rewrite paths since we're fully static
  trailingSlash: true,
};

export default nextConfig;

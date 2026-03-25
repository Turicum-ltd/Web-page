import type { NextConfig } from 'next';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.ATLAS_BASE_PATH ?? '/atlas').trim();
const normalizedBasePath = !basePath || basePath === '/'
  ? undefined
  : (basePath.startsWith('/') ? basePath : `/${basePath}`).replace(/\/+$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: normalizedBasePath
};

export default nextConfig;

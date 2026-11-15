import createMDX from '@next/mdx';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import signale from 'signale';

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm', 'remark-slug'],
  },
});

let repository;

try {
  const packageJson = fs.readJsonSync('../package/package.json');
  repository = packageJson.repository.split('/').at(-1).replace('.git', '');
} catch {
  signale.error('Failed to read repository field of package/package.json\n');
  process.exit(1);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? `/${repository}` : undefined,
  pageExtensions: ['ts', 'tsx', 'mdx'],
  // The yarn workspace root, stated so Next.js does not guess it from lockfiles (a checkout
  // nested in another, such as a git worktree, has two)
  turbopack: { root: fileURLToPath(new URL('..', import.meta.url)) },
};

export default withMDX(nextConfig);

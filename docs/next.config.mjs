import createMDX from '@next/mdx';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import signale from 'signale';

// No remark-gfm for the mdx pages: like mantine.dev, they use no GFM syntax (no pipe tables, task
// lists, strikethrough or footnotes; tables are DataTable components). The remark-gfm dependency of
// this app stays for the markdown adapter that the demos pass to DocViewerAdapterProvider
const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-slug'],
  },
});

let repository;

try {
  const packageJson = fs.readJsonSync('../package/package.json');
  const repositoryUrl =
    typeof packageJson.repository === 'string'
      ? packageJson.repository
      : packageJson.repository.url;
  repository = repositoryUrl.split('/').at(-1).replace('.git', '');
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

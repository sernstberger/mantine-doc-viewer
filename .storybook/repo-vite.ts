import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Static folders this repo's stories load files from */
export const repoStaticDirs: string[] = [path.resolve(__dirname, '../docs/public')];

/**
 * Vite settings only this repo needs: the dependencies the package imports on demand, so a cold
 * dev server does not re-optimise and reload the page when a story first loads them
 */
export const repoViteConfig: UserConfig = {
  optimizeDeps: {
    include: [
      'pdfjs-dist',
      '@cantoo/pdf-lib',
      'react-markdown',
      'remark-gfm',
      '@mantine/code-highlight',
    ],
  },
};

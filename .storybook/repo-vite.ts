import type { InlineConfig } from 'vite';

/** Static folders this repo's stories load files from */
export const repoStaticDirs = ['../docs/public'];

/**
 * Vite settings only this repo needs: the dependencies the package imports on demand, so a cold
 * dev server does not re-optimise and reload the page when a story first loads them
 */
export const repoViteConfig: InlineConfig = {
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

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pdfjsStandardFonts = path.join(
  path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json')),
  'standard_fonts'
);

/** Static folders this repo's stories load files from, including the pdf.js standard fonts */
export const repoStaticDirs: (string | { from: string; to: string })[] = [
  path.resolve(__dirname, '../docs/public'),
  { from: pdfjsStandardFonts, to: '/standard_fonts' },
];

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

import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, join } from 'path';

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../package/src/**/*.story.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: ['../docs/public'],
  addons: [getAbsolutePath('@storybook/addon-essentials')],
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  docs: {
    autodocs: false,
  },
  // No telemetry: it also prints a notice and spawns the package manager during builds
  core: { disableTelemetry: true },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    // Dependencies the package imports on demand: Vite would find them only when a story first
    // loads them, re-optimise and reload the page mid-test on a cold dev server
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        'pdfjs-dist',
        '@cantoo/pdf-lib',
        'react-markdown',
        'remark-gfm',
        '@mantine/code-highlight',
      ],
    },
    build: {
      ...viteConfig.build,
      // The chunks over Vite's 500 kB default are single third-party modules that already load
      // on demand (pdf.js, Shiki grammars, Storybook's docs renderer): nothing left to split
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        ...viteConfig.build?.rollupOptions,
        onwarn(warning, warn) {
          // Storybook's own preview runtime uses eval; that is Storybook's code, not ours
          if (warning.code === 'EVAL' && warning.id?.includes('/@storybook/core/')) {
            return;
          }
          warn(warning);
        },
      },
    },
  }),
};

export default config;

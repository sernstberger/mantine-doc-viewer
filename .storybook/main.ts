import type { StorybookConfig } from '@storybook/react-vite';
import { dirname, join } from 'path';
import { repoStaticDirs, repoViteConfig } from './repo-vite';

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
  stories: ['../package/src/**/*.story.@(js|jsx|mjs|ts|tsx)'],
  staticDirs: repoStaticDirs,
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
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [
        ...(viteConfig.optimizeDeps?.include ?? []),
        ...(repoViteConfig.optimizeDeps?.include ?? []),
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

import path from 'node:path';
import nodeExternals from 'rollup-plugin-node-externals';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';
import banner from 'rollup-plugin-banner2';
import { createGenerateScopedName } from 'hash-css-selector';

const outputDir = path.join(process.cwd(), './package/dist');

export default {
  input: {
    index: path.join(process.cwd(), './package/src/index.ts'),
    editor: path.join(process.cwd(), './package/src/editor.ts'),
    markup: path.join(process.cwd(), './package/src/markup.ts'),
  },
  output: [
    {
      format: 'es',
      entryFileNames: '[name].mjs',
      dir: path.join(outputDir, 'esm'),
      preserveModules: true,
      sourcemap: false,
    },
    {
      format: 'cjs',
      entryFileNames: '[name].cjs',
      dir: path.join(outputDir, 'cjs'),
      preserveModules: true,
      sourcemap: false,
    },
  ],
  plugins: [
    nodeExternals({
      packagePath: path.join(process.cwd(), 'package/package.json'),
    }),
    nodeResolve({ extensions: ['.ts', '.tsx', '.js', '.jsx'] }),
    esbuild({
      sourceMap: false,
      tsconfig: path.resolve(process.cwd(), 'tsconfig.build.json'),
    }),
    replace({ preventAssignment: true }),
    postcss({
      extract: 'index.css',
      modules: { generateScopedName: createGenerateScopedName('me') },
      minimize: true,
    }),
    banner((chunk) => (chunk.isEntry ? undefined : "'use client';\n")),
  ],
};

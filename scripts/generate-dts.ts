import fs from 'fs-extra';
import { rollup } from 'rollup';
import { dts } from 'rollup-plugin-dts';
import signale from 'signale';
import { $ } from 'zx';
import path from 'node:path';

const typesDir = path.join(process.cwd(), 'package/dist/types');
const tscDir = path.join(process.cwd(), 'package/dist/.types-tsc');

/**
 * tsc writes one declaration file per source file, with extensionless relative imports. Those fail
 * to resolve for consumers on moduleResolution node16/nodenext when read as ESM (.d.mts), so the
 * declarations are bundled into one file, which has no relative imports. The same bundle is written
 * as index.d.ts (for require) and index.d.mts (for import).
 */
async function generateDts() {
  try {
    await fs.remove(tscDir);
    await fs.remove(typesDir);
    await $`yarn tsc --project tsconfig.build.json --declarationDir ${tscDir}`;
    const bundle = await rollup({
      input: path.join(tscDir, 'index.d.ts'),
      external: (id) => !id.startsWith('.') && !path.isAbsolute(id),
      plugins: [dts()],
    });
    await bundle.write({ file: path.join(typesDir, 'index.d.ts'), format: 'es' });
    await bundle.close();
    // pdfjs-dist has no "exports" map, so under nodenext an ESM consumer needs the file extension
    // on its deep type imports (the .js resolves to the .d.ts next to it)
    const declarations = await fs.readFile(path.join(typesDir, 'index.d.ts'), 'utf-8');
    await fs.writeFile(
      path.join(typesDir, 'index.d.ts'),
      declarations.replace(/(from 'pdfjs-dist\/types\/[^']+)'/g, "$1.js'")
    );
    await fs.copy(path.join(typesDir, 'index.d.ts'), path.join(typesDir, 'index.d.mts'));
    await fs.remove(tscDir);
  } catch (err) {
    signale.error('Failed to generate d.ts files');
    signale.error(err);
    process.exit(1);
  }
}

generateDts();

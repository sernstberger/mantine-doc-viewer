import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'fs-extra';

const pdfjsRoot = path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));

fs.copySync(
  path.join(pdfjsRoot, 'standard_fonts'),
  path.join(process.cwd(), 'public/standard_fonts'),
  { overwrite: true }
);

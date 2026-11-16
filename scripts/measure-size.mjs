// Gzipped JavaScript an app loads for each entry of the built package, without peer dependencies.
// Run `npm run build` first. The static graph is the entry chunk plus every chunk it imports
// statically, gzipped as one stream; chunks reached through `import()` load only when used.
import { build } from 'esbuild';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const dist = path.resolve('package/dist/esm');
const entries = [
  {
    name: 'DocViewer from the main entry',
    file: 'index',
    code: 'import { DocViewer } from "ENTRY"; console.log(DocViewer);',
  },
  { name: 'editor entry', file: 'editor', code: 'import * as all from "ENTRY"; console.log(all);' },
  { name: 'markup entry', file: 'markup', code: 'import * as all from "ENTRY"; console.log(all);' },
];
const outdir = fs.mkdtempSync(path.join(os.tmpdir(), 'doc-viewer-size-'));
const gzip = (buffers) => zlib.gzipSync(Buffer.concat(buffers), { level: 9 }).length;
const kilobytes = (bytes) => `${(bytes / 1000).toFixed(1)} kB`;

const staticImports = (file) =>
  [
    ...fs
      .readFileSync(file, 'utf8')
      .matchAll(/(?:^|[;}])\s*(?:import|export)[^;()]*?from\s*"(\.[^"]+)"/g),
  ].map((match) => path.join(path.dirname(file), match[1]));

const staticGraph = (file, seen = new Set()) => {
  if (!seen.has(file)) {
    seen.add(file);
    staticImports(file).forEach((imported) => staticGraph(imported, seen));
  }
  return [...seen];
};

try {
  for (const { name, file, code } of entries) {
    const entry = path.join(outdir, `${file}-entry.mjs`);
    fs.writeFileSync(entry, code.replace('ENTRY', path.join(dist, `${file}.mjs`)));
    await build({
      entryPoints: [entry],
      outdir: path.join(outdir, file),
      bundle: true,
      minify: true,
      splitting: true,
      format: 'esm',
      packages: 'external',
      logLevel: 'silent',
    });
    const entryFile = path.join(outdir, file, `${file}-entry.js`);
    const files = staticGraph(entryFile);
    const bytes = gzip(files.map((file) => fs.readFileSync(file)));
    console.log(`${name}: ${kilobytes(bytes)} gzipped JavaScript, ${files.length} chunks`);
  }
  const css = fs.readFileSync('package/dist/styles.css');
  console.log(`styles.css: ${kilobytes(gzip([css]))} gzipped`);
} finally {
  fs.rmSync(outdir, { recursive: true, force: true });
}

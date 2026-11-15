import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync(path.join(__dirname, 'DocViewer.module.css'), 'utf8');

describe('DocViewer.module.css', () => {
  it('has no custom property that refers to itself, which would make it invalid', () => {
    const selfReferences = Array.from(css.matchAll(/(--[\w-]+)\s*:([^;]+);/g))
      .filter(([, name, value]) => value.includes(`var(${name})`) || value.includes(`var(${name},`))
      .map(([declaration]) => declaration.trim());

    expect(selfReferences).toEqual([]);
  });
});

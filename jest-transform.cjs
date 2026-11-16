const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const babelJest = require('babel-jest').default;
const { transformSync } = require('esbuild');

const babel = babelJest.createTransformer({
  babelrc: false,
  configFile: false,
  parserOpts: { plugins: ['jsx', 'typescript'] },
});

const self = readFileSync(__filename, 'utf8');

module.exports = {
  canInstrument: true,
  getCacheKey(source, filename, options) {
    return createHash('sha1')
      .update(self)
      .update(source)
      .update(filename)
      .update(String(options.instrument))
      .digest('hex');
  },
  process(source, filename, options) {
    const code = options.instrument ? babel.process(source, filename, options).code : source;
    const { code: output, map } = transformSync(code, {
      loader: filename.endsWith('x') ? 'tsx' : 'ts',
      format: 'cjs',
      target: 'es2022',
      jsx: 'automatic',
      sourcemap: true,
      sourcesContent: false,
      sourcefile: filename,
    });
    return { code: output, map: JSON.parse(map) };
  },
};

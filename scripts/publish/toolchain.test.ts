import { matchesNvmrc, withGitHead } from './toolchain';

describe('matchesNvmrc', () => {
  it('accepts the exact version, with or without the v prefix', () => {
    expect(matchesNvmrc('v24.3.0', 'v24.3.0\n')).toBe(true);
    expect(matchesNvmrc('v24.3.0', '24.3.0')).toBe(true);
  });

  it('accepts any version within a partial .nvmrc', () => {
    expect(matchesNvmrc('v24.21.0', '24')).toBe(true);
    expect(matchesNvmrc('v24.3.1', 'v24.3')).toBe(true);
  });

  it('rejects another version', () => {
    expect(matchesNvmrc('v24.21.0', 'v24.3.0')).toBe(false);
    expect(matchesNvmrc('v24.30.0', 'v24.3')).toBe(false);
    expect(matchesNvmrc('v22.14.0', '24')).toBe(false);
  });
});

describe('withGitHead', () => {
  it('records the commit in the manifest and keeps its formatting', () => {
    expect(withGitHead('{\n  "name": "my-lib",\n  "version": "0.1.0"\n}\n', 'abc123')).toBe(
      '{\n  "name": "my-lib",\n  "version": "0.1.0",\n  "gitHead": "abc123"\n}\n'
    );
  });
});

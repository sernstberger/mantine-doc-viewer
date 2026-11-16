import { isNotFound, parseVersions } from './registry';

describe('isNotFound', () => {
  it('recognises npm 404 errors in stderr, stdout or the message', () => {
    expect(isNotFound({ stderr: 'npm error code E404' })).toBe(true);
    expect(isNotFound({ stdout: '{"error":{"code":"E404"}}' })).toBe(true);
    expect(isNotFound({ message: '404 Not Found - GET https://registry.npmjs.org/x' })).toBe(true);
  });

  it('leaves other failures to the caller', () => {
    expect(isNotFound({ stderr: 'npm error code ETIMEDOUT' })).toBe(false);
    expect(isNotFound({})).toBe(false);
  });
});

describe('parseVersions', () => {
  it('reads one version and a list of versions', () => {
    expect(parseVersions('"0.1.0"')).toEqual(['0.1.0']);
    expect(parseVersions('["0.1.0", "0.2.0"]')).toEqual(['0.1.0', '0.2.0']);
  });
});

import { githubRepo, isTrustedPublisher, listsTrustConfig, trustCommand } from './trust';

describe('isTrustedPublisher', () => {
  it('is true for a version published from CI through OIDC', () => {
    expect(
      isTrustedPublisher({
        name: 'GitHub Actions',
        trustedPublisher: { id: 'github', oidcConfigId: 'oidc:1' },
      })
    ).toBe(true);
  });

  it('is false for a version published by hand or no record', () => {
    expect(isTrustedPublisher({ name: 'owner', email: 'owner@example.com' })).toBe(false);
    expect(isTrustedPublisher(null)).toBe(false);
    expect(isTrustedPublisher('owner')).toBe(false);
  });
});

describe('listsTrustConfig', () => {
  it('is true when a trusted publisher is listed', () => {
    expect(listsTrustConfig('[{"type":"github","file":"publish.yml"}]')).toBe(true);
    expect(listsTrustConfig('{"type":"github","file":"publish.yml"}')).toBe(true);
  });

  it('is false for an empty list, an error or output that is not JSON', () => {
    expect(listsTrustConfig('[]')).toBe(false);
    expect(listsTrustConfig('null')).toBe(false);
    expect(listsTrustConfig('{"error":{"code":"EOTP"}}')).toBe(false);
    expect(listsTrustConfig('')).toBe(false);
  });
});

describe('githubRepo', () => {
  it('reads owner/repo from https and ssh URLs', () => {
    expect(githubRepo('https://github.com/owner/repo.git')).toBe('owner/repo');
    expect(githubRepo('git+https://github.com/owner/repo')).toBe('owner/repo');
    expect(githubRepo('git@github.com:owner/repo.git')).toBe('owner/repo');
    expect(githubRepo('https://github.com/owner/repo/')).toBe('owner/repo');
  });
});

describe('trustCommand', () => {
  it('names the workflow file, the repository and the release environment', () => {
    expect(trustCommand('my-lib', 'owner/repo')).toBe(
      'npm trust github my-lib --file publish.yml --repo owner/repo --env release --allow-publish'
    );
  });
});

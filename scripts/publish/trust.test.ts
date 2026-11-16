import { githubRepo, isTrustedPublisher, revokeCommands, trustCommand, trustStatus } from './trust';

describe('isTrustedPublisher', () => {
  it('is true for the registry record of a version published through OIDC', () => {
    expect(
      isTrustedPublisher({
        name: 'GitHub Actions',
        email: 'npm-oidc-no-reply@github.com',
        trustedPublisher: { id: 'github', oidcConfigId: 'oidc:1' },
      })
    ).toBe(true);
  });

  it('is true for the string npm view prints for such a version', () => {
    expect(isTrustedPublisher('GitHub Actions <npm-oidc-no-reply@github.com>')).toBe(true);
  });

  it('is false for a version published by hand or no record', () => {
    expect(isTrustedPublisher({ name: 'owner', email: 'owner@example.com' })).toBe(false);
    expect(isTrustedPublisher('owner <owner@example.com>')).toBe(false);
    expect(isTrustedPublisher(null)).toBe(false);
    expect(isTrustedPublisher(undefined)).toBe(false);
  });
});

describe('trustStatus', () => {
  const now = new Date('2026-12-10T12:00:00Z');

  it('is configured for a listed publisher with no sign of expiry', () => {
    expect(trustStatus('[{"id":"t1","type":"github","file":"publish.yml"}]', now)).toBe(
      'configured'
    );
    expect(trustStatus('{"id":"t1","type":"github"}', now)).toBe('configured');
    expect(
      trustStatus('[{"id":"t1","createdAt":"2026-12-09T12:00:00Z","expiresAt":"2026-12-11"}]', now)
    ).toBe('configured');
  });

  it('is expired when the entry says so, by status or date', () => {
    expect(trustStatus('[{"id":"t1","status":"expired"}]', now)).toBe('expired');
    expect(trustStatus('[{"id":"t1","expiresAt":"2026-12-09T00:00:00Z"}]', now)).toBe('expired');
    expect(trustStatus('[{"id":"t1","createdAt":"2026-12-01T00:00:00Z"}]', now)).toBe('expired');
  });

  it('is missing for an empty list', () => {
    expect(trustStatus('[]', now)).toBe('missing');
  });

  it('is unknown when npm could not answer', () => {
    expect(trustStatus('{"error":{"code":"EOTP"}}', now)).toBe('unknown');
    expect(trustStatus('', now)).toBe('unknown');
    expect(trustStatus('null', now)).toBe('unknown');
  });
});

describe('revokeCommands', () => {
  it('lists, revokes by id and creates the trusted publisher again', () => {
    expect(revokeCommands('my-lib', 'owner/repo')).toEqual([
      'npm trust list my-lib',
      'npm trust revoke my-lib --id=<id from the list>',
      'npm trust github my-lib --file publish.yml --repo owner/repo --env release --allow-publish',
    ]);
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

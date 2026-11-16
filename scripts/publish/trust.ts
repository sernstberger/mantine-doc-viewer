const OIDC_EMAIL = 'npm-oidc-no-reply@github.com';
const FIRST_PUBLISH_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

export type TrustStatus = 'configured' | 'expired' | 'missing' | 'unknown';

/**
 * True when a version was published through trusted publishing: the registry record
 * (`_npmUser` with `trustedPublisher`) or the string `npm view <name> _npmUser` prints for it
 */
export function isTrustedPublisher(npmUser: unknown): boolean {
  if (typeof npmUser === 'string') {
    return npmUser.includes(OIDC_EMAIL);
  }

  return typeof npmUser === 'object' && npmUser !== null && 'trustedPublisher' in npmUser;
}

function isExpired(entry: Record<string, unknown>, now: Date) {
  const expiresAt = entry.expiresAt ?? entry.expires ?? entry.expiry;
  const createdAt = entry.createdAt ?? entry.created;

  if (entry.status === 'expired' || entry.state === 'expired') {
    return true;
  }

  if (typeof expiresAt === 'string') {
    return new Date(expiresAt).getTime() < now.getTime();
  }

  return (
    typeof createdAt === 'string' &&
    now.getTime() - new Date(createdAt).getTime() > FIRST_PUBLISH_WINDOW_MS
  );
}

/**
 * Reads `npm trust list <name> --json`, for a package that has not published through it yet: a
 * configuration that does not publish within 2 days of its creation expires and must be revoked
 * and created again. `unknown`: npm did not answer (no login, OTP refused, npm older than 11.15).
 */
export function trustStatus(stdout: string, now: Date): TrustStatus {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stdout);
  } catch {
    return 'unknown';
  }

  if (typeof parsed !== 'object' || parsed === null || 'error' in parsed) {
    return 'unknown';
  }

  const entries = (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[];

  if (entries.length === 0) {
    return 'missing';
  }

  return entries.every((entry) => isExpired(entry, now)) ? 'expired' : 'configured';
}

/** `owner/repo` from a GitHub URL such as `https://github.com/owner/repo.git` */
export function githubRepo(url: string): string {
  return url
    .replace(/^.*github\.com[/:]/, '')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');
}

/** The one-time command that lets `publish.yml` in the `release` environment publish the package */
export function trustCommand(name: string, repo: string): string {
  return `npm trust github ${name} --file publish.yml --repo ${repo} --env release --allow-publish`;
}

/** Replaces an expired configuration: npm keeps one per package, and an expired one cannot be edited */
export function revokeCommands(name: string, repo: string): string[] {
  return [
    `npm trust list ${name}`,
    `npm trust revoke ${name} --id=<id from the list>`,
    trustCommand(name, repo),
  ];
}

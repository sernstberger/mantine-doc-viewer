/** True when an `_npmUser` record says the version was published through trusted publishing */
export function isTrustedPublisher(npmUser: unknown): boolean {
  return typeof npmUser === 'object' && npmUser !== null && 'trustedPublisher' in npmUser;
}

/** True when `npm trust list <name> --json` printed at least one trusted publisher */
export function listsTrustConfig(stdout: string): boolean {
  try {
    const parsed: unknown = JSON.parse(stdout);
    if (Array.isArray(parsed)) {
      return parsed.length > 0;
    }

    return typeof parsed === 'object' && parsed !== null && !('error' in parsed);
  } catch {
    return false;
  }
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

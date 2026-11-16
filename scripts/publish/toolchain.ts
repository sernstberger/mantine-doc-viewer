/** True when the running Node (`process.version`) is the one `.nvmrc` asks for, or within it */
export function matchesNvmrc(processVersion: string, nvmrc: string): boolean {
  const wanted = nvmrc.trim().replace(/^v/, '');
  const running = processVersion.trim().replace(/^v/, '');
  return running === wanted || running.startsWith(`${wanted}.`);
}

/**
 * Adds `gitHead` to a package.json text. npm stores it with the version, and the publish workflow
 * reads it back to tag and document the commit that was published
 */
export function withGitHead(packageJson: string, sha: string): string {
  return `${JSON.stringify({ ...JSON.parse(packageJson), gitHead: sha }, null, 2)}\n`;
}

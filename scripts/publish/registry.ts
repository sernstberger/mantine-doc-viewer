import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

interface CommandError {
  stderr?: string;
  stdout?: string;
  message?: string;
}

/** True when an `npm view` failure means "no such package or version" */
export function isNotFound(error: CommandError): boolean {
  return /E404|404 Not Found/.test(
    `${error.stderr ?? ''}${error.stdout ?? ''}${error.message ?? ''}`
  );
}

/** `npm view <name> versions --json` prints a string for one version and an array for several */
export function parseVersions(stdout: string): string[] {
  const parsed: string | string[] = JSON.parse(stdout);
  return Array.isArray(parsed) ? parsed : [parsed];
}

async function view(args: string[]): Promise<string | null> {
  try {
    return (await promisify(execFile)('npm', ['view', ...args])).stdout.trim();
  } catch (error) {
    if (isNotFound(error as CommandError)) {
      return null;
    }

    throw error;
  }
}

/** Every published version of the package, or `null` when the package is not on npm */
export async function getPublishedVersions(name: string): Promise<string[] | null> {
  const stdout = await view([name, 'versions', '--json']);
  return stdout === null ? null : parseVersions(stdout);
}

/** The version behind the `latest` dist-tag, or `null` when there is none */
export async function getLatestVersion(name: string): Promise<string | null> {
  return (await view([name, 'dist-tags.latest'])) || null;
}

/**
 * The `_npmUser` record of the latest version as the registry stores it (`npm view` prints it as
 * a string): who, or which trusted publisher, published it. `null` when the package is not on npm
 */
export async function getLatestPublisher(name: string): Promise<unknown> {
  const response = await fetch(`https://registry.npmjs.org/${name.replace('/', '%2f')}/latest`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`npm registry answered ${response.status} for ${name}`);
  }

  return ((await response.json()) as { _npmUser?: unknown })._npmUser ?? null;
}

/** The commit npm recorded for a published version (`gitHead`), or `null` */
export async function getGitHead(name: string, version: string): Promise<string | null> {
  return (await view([`${name}@${version}`, 'gitHead'])) || null;
}

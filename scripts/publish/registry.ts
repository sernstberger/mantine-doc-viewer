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

/** The `_npmUser` record of the latest version: who (or which CI) published it */
export async function getLatestPublisher(name: string): Promise<unknown> {
  const stdout = await view([name, '_npmUser', '--json']);
  return stdout ? JSON.parse(stdout) : null;
}

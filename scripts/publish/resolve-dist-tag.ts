/** Prereleases (`1.0.0-alpha.0`) go to the `next` dist-tag, everything else to `latest` */
export function resolveDistTag(version: string): 'latest' | 'next' {
  return version.includes('-') ? 'next' : 'latest';
}

function parseStableVersion(version: string): [number, number, number] | null {
  const parts = version.split('.');

  if (parts.length !== 3) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));

  if (numbers.some((value) => !Number.isInteger(value) || value < 0)) {
    return null;
  }

  return [numbers[0], numbers[1], numbers[2]];
}

/** True when publishing a stable `version` as `latest` would move the tag below `currentLatest` */
export function wouldMoveLatestBackward(version: string, currentLatest: string | null): boolean {
  if (version.includes('-') || !currentLatest) {
    return false;
  }

  const next = parseStableVersion(version);
  const current = parseStableVersion(currentLatest);

  if (next === null || current === null) {
    return false;
  }

  const index = next.findIndex((part, partIndex) => part !== current[partIndex]);

  return index !== -1 && next[index] < current[index];
}

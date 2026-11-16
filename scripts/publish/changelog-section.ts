const NEXT_MARKER = /^<!--\s*next:\s*v?(\d+\.\d+\.\d+)\s*-->\s*$/;
const UNRELEASED = /^## Unreleased\s*$/i;

function sectionEnd(lines: string[], start: number) {
  const end = lines.findIndex((line, index) => index > start && line.startsWith('## '));
  return end === -1 ? lines.length : end;
}

/**
 * Returns the notes under the `## X.Y.Z` heading (a date may follow the version), trimmed, or
 * `null` when the CHANGELOG has no such heading or the section is empty.
 */
export function getChangelogSection(changelog: string, version: string): string | null {
  const lines = changelog.split('\n');
  const start = lines.findIndex(
    (line) => line === `## ${version}` || line.startsWith(`## ${version} `)
  );

  if (start === -1) {
    return null;
  }

  const notes = lines
    .slice(start + 1, sectionEnd(lines, start))
    .join('\n')
    .trim();

  return notes || null;
}

/**
 * Turns `## Unreleased` into `## X.Y.Z (YYYY-MM-DD)` and drops its `<!-- next: X.Y.Z -->` marker.
 * Throws when there is no `Unreleased` section, when it holds no notes, or when its marker names
 * another version than the one being released.
 */
export function releaseUnreleased(changelog: string, version: string, date: string): string {
  const lines = changelog.split('\n');
  const start = lines.findIndex((line) => UNRELEASED.test(line));

  if (start === -1) {
    throw new Error(
      'CHANGELOG.md has no "## Unreleased" heading: write the release notes under it'
    );
  }

  const end = sectionEnd(lines, start);
  const section = lines.slice(start + 1, end);
  const marker = section.map((line) => NEXT_MARKER.exec(line)?.[1]).find(Boolean);

  if (marker && marker !== version) {
    throw new Error(
      `CHANGELOG.md says the next release is ${marker}, not ${version}: pick the matching release type or change the marker`
    );
  }

  const notes = section.filter((line) => !NEXT_MARKER.test(line));

  if (notes.join('\n').trim() === '') {
    throw new Error(
      'The "## Unreleased" section of CHANGELOG.md is empty: write the release notes'
    );
  }

  return [...lines.slice(0, start), `## ${version} (${date})`, ...notes, ...lines.slice(end)].join(
    '\n'
  );
}

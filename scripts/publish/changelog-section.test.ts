import { getChangelogSection, releaseChangelog } from './changelog-section';

const changelog = [
  '# Changelog',
  '',
  '## Unreleased',
  '',
  '<!-- next: 0.2.0 -->',
  '',
  '- New `size` prop',
  '',
  '## 0.1.0 (2026-11-20)',
  '',
  'First release.',
  '',
  '- `DocViewer`',
  '',
].join('\n');

describe('getChangelogSection', () => {
  it('returns the trimmed notes of a dated version', () => {
    expect(getChangelogSection(changelog, '0.1.0')).toBe('First release.\n\n- `DocViewer`');
  });

  it('accepts a heading with the version alone and stops at the next heading', () => {
    expect(getChangelogSection('## 0.2.0\n\nNotes\n## 0.1.0\n\nOld', '0.2.0')).toBe('Notes');
  });

  it('does not match a longer version that starts the same', () => {
    expect(getChangelogSection('## 0.1.10 (2026-12-01)\n\nNotes', '0.1.1')).toBeNull();
  });

  it('returns null when the version is missing or has no notes', () => {
    expect(getChangelogSection(changelog, '0.3.0')).toBeNull();
    expect(getChangelogSection('## 0.2.0\n\n## 0.1.0\n\nOld', '0.2.0')).toBeNull();
  });
});

describe('releaseChangelog', () => {
  it('dates the Unreleased heading and drops the next marker', () => {
    const released = releaseChangelog(changelog, '0.2.0', '2026-12-01');

    expect(released).not.toContain('Unreleased');
    expect(released).not.toContain('<!-- next');
    expect(released).toContain('## 0.2.0 (2026-12-01)');
    expect(getChangelogSection(released, '0.2.0')).toBe('- New `size` prop');
    expect(getChangelogSection(released, '0.1.0')).toBe('First release.\n\n- `DocViewer`');
  });

  it('works without a marker and when Unreleased is the last section', () => {
    expect(releaseChangelog('# Changelog\n\n## Unreleased\n\n- Fix', '0.1.1', '2026-12-02')).toBe(
      '# Changelog\n\n## 0.1.1 (2026-12-02)\n\n- Fix'
    );
  });

  it('throws without an Unreleased heading', () => {
    expect(() => releaseChangelog('## 0.1.0\n\nNotes', '0.2.0', '2026-12-01')).toThrow(
      'no "## Unreleased" heading'
    );
  });

  it('throws when the Unreleased section holds only the marker', () => {
    expect(() =>
      releaseChangelog('## Unreleased\n\n<!-- next: 0.2.0 -->\n\n## 0.1.0', '0.2.0', '2026-12-01')
    ).toThrow('is empty');
  });

  it('throws when the marker names another version', () => {
    expect(() => releaseChangelog(changelog, '0.1.1', '2026-12-01')).toThrow(
      'says the next release is 0.2.0, not 0.1.1'
    );
  });

  it('keeps Unreleased for a prerelease and adds a dated section with its notes', () => {
    const released = releaseChangelog(changelog, '0.2.0-alpha.0', '2026-12-01');

    expect(released).toContain('## Unreleased\n\n<!-- next: 0.2.0 -->');
    expect(released.indexOf('## 0.2.0-alpha.0 (2026-12-01)')).toBeGreaterThan(
      released.indexOf('## Unreleased')
    );
    expect(getChangelogSection(released, '0.2.0-alpha.0')).toBe('- New `size` prop');
    expect(getChangelogSection(released, '0.1.0')).toBe('First release.\n\n- `DocViewer`');
  });

  it('releases the stable version after its prereleases from the same Unreleased notes', () => {
    const alpha = releaseChangelog(changelog, '0.2.0-alpha.0', '2026-12-01');
    const stable = releaseChangelog(alpha, '0.2.0', '2026-12-08');

    expect(getChangelogSection(stable, '0.2.0')).toBe('- New `size` prop');
    expect(getChangelogSection(stable, '0.2.0-alpha.0')).toBe('- New `size` prop');
    expect(stable).not.toContain('Unreleased');
  });

  it('checks the marker against the version without its prerelease part', () => {
    expect(() => releaseChangelog(changelog, '0.3.0-beta.0', '2026-12-01')).toThrow(
      'says the next release is 0.2.0, not 0.3.0-beta.0'
    );
  });
});

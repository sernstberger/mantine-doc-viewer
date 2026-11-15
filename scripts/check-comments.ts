/**
 * Fails when package source holds a comment that narrates logic (RESTRUCTURE.md section 8).
 *
 * Mantine's code style: no inline comments that describe what the code does, JSDoc kept on public
 * API. In every non-test, non-story file under package/src a line comment (`//` or `{/* *\/}`)
 * is allowed only when it starts with one of these markers:
 *
 *   - a lint pragma: `eslint-disable`, `oxlint-disable` (give the reason after ` -- `)
 *   - a TypeScript pragma: `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`
 *   - `Workaround:`, one line saying which browser or pdf.js behaviour the next lines work around
 *
 * Anything else belongs in the code (a better name), or in JSDoc on the function.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'package/src');
const SKIPPED = /\.(test|story)\.tsx?$|\.d\.ts$|\/apps\//;
const COMMENT = /^\s*(\/\/|\{\/\*)\s*(.*)$/;
const ALLOWED =
  /^(eslint-disable|oxlint-disable|@ts-expect-error|@ts-ignore|@ts-nocheck|Workaround:)/;

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(full);
    }
    return /\.tsx?$/.test(entry.name) && !SKIPPED.test(full) ? [full] : [];
  });
}

const failures = listFiles(ROOT).flatMap((file) =>
  fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .flatMap((line, index) => {
      const match = COMMENT.exec(line);
      return match && !ALLOWED.test(match[2])
        ? [`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`]
        : [];
    })
);

if (failures.length > 0) {
  // eslint-disable-next-line no-console -- a CLI script reports on stderr
  console.error(
    `Logic comments in package source (allowed: lint and TypeScript pragmas, "Workaround:"):\n${failures.join('\n')}`
  );
  process.exit(1);
}

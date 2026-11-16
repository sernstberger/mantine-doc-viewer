/**
 * Fails when package source holds a comment that narrates logic (RESTRUCTURE.md section 8).
 *
 * Mantine's code style: no inline comments that describe what the code does, JSDoc kept on public
 * API, and almost no comments in CSS. In every non-test, non-story file under package/src a line
 * comment (`//` or `{/* *\/}`) or a CSS comment is allowed only when it starts with one of these
 * markers:
 *
 *   - a lint pragma: `eslint-disable`, `oxlint-disable` (give the reason after ` -- `)
 *   - a TypeScript pragma: `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`
 *   - `Workaround:`, one line saying which browser or pdf.js behaviour the next lines work around
 *   - `Adapted from`, in CSS, the source and license of styles taken from another project
 *
 * Anything else belongs in the code (a better name), or in JSDoc on the function.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'package/src');
const SKIPPED = /\.(test|story)\.tsx?$|\.d\.ts$|\/apps\//;
const COMMENT = /^\s*(\/\/|\{\/\*)\s*(.*)$/;
const CSS_COMMENT = /\/\*([\s\S]*?)\*\//g;
const ALLOWED =
  /^(eslint-disable|oxlint-disable|@ts-expect-error|@ts-ignore|@ts-nocheck|Workaround:|Adapted from)/;

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listFiles(full);
    }
    return /\.(tsx?|css)$/.test(entry.name) && !SKIPPED.test(full) ? [full] : [];
  });
}

function lineOf(source: string, offset: number) {
  return source.slice(0, offset).split('\n').length;
}

function findCodeComments(source: string) {
  return source.split('\n').flatMap((line, index) => {
    const match = COMMENT.exec(line);
    return match && !ALLOWED.test(match[2]) ? [{ line: index + 1, text: line.trim() }] : [];
  });
}

function findCssComments(source: string) {
  return [...source.matchAll(CSS_COMMENT)].flatMap((match) =>
    ALLOWED.test(match[1].replace(/^[\s*]+/, ''))
      ? []
      : [{ line: lineOf(source, match.index), text: match[0].split('\n')[0] }]
  );
}

const failures = listFiles(ROOT).flatMap((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const found = file.endsWith('.css') ? findCssComments(source) : findCodeComments(source);
  return found.map(({ line, text }) => `${path.relative(process.cwd(), file)}:${line}: ${text}`);
});

if (failures.length > 0) {
  // eslint-disable-next-line no-console -- a CLI script reports on stderr
  console.error(
    `Logic comments in package source (allowed: lint and TypeScript pragmas, "Workaround:", "Adapted from"):\n${failures.join('\n')}`
  );
  process.exit(1);
}

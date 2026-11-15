# mantine-doc-viewer

## Code style: Mantine's own rules (the goal is a package Mantine could merge)

- Follow the Mantine monorepo's CLAUDE.md/AGENTS.md (reference: `~/.cache/mantine-review/mantine-<version>`,
  fetched by `~/.claude/skills/mantine-review/scripts/fetch-official.sh`).
- No inline comments that describe logic. Keep JSDoc on public props, types and functions. A
  comment stays only where the code cannot say why (a browser or pdf.js workaround), kept short.
- Zero warnings: any console.error/warn in a test fails it (`jest-console.cjs`), TypeScript strict,
  oxlint `--deny-warnings`, silent builds.
- Public API follows the official extensions (Lightbox is the closest analogue): compound parts,
  about 30 own props or fewer per component, engines through adapters.

## CRAP audit (the global `crap-audit` skill)

- Coverage: `npx jest --coverage --coverageReporters=json`. Coverage is held at 100% (the Jest
  threshold fails the suite otherwise), so CRAP equals complexity here and any coverage hole is a
  bug in the tests.
- Thresholds for this repo: the skill's defaults (CRAP > 30, cc > 15, cog > 20, lines > 80).
  Story files (`*.story.tsx`) are out of scope: they are showcase apps, excluded from coverage.
- Fix playbook, with patterns already in the code:
  - pure logic in its own module with unit tests, like `pdf/geometry.ts`, `pdf/page-edits.ts`,
    `pdf/spreads.ts`;
  - one hook per concern, like `pdf/use-current-page.ts`, `pdf/use-zoom-anchor.ts`;
  - key handling as one table of key to action, like `handleKeyDown` in the page editor;
  - components such as `PdfView.tsx` stay wiring: no decisions a plain function could make.
- After each fix: `npm test` (syncpack, format, typecheck incl. docs, lint, coverage).

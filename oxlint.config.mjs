import { defineConfig } from 'oxlint';
import { oxlint } from 'oxc-config-mantine';

export default defineConfig({
  ...oxlint,
  // Agent worktrees under .claude/ hold whole copies of the repo; they are not ours to check
  ignorePatterns: ['**/*.{mjs,cjs,js,d.ts,d.mts}', 'docs/out', 'package/dist', 'coverage', '.claude/**'],
});

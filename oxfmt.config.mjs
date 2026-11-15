import { defineConfig } from 'oxfmt';
import { oxfmt } from 'oxc-config-mantine';

// Agent worktrees under .claude/ hold whole copies of the repo; they are not ours to check
export default defineConfig({ ...oxfmt, ignorePatterns: [...oxfmt.ignorePatterns, '.claude/**'] });

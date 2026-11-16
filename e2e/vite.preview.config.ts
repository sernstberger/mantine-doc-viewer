// Shared by every Mantine lib on the harness: keep this file identical across repos.
// Serves the static Storybook for the browser tests. `vite preview` defaults to a single-page app
// and answers a missing file with index.html (status 200), which hides broken asset links; with
// `appType: 'mpa'` a missing file is a real 404.
import { defineConfig } from 'vite';

export default defineConfig({ appType: 'mpa' });

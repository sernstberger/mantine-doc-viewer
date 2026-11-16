# Publishing checklist

Everything below the line is outward facing and done by hand. Already checked locally:

- `npm test` passes (syncpack, format, types, lint, 1832 tests, 100% coverage). Run `npm run docgen` first on a fresh clone: the docs typecheck reads `docs/docgen.json`
- `npm run build` and `npm run docs:build` succeed, with no CSS warnings from Next.js
- The packed tarball (`npm pack --dry-run`: 230.7 kB, 453 files with README and LICENSE: `dist` only, no source maps, tests or
  stories) installs in a fresh Vite + React 19 app, typechecks, builds, renders a PDF, and loads
  pdf.js and markdown only when needed
- The types are one bundled file (`index.d.ts` and `index.d.mts`); `npx @arethetypeswrong/cli --pack package`
  is green for node10, node16 (CJS and ESM) and bundler (only the CSS files show as unresolved, which
  is expected), and a scratch app on `moduleResolution` nodenext and bundler type-checks
- The CommonJS and ESM entry points both load
- The browser tests (`npm run e2e`, Chromium, Firefox and WebKit) pass, and the `npm test` workflow is green on `main` in CI
- The name `mantine-doc-viewer` is free on npm

---

## 1. GitHub Pages

The repository `sernstberger/mantine-doc-viewer` exists and CI runs on it. In Settings, Pages, the
source is GitHub Actions: the `Deploy docs` workflow (`.github/workflows/deploy-docs.yml`) is the
only docs deploy. It runs on every push to `main`, so the release scripts do not deploy anything.

## 2. npm

1. `npm login` (an npm account with two-factor authentication).
2. From a clean `main`: `npm run release:minor`. The template's script:
   - pulls, refuses a dirty tree, and stops unless the `npm test` workflow succeeded in CI for `HEAD`
     (`gh run list --commit <sha> --workflow "npm test"`; no run, a run in progress or a failed run
     all stop it, so push `main` and wait for CI first; needs the `gh` CLI, logged in)
   - installs, cleans and builds
   - runs `npm run check:exports`, `npm run docgen` and `npm test`, and stops before publishing if any fails
   - copies `README.md` and `LICENSE` into `package/`
   - bumps 0.0.0 to 0.1.0 and runs `npm publish --access public`
   - commits "Release 0.1.0", pushes, and opens a GitHub release page to fill in
   - the docs site is not part of the release: `Deploy docs` publishes it from `main`
3. Replace "fill in on release day" in the `CHANGELOG.md` heading with the date of the release (and
   commit it), then move the 0.1.0 notes into the GitHub release.

## 3. Check what was published

- https://www.npmjs.com/package/mantine-doc-viewer shows the README
- https://sernstberger.github.io/mantine-doc-viewer/ loads, and the PDF demo works (the docs use
  the `/mantine-doc-viewer` base path in production)
- `npm install mantine-doc-viewer` in a fresh app works

## 4. Mantine extensions list

Mantine asks for a published npm package and a pull request to the main repository. In a fork of
`mantinedev/mantine`, add this line to the community list in
`apps/mantine.dev/src/pages/x/extensions.mdx` (after the last entry):

```md
- [DocViewer](https://sernstberger.github.io/mantine-doc-viewer/) – document viewer for PDFs, images, text, code and markdown with search, thumbnails, outline, links, page editing and presentation mode
```

Pull request title: `[mantine.dev] Add mantine-doc-viewer to community extensions`.

## Bundle size

`npm run build && npm run size` prints the numbers the README quotes. The script bundles an entry
from `package/dist/esm` with esbuild (minified, code splitting, peer dependencies external), follows
only static imports from the entry chunk, and gzips those chunks as one stream at level 9. Chunks
loaded through `import()` (pdf.js, markdown, code view) are not counted. Measured on this commit:

- `import { DocViewer }` from the main entry: 43.4 kB of JavaScript (4 chunks)
- `mantine-doc-viewer/editor` and `mantine-doc-viewer/markup`: about 9.4 kB each
- `styles.css`: 4.4 kB

The figures depend a little on the consumer's bundler; the README says "about".

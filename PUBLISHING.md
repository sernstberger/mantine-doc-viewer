# Publishing checklist

Everything below the line is outward facing and done by hand. Already checked locally:

- `npm test` passes (syncpack, format, types, lint, 642 tests, 100% coverage). Run `npm run docgen` first on a fresh clone: the docs typecheck reads `docs/docgen.json`
- `npm run build` and `npm run docs:build` succeed, with no CSS warnings from Next.js
- The packed tarball (166 kB, 319 files with README and LICENSE: `dist` only, no source maps, tests or
  stories) installs in a fresh Vite + React 19 app, typechecks, builds, renders a PDF, and loads
  pdf.js and markdown only when needed
- The types are one bundled file (`index.d.ts` and `index.d.mts`); `npx @arethetypeswrong/cli --pack package`
  is green for node10, node16 (CJS and ESM) and bundler (only the CSS files show as unresolved, which
  is expected), and a scratch app on `moduleResolution` nodenext and bundler type-checks
- The CommonJS and ESM entry points both load
- The name `mantine-doc-viewer` is free on npm

---

## 1. GitHub repository

1. Create the public repository `sernstberger/mantine-doc-viewer` (package.json `repository`,
   `homepage` and `bugs` already point there).
2. Push `main` (development happens on `main`).
3. Settings, Pages: deploy from the `gh-pages` branch (created by the first `docs:deploy`).

## 2. npm

1. `npm login` (an npm account with two-factor authentication).
2. From a clean `main`: `npm run release:minor`. The template's script:
   - pulls, refuses a dirty tree, installs and builds
   - copies `README.md` and `LICENSE` into `package/`
   - bumps 0.0.0 to 0.1.0 and runs `npm publish --access public`
   - commits "Release 0.1.0", pushes, and opens a GitHub release page to fill in
   - `release:minor` is `tsx scripts/release minor && npm run docs:deploy`, so only when the
     release succeeds does `docs:deploy` build the docs and push them to `gh-pages`. If the release
     script fails it exits 1 with a message and the docs are not deployed
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

# Publishing checklist

Everything below the line is outward facing: what CI does on a release and the few clicks it needs. Already checked locally:

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
- `npm run publish:dry-run` packs the tarball `npm publish` would upload
- The name `mantine-doc-viewer` is free on npm

---

## 1. How a release works

Mantine's own model, on a protected `main`: the version bump is reviewed and merged first, then CI
publishes. Nothing is published from a laptop after the first release.

```
npm run release:minor  ->  pull request "[release] Version: 0.2.0" (auto-merge)
                            |  test_pull_request, min_peers, e2e green: merged
                            v
publish.yml (push to main changing package/package.json, or Run workflow)
  prepare  compares package/package.json with npm (scripts/publish --plan)
  test     build, check:exports, docs:build, npm test
  publish  waits for the "release" approval, then npm publish (trusted publishing, provenance)
  docs     deploy-docs.yml: GitHub Pages
  release  GitHub release "0.2.0" with the CHANGELOG section as notes
```

- `scripts/release.ts` (`npm run release:patch|minor|major`, `-- --stage alpha` for a prerelease)
  publishes nothing. From a clean `main` it pulls, stops unless the `npm test` workflow succeeded
  for `HEAD`, the new version is not on npm and its tag does not exist, turns `## Unreleased` in
  `CHANGELOG.md` into `## X.Y.Z (YYYY-MM-DD)` (and stops if the section is empty or its
  `<!-- next: X.Y.Z -->` marker names another version), bumps `package/package.json`, commits
  `[release] Version: X.Y.Z` on `release/X.Y.Z`, and opens the pull request with auto-merge
  (squash). Needs the `gh` CLI, logged in.
- `scripts/publish` is the one publish script, for CI and for the first release. It asks npm
  which versions exist first, so it never publishes a version twice; it refuses to move `latest`
  backward; it builds, runs `check:exports`, copies `README.md` and `LICENSE` into `package/`
  and runs `npm publish --access public` (`--tag next` for a prerelease).
- `publish.yml` publishes through npm trusted publishing (OIDC): no token, no OTP, and npm adds
  provenance. It upgrades npm to 11.15 or later (trusted publishing needs 11.5.1; the Node 24.3
  in `.nvmrc` ships 11.4).
- The docs site follows npm: `Deploy docs` (`deploy-docs.yml`) runs only from `publish.yml` or by
  hand (Actions, Deploy docs, Run workflow) for a docs-only fix. Prereleases leave it alone.
- A push that changes `package/package.json` but keeps a version that is already on npm does
  nothing; Run workflow on the same version finishes it (docs and GitHub release).

Dry run, any time: `npm run publish:dry-run` builds, checks the exports, prints what `prepare`
would decide and runs `npm publish --dry-run` (lists the tarball, uploads nothing).

## 2. Releases

### First release (0.1.0, once)

npm can trust a workflow only for a package that exists, so 0.1.0 is published by hand with the
same script, from the merged release commit.

1. GitHub, Settings, Environments, New environment `release`: Required reviewers: you; leave
   "Prevent self-review" off (you are the only reviewer); Deployment branches and tags: `main`
   only.
2. GitHub, Settings, Actions, General: workflow permissions can stay read-only (`publish.yml`
   asks for `contents: write` and `id-token: write` per job).
3. `npm run release:minor` from a clean, green `main`. It opens `[release] Version: 0.1.0` with
   auto-merge.
4. When it merges, `publish.yml` runs, finds the package missing from npm and stops with a
   "First release" warning. Nothing is published.
5. `git switch main && git pull && npm login && npm run publish:bootstrap`. The script refuses
   unless `HEAD` is `origin/main`, the tree is clean and the `npm test` workflow is green for it,
   then builds and publishes. npm asks for your one-time password in the browser. 0.1.0 has no
   provenance; that is the price of the bootstrap.
6. Actions, Publish package, Run workflow (on `main`), right away, before anything else merges:
   the GitHub release targets the commit the run starts from. It finds 0.1.0 on npm, skips the
   publish, deploys the docs and creates the `0.1.0` GitHub release.

### Before the second release (once)

7. `npm trust github mantine-doc-viewer --file publish.yml --repo sernstberger/mantine-doc-viewer --env release --allow-publish`
   (2FA prompt), or the same on npmjs.com, package Settings, Trusted publisher. Do it just
   before the second release: a new trusted publisher that does not publish within 2 days
   expires. `release.ts` checks `npm trust list` while the latest version on npm was not
   published by CI, and prints this command when nothing is configured.
8. After the first CI publish succeeds: npmjs.com, package Settings, Publishing access, "Require
   two-factor authentication and disallow tokens".

### Every later release

1. Add notes under `## Unreleased` in `CHANGELOG.md` as work merges (keep the
   `<!-- next: X.Y.Z -->` marker on the version you plan; the harness check reads it).
2. `npm run release:patch|minor|major` from a clean, green `main`.
3. When `publish.yml` waits, approve it: Actions, the Publish package run, Review deployments,
   `release`, Approve and deploy. npm, the docs and the GitHub release follow.

### When something fails

- **Release pull request checks fail.** Nothing is published and `main` is unchanged: fix it on
  the `release/X.Y.Z` branch, or close the pull request and delete the branch.
- **`test` or `publish` fails** (flaky runner, npm outage). `main` says X, npm does not have it:
  Re-run failed jobs. The publish script skips a version that is already on npm.
- **A bug is found after the merge, before you approve.** Reject the deployment, merge the fix,
  then Actions, Publish package, Run workflow: X is still not on npm, so the fixed `main` is
  published as X. No version is burned.
- **Published, but `docs` or `release` fails.** npm has X: Re-run failed jobs, or Run workflow
  (it finds X on npm and only finishes). The release job checks `gh release view` first.
- **A bad version is on npm.** `npm deprecate mantine-doc-viewer@X "reason"`, then release
  X+1. Never unpublish.
- **Trusted publishing is not set up** (`npm publish` fails with a 404 or an auth error in the
  publish job). Run the `npm trust github ...` command above, then Re-run failed jobs.

Between the merge and your approval, `main` says X while npm still has the previous version. Only
the repository is ahead, never npm, and the docs are not deployed until the publish succeeds.

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

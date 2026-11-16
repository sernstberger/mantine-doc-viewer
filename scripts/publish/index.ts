/**
 * Publishes package/ to npm. Mantine's scripts/publish reduced to one package. In CI the
 * unprivileged `test` job packs the tarball and the `publish` job only uploads it; the first
 * version is published by hand (`npm run publish:bootstrap`), because npm can trust a workflow
 * only for a package that exists.
 *
 *   tsx scripts/publish --plan         CI: writes the run plan to GITHUB_OUTPUT
 *   tsx scripts/publish --notes FILE   CI: writes the CHANGELOG section of the version to FILE
 *   tsx scripts/publish --pack DIR     CI: packs the built package, with README, LICENSE, gitHead
 *   tsx scripts/publish --bootstrap    by hand, first version only: install, build, publish
 *   tsx scripts/publish --dry-run      builds and runs `npm publish --dry-run`, publishes nothing
 */
import fs from 'fs-extra';
import signale from 'signale';
import { simpleGit } from 'simple-git';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $ } from 'zx';
import { getChangelogSection } from './changelog-section';
import { decidePublish, planRun, releaseTarget } from './decide-publish';
import { getGitHead, getLatestVersion, getPublishedVersions } from './registry';
import { resolveDistTag, wouldMoveLatestBackward } from './resolve-dist-tag';
import { matchesNvmrc, withGitHead } from './toolchain';
import path from 'node:path';

const CI_WORKFLOW = 'npm test';
const root = process.cwd();
const packageDir = path.join(root, 'package');
const packageJsonPath = path.join(packageDir, 'package.json');

const argv = yargs(hideBin(process.argv))
  .option('plan', { type: 'boolean', default: false })
  .option('notes', { type: 'string' })
  .option('pack', { type: 'string' })
  .option('bootstrap', { type: 'boolean', default: false })
  .option('dry-run', { type: 'boolean', default: false })
  .check((args) => {
    const modes = [args.plan, args.notes, args.pack, args.bootstrap, args.dryRun].filter(Boolean);

    if (modes.length !== 1) {
      throw new Error('Pass exactly one of --plan, --notes, --pack, --bootstrap, --dry-run');
    }

    return true;
  })
  .strict()
  .parseSync();

interface PackageInfo {
  name: string;
  version: string;
}

function fail(message: string): never {
  signale.error(message);
  process.exit(1);
}

function readNotes(version: string) {
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const notes = getChangelogSection(changelog, version);

  if (!notes) {
    fail(`CHANGELOG.md has no notes under "## ${version}": the release script writes that heading`);
  }

  return notes;
}

async function assertLatestMovesForward({ name, version }: PackageInfo) {
  if (
    resolveDistTag(version) === 'latest' &&
    wouldMoveLatestBackward(version, await getLatestVersion(name))
  ) {
    fail(`${name}@${version} is older than the latest version on npm, nothing was published`);
  }
}

async function writePlan(info: PackageInfo) {
  const { name, version } = info;
  const decision = decidePublish(version, await getPublishedVersions(name));
  const plan = planRun(decision, process.env.GITHUB_EVENT_NAME ?? '', version);
  const gitHead = decision === 'skip-already-published' ? await getGitHead(name, version) : null;
  const sha = releaseTarget(decision, process.env.GITHUB_SHA ?? '', gitHead) ?? '';

  if (plan.publish) {
    await assertLatestMovesForward(info);
  }

  if (plan.finish) {
    readNotes(version);
  }

  const node = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
  const outputs = { name, version, decision, ...plan, tag: resolveDistTag(version), sha, node };
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join(''));
  }

  signale.info(lines.join(', ').replace(/\n/g, ''));
}

function copyPackageFiles() {
  for (const file of ['README.md', 'LICENSE']) {
    fs.copyFileSync(path.join(root, file), path.join(packageDir, file));
  }
}

async function withRecordedGitHead<T>(sha: string, action: () => Promise<T>): Promise<T> {
  const original = fs.readFileSync(packageJsonPath, 'utf8');
  fs.writeFileSync(packageJsonPath, withGitHead(original, sha));

  try {
    return await action();
  } finally {
    fs.writeFileSync(packageJsonPath, original);
  }
}

async function pack(destination: string) {
  const sha = process.env.GITHUB_SHA ?? (await simpleGit().revparse(['HEAD'])).trim();
  fs.ensureDirSync(destination);
  copyPackageFiles();

  await withRecordedGitHead(
    sha,
    () => $({ cwd: packageDir, stdio: 'inherit' })`npm pack --pack-destination ${destination}`
  );
}

async function assertBootstrapReady(decision: string) {
  if (decision !== 'skip-not-on-registry') {
    fail('The package is already on npm: later versions are published by publish.yml');
  }

  const nvmrc = fs.readFileSync(path.join(root, '.nvmrc'), 'utf8');

  if (!matchesNvmrc(process.version, nvmrc)) {
    fail(`Node ${process.version} is running, .nvmrc asks for ${nvmrc.trim()}: run nvm use`);
  }

  const git = simpleGit();
  await git.fetch('origin', 'main');
  const head = (await git.revparse(['HEAD'])).trim();
  const main = (await git.revparse(['origin/main'])).trim();

  if (head !== main) {
    fail('Publish the merged release commit: git switch main && git pull, then run this again');
  }

  if (!(await git.status()).isClean()) {
    fail('Working tree is not clean, nothing was published');
  }

  const runs: { conclusion: string }[] = JSON.parse(
    (await $`gh run list --commit ${head} --workflow ${CI_WORKFLOW} --json conclusion`.quiet())
      .stdout
  );

  if (runs.length === 0 || runs.some((ciRun) => ciRun.conclusion !== 'success')) {
    fail(`The "${CI_WORKFLOW}" workflow is not green for ${head}, nothing was published`);
  }

  await $({ stdio: 'inherit' })`yarn install --immutable`;

  return head;
}

async function buildAndPublish(info: PackageInfo, sha: string, dryRun: boolean) {
  await assertLatestMovesForward(info);
  await $({ stdio: 'inherit' })`npm run build`;
  await $({ stdio: 'inherit' })`npm run check:exports`;
  copyPackageFiles();

  const flags = ['--access', 'public', '--tag', resolveDistTag(info.version)];

  if (dryRun) {
    flags.push('--dry-run');
  }

  await withRecordedGitHead(
    sha,
    () => $({ cwd: packageDir, stdio: 'inherit' })`npm publish ${flags}`
  );

  signale.success(`${dryRun ? '[dry run] ' : ''}${info.name}@${info.version} published`);
}

async function main() {
  const info: PackageInfo = fs.readJsonSync(packageJsonPath);

  if (argv.notes) {
    fs.writeFileSync(argv.notes, `${readNotes(info.version)}\n`);
    return;
  }

  if (argv.pack) {
    await pack(argv.pack);
    return;
  }

  if (argv.plan) {
    await writePlan(info);
    return;
  }

  const decision = decidePublish(info.version, await getPublishedVersions(info.name));
  signale.info(`${info.name}@${info.version}: ${decision}`);

  if (argv.dryRun) {
    await buildAndPublish(info, (await simpleGit().revparse(['HEAD'])).trim(), true);
    return;
  }

  await buildAndPublish(info, await assertBootstrapReady(decision), false);
}

main().catch((error) => {
  signale.error(`Publish failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

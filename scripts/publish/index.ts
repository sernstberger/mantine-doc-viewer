/**
 * Publishes package/ to npm, from CI (`publish.yml`) or by hand for the first release
 * (`npm run publish:bootstrap`). Mantine's scripts/publish reduced to one package.
 *
 *   tsx scripts/publish               CI: publish the version when it is new on npm, else skip
 *   tsx scripts/publish --bootstrap   by hand: also checks HEAD is origin/main, clean and green
 *   tsx scripts/publish --dry-run     builds and runs `npm publish --dry-run`, publishes nothing
 *   tsx scripts/publish --plan        CI: writes version, decision and the plan to GITHUB_OUTPUT
 *   tsx scripts/publish --notes FILE  CI: writes the CHANGELOG section of the version to FILE
 */
import fs from 'fs-extra';
import signale from 'signale';
import { simpleGit } from 'simple-git';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $ } from 'zx';
import { getChangelogSection } from './changelog-section';
import { decidePublish, planRun } from './decide-publish';
import { getLatestVersion, getPublishedVersions } from './registry';
import { resolveDistTag, wouldMoveLatestBackward } from './resolve-dist-tag';
import path from 'node:path';

const CI_WORKFLOW = 'npm test';
const root = process.cwd();
const packageDir = path.join(root, 'package');

const argv = yargs(hideBin(process.argv))
  .option('bootstrap', { type: 'boolean', default: false })
  .option('dry-run', { type: 'boolean', default: false })
  .option('plan', { type: 'boolean', default: false })
  .option('notes', { type: 'string' })
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

async function writePlan({ name, version }: PackageInfo) {
  const decision = decidePublish(version, await getPublishedVersions(name));
  const plan = planRun(decision, process.env.GITHUB_EVENT_NAME ?? '', version);

  if (plan.finish) {
    readNotes(version);
  }

  const outputs = { version, decision, ...plan };
  const lines = Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, lines.join(''));
  }

  signale.info(`${name}@${version}: ${lines.join(', ').replace(/\n/g, '')}`);
}

async function assertBootstrapReady() {
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
}

async function publish({ name, version }: PackageInfo) {
  const tag = resolveDistTag(version);

  if (tag === 'latest' && wouldMoveLatestBackward(version, await getLatestVersion(name))) {
    fail(`${name}@${version} is older than the latest version on npm, nothing was published`);
  }

  await $({ stdio: 'inherit' })`npm run build`;
  await $({ stdio: 'inherit' })`npm run check:exports`;

  for (const file of ['README.md', 'LICENSE']) {
    await fs.copyFile(path.join(root, file), path.join(packageDir, file));
  }

  const flags = ['--access', 'public', '--tag', tag];

  if (process.env.GITHUB_ACTIONS === 'true') {
    flags.push('--provenance');
  }

  if (argv.dryRun) {
    flags.push('--dry-run');
  }

  await $({ cwd: packageDir, stdio: 'inherit' })`npm publish ${flags}`;
  signale.success(`${argv.dryRun ? '[dry run] ' : ''}${name}@${version} published as ${tag}`);
}

async function main() {
  const info: PackageInfo = fs.readJsonSync(path.join(packageDir, 'package.json'));

  if (argv.notes) {
    fs.writeFileSync(argv.notes, `${readNotes(info.version)}\n`);
    return;
  }

  if (argv.plan) {
    await writePlan(info);
    return;
  }

  const decision = decidePublish(info.version, await getPublishedVersions(info.name));
  signale.info(`${info.name}@${info.version}: ${decision}`);

  if (argv.dryRun) {
    await publish(info);
    return;
  }

  if (decision === 'skip-already-published') {
    signale.info('Already on npm, nothing to publish');
    return;
  }

  if (argv.bootstrap) {
    await assertBootstrapReady();
  } else if (decision === 'skip-not-on-registry') {
    fail('The package is not on npm yet: publish the first version with npm run publish:bootstrap');
  }

  await publish(info);
}

main().catch((error) => {
  signale.error(`Publish failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

/**
 * Opens the `[release] Version: X` pull request with auto-merge. It publishes nothing: once the
 * pull request merges, `.github/workflows/publish.yml` publishes after the `release` approval.
 *
 *   npm run release:patch | release:minor | release:major   (add `-- --stage alpha` for a prerelease)
 */
import chalk from 'chalk';
import fs from 'fs-extra';
import signale from 'signale';
import SimpleGit from 'simple-git';
import { getNextVersion, VersionIncrement, VersionStage } from 'version-next';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { $ } from 'zx';
import { releaseChangelog } from './publish/changelog-section';
import { getLatestPublisher, getPublishedVersions } from './publish/registry';
import {
  githubRepo,
  isTrustedPublisher,
  revokeCommands,
  trustCommand,
  trustStatus,
} from './publish/trust';
import { run } from './run';
import { updateVersion } from './update-version';
import path from 'node:path';

const CI_WORKFLOW = 'npm test';
const packageJsonPath = path.join(process.cwd(), 'package/package.json');
const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
const packageJson = fs.readJsonSync(packageJsonPath);
const { argv } = yargs(hideBin(process.argv)) as any;
const git = SimpleGit();

const versionIncrement: VersionIncrement = argv._[0] || 'patch';
const versionStage: VersionStage | undefined = argv.stage;

function fail(message: string): never {
  signale.error(message);
  process.exit(1);
}

async function assertReleasable(headSha: string, nextVersion: string, branch: string) {
  const ciRuns = JSON.parse(
    (await $`gh run list --commit ${headSha} --workflow ${CI_WORKFLOW} --json status,conclusion`)
      .stdout
  ) as { status: string; conclusion: string }[];

  if (ciRuns.length === 0 || ciRuns.some((ciRun) => ciRun.conclusion !== 'success')) {
    fail(
      `CI is not green for ${headSha} (runs: ${JSON.stringify(ciRuns)}). Wait for the "${CI_WORKFLOW}" workflow on main to succeed.`
    );
  }

  const publishedVersions = await getPublishedVersions(packageJson.name);

  if (publishedVersions?.includes(nextVersion)) {
    fail(`${packageJson.name}@${nextVersion} is already on npm`);
  }

  if ((await git.listRemote(['--tags', 'origin', nextVersion])).trim() !== '') {
    fail(`The tag ${nextVersion} already exists on origin`);
  }

  if ((await git.branchLocal()).all.includes(branch)) {
    fail(`The branch ${branch} exists locally from an earlier attempt: git branch -D ${branch}`);
  }

  if ((await git.listRemote(['--heads', 'origin', branch])).trim() !== '') {
    fail(`The branch ${branch} exists on origin: close its pull request and delete the branch`);
  }

  return publishedVersions !== null;
}

async function checkTrustedPublisher() {
  if (isTrustedPublisher(await getLatestPublisher(packageJson.name))) {
    return;
  }

  const repo = githubRepo(packageJson.repository.url);
  signale.info('No version was published by CI yet: checking the npm trusted publisher');
  const list = await $({ stdio: ['inherit', 'pipe', 'inherit'] })`npm trust list ${
    packageJson.name
  } --json`.nothrow();
  const status = trustStatus(list.stdout, new Date());
  const messages = {
    missing: `No trusted publisher: publish.yml cannot publish until you run\n  ${trustCommand(packageJson.name, repo)}\nthen approve the release within 2 days`,
    expired: `The trusted publisher expired (it did not publish within 2 days of its creation). Replace it, then approve the release within 2 days:\n  ${revokeCommands(packageJson.name, repo).join('\n  ')}`,
    unknown: `Could not read npm trust list (needs npm 11.15 or later and npm login). Check it before approving; a publisher that has not published expires 2 days after its creation:\n  ${revokeCommands(packageJson.name, repo).join('\n  ')}`,
    configured: `A trusted publisher is configured. It expires if it does not publish within 2 days of its creation: approve the release in that window, or replace it:\n  ${revokeCommands(packageJson.name, repo).join('\n  ')}`,
  };

  signale[status === 'configured' ? 'info' : 'warn'](messages[status]);
}

async function release() {
  if ((await git.branchLocal()).current !== 'main') {
    fail('Run the release from main');
  }

  await run(git.pull(), {
    info: 'Pulling the latest changes from the remote repository',
    success: 'The latest changes have been pulled from the remote repository',
    error: 'Failed to pull the latest changes from the remote repository',
  });

  if (!(await git.status()).isClean()) {
    fail('Working directory is not clean, commit all changes before releasing.');
  }

  const headSha = (await git.revparse(['HEAD'])).trim();
  const nextVersion = getNextVersion(packageJson.version, {
    type: versionIncrement,
    stage: versionStage,
  });

  signale.info(
    `Releasing ${chalk.cyan(packageJson.name)}: ${chalk.cyan(packageJson.version)} → ${chalk.cyan(nextVersion)}`
  );

  const branch = `release/${nextVersion}`;
  const title = `[release] Version: ${nextVersion}`;
  const isOnNpm = await assertReleasable(headSha, nextVersion, branch);
  const today = new Date().toISOString().slice(0, 10);
  const changelog = releaseChangelog(await fs.readFile(changelogPath, 'utf8'), nextVersion, today);

  await git.checkoutLocalBranch(branch);
  await fs.writeFile(changelogPath, changelog);
  await updateVersion(nextVersion);
  await git.add([packageJsonPath, changelogPath]);
  await git.commit(title);
  await git.push(['-u', 'origin', branch]);

  await run(
    $`gh pr create --base main --head ${branch} --title ${title} --body ${`Bumps the version to ${nextVersion} and dates its CHANGELOG section. When this merges, publish.yml waits for the release approval, then publishes to npm, deploys the docs and creates the GitHub release.`} && gh pr merge ${branch} --auto --squash --delete-branch`,
    {
      info: 'Opening the version pull request with auto-merge',
      success: 'Version pull request opened; it merges once CI is green',
      error: `Failed to open the version pull request: open it by hand from ${branch}`,
    }
  );

  await git.checkout('main');

  if (isOnNpm) {
    await checkTrustedPublisher();
  }

  signale.success(
    `When the pull request merges, approve the "release" deployment in Actions → Publish package`
  );
}

release().catch((error) => {
  signale.error(`Release failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

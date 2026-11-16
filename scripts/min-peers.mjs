// Shared by every Mantine lib on the harness: keep this file identical across repos.
// Tests the lowest versions a package promises in `peerDependencies`.
//
//   node scripts/min-peers.mjs            prints the floor of each peer range
//   node scripts/min-peers.mjs --apply    pins the repo root's dependencies to those floors,
//                                         installs, and checks the installed versions
//
// `--apply` changes the package.json files (root and workspaces) and the lockfile: run it in CI or a scratch copy, then build and
// test. Options: `--package package/package.json` (where the peers are declared) and
// `--root package.json` (where the dependencies are pinned). No dependencies: Node only.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const packageFile = option('--package', 'package/package.json');
const rootFile = option('--root', 'package.json');
const apply = args.includes('--apply');

const VERSION = /^(\d+)(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(-[0-9A-Za-z.-]+)?$/;

/** `^9.8.0` -> `9.8.0`; `9.x` -> `9.0.0`; `>=18 <20` -> `18.0.0` */
function floorOfComparator(token) {
  const bare = token.replace(/^(\^|~|>=|=|v)/, '');
  const match = VERSION.exec(bare);

  if (!match || /^[<>]/.test(token)) {
    throw new Error(`Cannot read "${token}" as a lower bound`);
  }

  const [, major, minor, patch, pre = ''] = match;
  const number = (part) => (part === undefined || /[xX*]/.test(part) ? 0 : Number(part));
  return `${major}.${number(minor)}.${number(patch)}${pre}`;
}

const parts = (version) => version.split('-')[0].split('.').map(Number);

function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/** The lowest version a semver range allows: the lowest of its `||` alternatives */
function floorOf(range) {
  const floors = range
    .split('||')
    .map((alternative) => alternative.trim())
    .filter((alternative) => alternative && alternative !== '*' && alternative !== 'x')
    .map((alternative) => {
      const hyphen = /^(\S+)\s+-\s+\S+$/.exec(alternative);
      const tokens = (hyphen ? [hyphen[1]] : alternative.split(/\s+/)).filter(
        (token) => !/^(<|<=)/.test(token)
      );
      // Several lower bounds in one alternative (">=1 >=2"): the highest applies
      return tokens.map(floorOfComparator).sort(compare).at(-1);
    })
    .filter(Boolean);

  if (floors.length === 0) {
    return null;
  }

  return floors.sort(compare)[0];
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const peers = readJson(packageFile).peerDependencies ?? {};
const floors = Object.fromEntries(
  Object.entries(peers)
    .map(([name, range]) => [name, floorOf(range)])
    .filter(([, floor]) => floor)
);

if (Object.keys(floors).length === 0) {
  console.error(`No peerDependencies with a lower bound in ${packageFile}`);
  process.exit(1);
}

for (const [name, floor] of Object.entries(floors)) {
  console.log(`${name}@${floor}  (peer range ${peers[name]})`);
}

if (!apply) {
  process.exit(0);
}

// Mantine packages are released in lockstep, so the others the repo installs follow core
const lockstep = floors['@mantine/core'];
const root = readJson(rootFile);
const rootDir = path.dirname(path.resolve(rootFile));
const sections = ['dependencies', 'devDependencies', 'optionalDependencies'];

/** package.json of the root and of each workspace (`docs`, `apps/*`), but not the package itself */
function manifests() {
  const workspaces = Array.isArray(root.workspaces)
    ? root.workspaces
    : (root.workspaces?.packages ?? []);
  const dirs = workspaces.flatMap((pattern) => {
    if (!pattern.endsWith('/*')) {
      return [path.join(rootDir, pattern)];
    }

    const parent = path.join(rootDir, pattern.slice(0, -2));
    return fs.existsSync(parent)
      ? fs.readdirSync(parent).map((name) => path.join(parent, name))
      : [];
  });

  return [rootFile, ...dirs.map((dir) => path.join(dir, 'package.json'))].filter(
    (file) => fs.existsSync(file) && path.resolve(file) !== path.resolve(packageFile)
  );
}

for (const file of manifests()) {
  const manifest = path.resolve(file) === path.resolve(rootFile) ? root : readJson(file);

  for (const [name, floor] of Object.entries(floors)) {
    const section = sections.find((key) => manifest[key]?.[name]);

    if (section) {
      manifest[section][name] = floor;
    } else if (manifest === root) {
      manifest.devDependencies = { ...manifest.devDependencies, [name]: floor };
    }
  }

  for (const section of sections) {
    for (const name of Object.keys(manifest[section] ?? {})) {
      if (
        lockstep &&
        name.startsWith('@mantine/') &&
        !(name in floors) &&
        /^\d/.test(manifest[section][name])
      ) {
        manifest[section][name] = lockstep;
      }
    }
  }

  fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
}

const dir = rootDir;
const has = (file) => fs.existsSync(path.join(dir, file));
const [command, installArgs] = has('yarn.lock')
  ? ['yarn', ['install', '--no-immutable']]
  : has('pnpm-lock.yaml')
    ? ['pnpm', ['install', '--no-frozen-lockfile']]
    : ['npm', ['install']];
execFileSync(command, installArgs, { cwd: dir, stdio: 'inherit' });

const wrong = Object.entries(floors).filter(([name, floor]) => {
  const installed = readJson(path.join(dir, 'node_modules', name, 'package.json')).version;
  console.log(`installed ${name}@${installed}`);
  return installed !== floor;
});

if (wrong.length > 0) {
  console.error(`Not installed at the floor: ${wrong.map(([name]) => name).join(', ')}`);
  process.exit(1);
}

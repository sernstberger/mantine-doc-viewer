// Shared by every Mantine lib on the harness: keep this file identical across repos.
// Tests the lowest versions a package promises in `peerDependencies`.
//
//   node scripts/min-peers.mjs            prints the floor of each peer range: the lowest
//                                         version published to npm that the range allows
//   node scripts/min-peers.mjs --apply    pins every manifest's dependencies to those floors
//                                         (root, workspaces, and the package's devDependencies),
//                                         installs, and checks the installed versions
//
// `--apply` changes the package.json files and the lockfile: run it in CI or a scratch copy, then
// docgen, build and test. Options: `--package package/package.json` (where the peers are declared)
// and `--root package.json` (where the dependencies are pinned). Node only, plus `npm view`.
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

/**
 * The lowest version on npm that `range` allows: `^6.5.0` may name a version never published
 * (pdfjs-dist went from 6.4.x to 6.5.438)
 */
function lowestPublished(name, range) {
  const output = execFileSync('npm', ['view', `${name}@${range}`, 'version', '--json'], {
    encoding: 'utf8',
  }).trim();
  const versions = output ? [JSON.parse(output)].flat() : [];

  if (versions.length === 0) {
    throw new Error(`No published version of ${name} satisfies "${range}"`);
  }

  return versions.sort(compare)[0];
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const peers = readJson(packageFile).peerDependencies ?? {};
const floors = Object.fromEntries(
  Object.entries(peers)
    .filter(([, range]) => floorOf(range))
    .map(([name, range]) => [name, lowestPublished(name, range)])
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
const shipped = new Set(Object.keys(readJson(packageFile).dependencies ?? {}));

/**
 * package.json of the root, of each workspace (`docs`, `apps/*`) and of the package itself: a
 * package devDependency left above the floor installs a second React (hooks break)
 */
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

  const files = [rootFile, packageFile, ...dirs.map((dir) => path.join(dir, 'package.json'))];
  return [...new Set(files.map((file) => path.resolve(file)))].filter((file) =>
    fs.existsSync(file)
  );
}

for (const file of manifests()) {
  const isRoot = file === path.resolve(rootFile);
  const manifest = isRoot ? root : readJson(file);
  // The package's own peerDependencies and dependencies are what it publishes: only its dev tooling moves
  const own = file === path.resolve(packageFile) ? ['devDependencies'] : sections;

  for (const [name, floor] of Object.entries(floors)) {
    const section = own.find((key) => manifest[key]?.[name]);

    if (section) {
      manifest[section][name] = floor;
    } else if (isRoot) {
      manifest.devDependencies = { ...manifest.devDependencies, [name]: floor };
    }
  }

  for (const section of own) {
    for (const name of Object.keys(manifest[section] ?? {})) {
      if (
        lockstep &&
        name.startsWith('@mantine/') &&
        !(name in floors) &&
        !shipped.has(name) &&
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

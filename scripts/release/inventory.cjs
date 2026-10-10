'use strict';
const fs = require('node:fs');
const path = require('node:path');
const semver = require('semver');
const inventory = require('./inventory.json');
const REPOSITORY = 'git+https://github.com/konnilabs/xtend.git';
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
function check(condition, message) { if (!condition) throw Error(message); }
function relativePath(value, rootAllowed = false) {
  check(typeof value === 'string' && ((rootAllowed && value === '.') ||
    value.length > 0 && !/[\\\u0000-\u001f\u007f]/.test(value) && !value.startsWith('/') && !/^[A-Za-z]:/.test(value) &&
    value.split('/').every(part => part !== '' && part !== '.' && part !== '..')), `Unsafe relative path: ${value}`);
  return value;
}
function publicPackage(manifest) {
  return manifest.private !== true && /^@[^/]+\/[^/]+$/.test(manifest.name || '');
}
function discover(rootDir, root) {
  check(Array.isArray(root.workspaces), 'Explicit workspace array required');
  const directories = ['.', ...root.workspaces.map(value => {
    relativePath(value); check(!/[?*{}]/.test(value), `Explicit workspace path required: ${value}`); return value;
  })];
  check(new Set(directories).size === directories.length, 'Duplicate workspace path');
  return directories.map(directory => ({ path: directory, manifest: readJson(path.join(rootDir, directory, 'package.json')) }))
    .filter(entry => publicPackage(entry.manifest));
}
function edges(packages) {
  const byName = new Map(packages.map(entry => [entry.name, entry]));
  return packages.flatMap(entry => ['dependencies', 'optionalDependencies', 'peerDependencies'].flatMap(kind =>
    Object.entries(entry.manifest[kind] || {}).filter(([name]) => byName.has(name)).map(([name, range]) => {
      const hard = kind === 'dependencies' && !Object.hasOwn(entry.manifest.optionalDependencies || {}, name) ||
        kind === 'peerDependencies' && entry.manifest.peerDependenciesMeta?.[name]?.optional !== true;
      check(semver.validRange(range) && semver.satisfies(byName.get(name).version, range),
        `Unsatisfied internal dependency: ${entry.name} -> ${name}@${range} (artifact ${byName.get(name).version})`);
      return { from: entry.name, to: name, range, kind, hard };
    })));
}
function orderPackages(packages, dependencyEdges = edges(packages)) {
  const done = new Set(), ordered = [];
  while (ordered.length < packages.length) {
    const ready = packages.find(entry => !done.has(entry.name) &&
      dependencyEdges.filter(edge => edge.from === entry.name && edge.hard).every(edge => done.has(edge.to)));
    check(ready, `Hard dependency cycle: ${packages.filter(entry => !done.has(entry.name)).map(entry => entry.name).join(', ')}`);
    done.add(ready.name); ordered.push(ready);
  }
  return ordered;
}
function loadInventory(rootDir, specification = inventory) {
  check(specification.schema === inventory.schema && Array.isArray(specification.packages), 'Invalid release inventory');
  const root = readJson(path.join(rootDir, 'package.json'));
  const found = discover(rootDir, root);
  const names = new Set(), paths = new Set();
  const packages = specification.packages.map(entry => {
    relativePath(entry.path, true);
    check(!names.has(entry.name) && !paths.has(entry.path), `Duplicate release package: ${entry.name}`);
    names.add(entry.name); paths.add(entry.path);
    const manifest = readJson(path.join(rootDir, entry.path, 'package.json'));
    check(publicPackage(manifest) && manifest.name === entry.name, `Private or mismatched package: ${entry.name}`);
    check(found.some(item => item.path === entry.path && item.manifest.name === entry.name), `Package outside root/workspaces: ${entry.name}`);
    check(semver.valid(manifest.version) === manifest.version, `Invalid package version: ${entry.name}`);
    check(manifest.publishConfig?.access === 'public' && manifest.publishConfig?.provenance === true,
      `Public provenance policy missing: ${entry.name}`);
    check(manifest.repository?.type === 'git' && manifest.repository.url === REPOSITORY &&
      (entry.path === '.' || manifest.repository.directory === entry.path), `Repository metadata mismatch: ${entry.name}`);
    check(['core', 'material', 'mcp'].includes(entry.group), `Unknown release group: ${entry.name}`);
    return { ...entry, version: manifest.version, manifest };
  });
  check(found.length === packages.length && found.every(item => names.has(item.manifest.name) && paths.has(item.path)),
    'Public package discovery differs from release inventory (new or omitted package)');
  check(Array.isArray(root.scopedPackages) && root.scopedPackages.length === packages.length &&
    new Set(root.scopedPackages.map(entry => entry.name)).size === packages.length &&
    new Set(root.scopedPackages.map(entry => entry.path)).size === packages.length &&
    root.scopedPackages.every(entry => packages.some(item => item.name === entry.name && item.path === entry.path)),
    'package.json#scopedPackages differs from release inventory');
  for (const group of ['core', 'material']) {
    check(new Set(packages.filter(entry => entry.group === group).map(entry => entry.version)).size === 1,
      `Existing ${group} version group diverged`);
  }
  const policy = require('../../security/supply-chain-gate-policy');
  const core = packages.filter(entry => entry.group === 'core');
  check(policy.SCOPED_RELEASE_PACKAGES.length === core.length && policy.SCOPED_RELEASE_PACKAGES.every(entry =>
    core.some(item => item.name === entry.name && item.path === entry.path)), 'Legacy version-sync train differs from Core release group');
  const dependencyEdges = edges(packages);
  return { packages, edges: dependencyEdges, order: orderPackages(packages, dependencyEdges).map(entry => entry.name) };
}
module.exports = { REPOSITORY, check, readJson, relativePath, loadInventory, edges, orderPackages };

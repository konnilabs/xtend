#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
  SCOPED_RELEASE_PACKAGES
} = require('../security/supply-chain-gate-policy');

const INTERNAL_PACKAGE_NAMES = new Set(SCOPED_RELEASE_PACKAGES.map((entry) => entry.name));
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function syncDependencyVersions(manifest, version) {
  let changed = false;
  DEPENDENCY_SECTIONS.forEach((section) => {
    if (!manifest[section] || typeof manifest[section] !== 'object') return;
    Object.keys(manifest[section]).forEach((name) => {
      if (!INTERNAL_PACKAGE_NAMES.has(name)) return;
      if (manifest[section][name] === version) return;
      manifest[section][name] = version;
      changed = true;
    });
  });
  return changed;
}

function syncManifest(filePath, version) {
  const manifest = readJson(filePath);
  let changed = false;
  if (manifest.version !== version) {
    manifest.version = version;
    changed = true;
  }
  changed = syncDependencyVersions(manifest, version) || changed;
  return { manifest, changed };
}

function workspaceManifestPaths(rootDir, rootManifest) {
  const workspaces = Array.isArray(rootManifest.workspaces) ? rootManifest.workspaces : [];
  return workspaces
    .filter((workspacePath) => typeof workspacePath === 'string' && !workspacePath.includes('*'))
    .map((workspacePath) => path.join(rootDir, workspacePath, 'package.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function syncWorkspaceDependencyVersions(rootDir, rootManifest, version, options = {}) {
  const files = [];
  workspaceManifestPaths(rootDir, rootManifest).forEach((filePath) => {
    const manifest = readJson(filePath);
    if (!syncDependencyVersions(manifest, version)) return;
    files.push(path.relative(rootDir, filePath));
    if (!options.check) writeJson(filePath, manifest);
  });
  return files;
}

function syncPackageLock(rootDir, rootManifest, version) {
  const filePath = path.join(rootDir, 'package-lock.json');
  if (!fs.existsSync(filePath)) return null;
  const lock = readJson(filePath);
  let changed = false;
  if (lock.version !== version) {
    lock.version = version;
    changed = true;
  }
  const packages = lock.packages || {};
  SCOPED_RELEASE_PACKAGES.forEach((entry) => {
    const key = entry.path === '.' ? '' : entry.path;
    const record = packages[key];
    if (!record) return;
    if (record.version !== version) {
      record.version = version;
      changed = true;
    }
    changed = syncDependencyVersions(record, version) || changed;
  });
  const workspaces = Array.isArray(rootManifest.workspaces) ? rootManifest.workspaces : [];
  workspaces
    .filter((workspacePath) => typeof workspacePath === 'string' && !workspacePath.includes('*'))
    .forEach((workspacePath) => {
      const record = packages[workspacePath];
      if (!record) return;
      changed = syncDependencyVersions(record, version) || changed;
    });
  return { filePath, lock, changed };
}

function syncXtendPackageVersions(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const rootManifestPath = path.join(rootDir, 'package.json');
  const rootManifest = readJson(rootManifestPath);
  const version = rootManifest.version;
  const files = [];

  SCOPED_RELEASE_PACKAGES.forEach((entry) => {
    const filePath = path.join(rootDir, entry.manifest);
    const result = syncManifest(filePath, version);
    if (result.changed) {
      files.push(path.relative(rootDir, filePath));
      if (!options.check) writeJson(filePath, result.manifest);
    }
  });

  syncWorkspaceDependencyVersions(rootDir, rootManifest, version, options).forEach((filePath) => {
    if (!files.includes(filePath)) files.push(filePath);
  });

  const lockResult = syncPackageLock(rootDir, rootManifest, version);
  if (lockResult && lockResult.changed) {
    files.push(path.relative(rootDir, lockResult.filePath));
    if (!options.check) writeJson(lockResult.filePath, lockResult.lock);
  }

  return {
    schema: 'xtend.release.package-version-sync-report.v1',
    ok: files.length === 0,
    version,
    changedFiles: files
  };
}

function main(argv = process.argv.slice(2)) {
  const check = argv.includes('--check');
  const json = argv.includes('--json');
  const report = syncXtendPackageVersions({ check });
  if (json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.changedFiles.length === 0) {
    process.stdout.write(`XTend package versions already synced at ${report.version}.\n`);
  } else if (check) {
    process.stdout.write(`XTend package version drift detected for ${report.version}:\n`);
    report.changedFiles.forEach((filePath) => process.stdout.write(`- ${filePath}\n`));
  } else {
    process.stdout.write(`XTend package versions synced to ${report.version}:\n`);
    report.changedFiles.forEach((filePath) => process.stdout.write(`- ${filePath}\n`));
  }
  if (check && report.changedFiles.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  syncXtendPackageVersions
};

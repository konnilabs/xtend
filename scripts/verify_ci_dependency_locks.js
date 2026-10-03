#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPORT_SCHEMA = 'xtend.ci.dependency-lock-alignment-report.v1';
const PRODUCT_LOCK_PATHS = [
  'products/xtend-llm',
  'products/resumability-maraca-erp-demo'
];
const LOCKED_MANIFEST_SECTIONS = [
  'dependencies',
  'optionalDependencies',
  'peerDependencies',
  'peerDependenciesMeta'
];
const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeValue(value) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [
        key,
        entry && typeof entry === 'object' && !Array.isArray(entry)
          ? normalizeValue(entry)
          : entry
      ])
  );
}

function valuesMatch(left, right) {
  return JSON.stringify(normalizeValue(left)) === JSON.stringify(normalizeValue(right));
}

function resolveLockRecord(lock, dependencyName, productDir) {
  const packages = lock.packages || {};
  const directRecord = packages[`node_modules/${dependencyName}`];
  if (!directRecord || directRecord.link !== true) return directRecord || null;
  const linkedPath = path.resolve(productDir, directRecord.resolved || '');
  const linkedKey = path.relative(productDir, linkedPath).split(path.sep).join('/');
  return packages[linkedKey] || null;
}

function verifyProductLock(rootDir, productPath) {
  const productDir = path.join(rootDir, productPath);
  const manifestPath = path.join(productDir, 'package.json');
  const lockPath = path.join(productDir, 'package-lock.json');
  const errors = [];
  if (!fs.existsSync(manifestPath) || !fs.existsSync(lockPath)) {
    errors.push(`${productPath}: package.json and package-lock.json are required`);
    return { productPath, fileDependencies: 0, errors };
  }

  const manifest = readJson(manifestPath);
  const lock = readJson(lockPath);
  const rootRecord = lock.packages && lock.packages[''];
  for (const section of DEPENDENCY_SECTIONS) {
    if (!valuesMatch(rootRecord && rootRecord[section], manifest[section])) errors.push(`${productPath}: root lock ${section} differs from package.json`);
  }
  const fileDependencies = Object.entries(manifest.dependencies || {})
    .filter(([, specifier]) => typeof specifier === 'string' && specifier.startsWith('file:'));

  fileDependencies.forEach(([dependencyName, specifier]) => {
    const lockedSpecifier = rootRecord && rootRecord.dependencies && rootRecord.dependencies[dependencyName];
    if (lockedSpecifier !== specifier) {
      errors.push(`${productPath}: root lock record for ${dependencyName} must be ${specifier}`);
    }

    const targetDir = path.resolve(productDir, specifier.slice('file:'.length));
    const targetManifestPath = path.join(targetDir, 'package.json');
    if (!fs.existsSync(targetManifestPath)) {
      errors.push(`${productPath}: local dependency ${dependencyName} has no package.json at ${path.relative(rootDir, targetManifestPath)}`);
      return;
    }
    const targetManifest = readJson(targetManifestPath);
    if (targetManifest.name !== dependencyName) {
      errors.push(`${productPath}: ${specifier} resolves to ${targetManifest.name || 'an unnamed package'}, expected ${dependencyName}`);
    }

    const lockRecord = resolveLockRecord(lock, dependencyName, productDir);
    if (!lockRecord) {
      errors.push(`${productPath}: lock record for local dependency ${dependencyName} is missing`);
      return;
    }
    if (lockRecord.version !== targetManifest.version) {
      errors.push(`${productPath}: ${dependencyName} is locked at ${lockRecord.version || 'unknown'}, local package is ${targetManifest.version}`);
    }
    LOCKED_MANIFEST_SECTIONS.forEach((section) => {
      if (!valuesMatch(lockRecord[section], targetManifest[section])) {
        errors.push(`${productPath}: ${dependencyName} lock ${section} differs from its local package manifest`);
      }
    });
  });

  return {
    productPath,
    fileDependencies: fileDependencies.length,
    errors
  };
}

function verifyWorkspaceLock(rootDir) {
  const errors = [];
  const result = { productPath: '.', fileDependencies: 0, errors };
  if (!fs.existsSync(path.join(rootDir, 'package.json')) || !fs.existsSync(path.join(rootDir, 'package-lock.json'))) {
    errors.push('Root package.json and package-lock.json are required');
    return result;
  }
  const manifest = readJson(path.join(rootDir, 'package.json'));
  const lock = readJson(path.join(rootDir, 'package-lock.json'));
  const packages = lock.packages || {};
  const workspaces = Array.isArray(manifest.workspaces) ? manifest.workspaces : manifest.workspaces?.packages || [];
  if (JSON.stringify(packages['']?.workspaces) !== JSON.stringify(manifest.workspaces)) errors.push('Root lock workspace declarations differ from package.json');
  const internal = new Map();
  for (const directory of workspaces) {
    if (/[?*{}]/u.test(directory)) { errors.push(`Unsupported workspace pattern in lock guard: ${directory}`); continue; }
    const file = path.resolve(rootDir, directory, 'package.json');
    if (!file.startsWith(`${path.resolve(rootDir)}${path.sep}`) || !fs.existsSync(file)) { errors.push(`Missing workspace manifest: ${directory}`); continue; }
    const pkg = readJson(file);
    if (internal.has(pkg.name)) errors.push(`Duplicate workspace package: ${pkg.name}`);
    internal.set(pkg.name, directory);
    const link = packages[`node_modules/${pkg.name}`];
    if (!link?.link || path.resolve(rootDir, link.resolved || '') !== path.dirname(file)) errors.push(`Workspace ${pkg.name} must resolve to local ${directory}, not the registry`);
  }
  for (const directory of ['', ...internal.values()]) {
    const pkg = directory ? readJson(path.join(rootDir, directory, 'package.json')) : manifest;
    const record = packages[directory];
    if (!record || record.version !== pkg.version) errors.push(`Lock version differs for ${directory || 'root'}`);
    for (const section of DEPENDENCY_SECTIONS) if (!valuesMatch(record?.[section], pkg[section])) errors.push(`Lock ${section} differs for ${directory || 'root'}`);
  }
  // Nested copies can silently fetch internal peers from npm even when the top-level link is correct.
  for (const [key, record] of Object.entries(packages)) {
    for (const [name, directory] of internal) {
      if (!key.endsWith(`node_modules/${name}`)) continue;
      if (!record.link || path.resolve(rootDir, record.resolved || '') !== path.resolve(rootDir, directory)) errors.push(`Registry or foreign resolution of internal workspace ${name}: ${key}`);
    }
  }
  result.fileDependencies = internal.size;
  return result;
}

function verifyCiDependencyLocks(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const productPaths = options.productPaths || PRODUCT_LOCK_PATHS;
  const products = [verifyWorkspaceLock(rootDir), ...productPaths.map((productPath) => verifyProductLock(rootDir, productPath))];
  const errors = products.flatMap((product) => product.errors);
  return {
    schema: REPORT_SCHEMA,
    ok: errors.length === 0,
    products,
    errors
  };
}

function main(argv = process.argv.slice(2)) {
  const report = verifyCiDependencyLocks();
  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (report.ok) {
    const dependencyCount = report.products.reduce((sum, product) => sum + product.fileDependencies, 0);
    process.stdout.write(`CI dependency locks align with ${dependencyCount} local package references.\n`);
  } else {
    process.stderr.write('CI dependency lock drift detected:\n');
    report.errors.forEach((error) => process.stderr.write(`- ${error}\n`));
    process.stderr.write('Run npm install --prefix <product> --package-lock-only after changing a linked package.\n');
  }
  if (!report.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = {
  LOCKED_MANIFEST_SECTIONS,
  PRODUCT_LOCK_PATHS,
  REPORT_SCHEMA,
  verifyCiDependencyLocks
};

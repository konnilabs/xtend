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

function verifyCiDependencyLocks(options = {}) {
  const rootDir = options.rootDir || path.resolve(__dirname, '..');
  const productPaths = options.productPaths || PRODUCT_LOCK_PATHS;
  const products = productPaths.map((productPath) => verifyProductLock(rootDir, productPath));
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

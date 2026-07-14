'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const RESULT_DIR = path.join(ROOT_DIR, '.xtend-test-results');
const OUTPUT_PATH = path.join(RESULT_DIR, 'xtend-nightly-build-manifest.json');

const COMMANDS = [
  'npm run test:release:full:report',
  'npm run test:rmt-reference-docs:report',
  'npm run test:rkfa-production-closure:report',
  'npm run test:docs-stub-inventory:report',
  'npm run test:rmt-vnext-primitives:report',
  'npm run test:native-first-rmt-owned-release:report',
  'npm run release:report',
  'npm run pack:dry-run',
  'npm pack --workspace xtendrmt --dry-run --json',
  'npm pack --workspace fabric --dry-run --json',
  'npm pack --workspace tools --dry-run --json',
  'npm pack --workspace xtend-builder --dry-run --json',
  'npm pack --workspace xtend-maraca --dry-run --json',
  'npm pack --workspace xsurface-shard --dry-run --json',
  'npm run test:maraca:report',
  'npm run test:xtensions-framework-adapters:report',
  'npm run test:xtend-dev-surface:report',
  'npm run test:docs-quality:report',
  'npm run test:docs-shell-catfooding:report',
  'npm run test:docs-framework-ownership:report',
  'npm run test:xsurface-shard:report',
  'npm run test:xscaler-protocol:report',
  'npm run test:xscaler-source-to-sea:report'
];

const ARTIFACT_PATHS = [
  '.xtend-test-results/xtend-release-gate-report.json',
  '.xtend-test-results/xtend-rmt-reference-docs-report.json',
  '.xtend-test-results/xtend-rkfa-production-closure-report.json',
  '.xtend-test-results/xtend-docs-stub-inventory-report.json',
  '.xtend-test-results/xtend-rmt-vnext-primitives-gate-report.json',
  '.xtend-test-results/xtend-native-first-rmt-owned-release-report.json',
  '.xtend-test-results/xtend-release-report.json',
  '.xtend-test-results/xtend-pack-dry-run.json',
  '.xtend-test-results/xtend-package-export-surface-lock.json',
  '.xtend-test-results/xtend-package-export-lock-report.json',
  '.xtend-test-results/xtend-pack-dry-run-xtendrmt.json',
  '.xtend-test-results/xtend-pack-dry-run-fabric.json',
  '.xtend-test-results/xtend-pack-dry-run-tools.json',
  '.xtend-test-results/xtend-pack-dry-run-xtend-builder.json',
  '.xtend-test-results/xtend-pack-dry-run-xtend-maraca.json',
  '.xtend-test-results/xtend-pack-dry-run-xsurface-shard.json',
  '.xtend-test-results/xtend-maraca-gate-report.json',
  '.xtend-test-results/xtend-xtensions-framework-adapters-report.json',
  '.xtend-test-results/xtend-dev-surface-report.json',
  '.xtend-test-results/xtend-docs-quality-report.json',
  '.xtend-test-results/xtend-docs-shell-catfooding-report.json',
  '.xtend-test-results/xtend-docs-framework-ownership-report.json',
  '.xtend-test-results/xtend-xsurface-shard-report.json',
  '.xtend-test-results/xtend-xscaler-protocol-report.json',
  '.xtend-test-results/xtend-xscaler-source-to-sea-report.json',
  '.xtend-build/maraca/source-to-sea/xtend.maraca.report.json',
  '.xtend-build/maraca/source-to-sea/xtend.maraca.size.json'
];

const REQUIRED_ARTIFACTS = new Set([
  '.xtend-test-results/xtend-release-gate-report.json',
  '.xtend-test-results/xtend-rmt-reference-docs-report.json',
  '.xtend-test-results/xtend-rkfa-production-closure-report.json',
  '.xtend-test-results/xtend-docs-stub-inventory-report.json',
  '.xtend-test-results/xtend-rmt-vnext-primitives-gate-report.json',
  '.xtend-test-results/xtend-native-first-rmt-owned-release-report.json',
  '.xtend-test-results/xtend-pack-dry-run.json',
  '.xtend-test-results/xtend-pack-dry-run-xsurface-shard.json',
  '.xtend-test-results/xtend-maraca-gate-report.json',
  '.xtend-test-results/xtend-xtensions-framework-adapters-report.json',
  '.xtend-test-results/xtend-dev-surface-report.json',
  '.xtend-test-results/xtend-docs-quality-report.json',
  '.xtend-test-results/xtend-docs-shell-catfooding-report.json',
  '.xtend-test-results/xtend-docs-framework-ownership-report.json',
  '.xtend-test-results/xtend-xsurface-shard-report.json',
  '.xtend-test-results/xtend-xscaler-protocol-report.json',
  '.xtend-test-results/xtend-xscaler-source-to-sea-report.json'
]);

function readPackageManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

function artifactStatus(relativePath) {
  const absolutePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return {
      path: relativePath,
      exists: false
    };
  }
  const stat = fs.statSync(absolutePath);
  return {
    path: relativePath,
    exists: true,
    bytes: stat.size,
    mtime: stat.mtime.toISOString()
  };
}

function createManifest() {
  const packageManifest = readPackageManifest();
  const artifacts = ARTIFACT_PATHS.map(artifactStatus);
  const byPath = new Map(artifacts.map((artifact) => [artifact.path, artifact]));
  const requiredArtifactsPresent = Array.from(REQUIRED_ARTIFACTS).every((artifactPath) => {
    return Boolean(byPath.get(artifactPath) && byPath.get(artifactPath).exists);
  });

  return {
    schema: 'xtend.ci.nightly-build-manifest.v1',
    generatedAt: new Date().toISOString(),
    package: {
      name: packageManifest.name,
      version: packageManifest.version
    },
    runtime: {
      nodeVersion: process.version,
      npmVersion: commandVersion('npm')
    },
    github: {
      workflow: process.env.GITHUB_WORKFLOW || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runNumber: process.env.GITHUB_RUN_NUMBER || null,
      eventName: process.env.GITHUB_EVENT_NAME || null,
      ref: process.env.GITHUB_REF || null,
      sha: process.env.GITHUB_SHA || null,
      actor: process.env.GITHUB_ACTOR || null
    },
    commandSet: COMMANDS,
    optionalEvidence: {
      sourceToSea: process.env.XTEND_NIGHTLY_SOURCE_TO_SEA === '1',
      conditionalNetwork: process.env.XTEND_NIGHTLY_CONDITIONAL_NETWORK === '1'
    },
    artifacts,
    requiredArtifacts: Array.from(REQUIRED_ARTIFACTS),
    ok: requiredArtifactsPresent
  };
}

function main() {
  fs.mkdirSync(RESULT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(createManifest(), null, 2)}\n`);
  console.log(`XTend nightly manifest written: ${path.relative(ROOT_DIR, OUTPUT_PATH)}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  createManifest
};

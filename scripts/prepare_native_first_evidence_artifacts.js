#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.resolve(rootDir, '.xtend-test-results');
const cacheDir = process.env.XTEND_NPM_CACHE
  ? path.resolve(process.env.XTEND_NPM_CACHE)
  : path.resolve(outputDir, 'npm-cache');

const REQUIRED_ARTIFACTS = Object.freeze([
  '.xtend-test-results/xtend-npm-audit-report.json',
  '.xtend-test-results/xtend-conditional-network-evidence-report.json',
  '.xtend-test-results/xtend-pack-dry-run.json',
  '.xtend-test-results/xtend-package-export-lock-report.json'
]);

function resolveRepoPath(relativePath) {
  return path.resolve(rootDir, relativePath);
}

function runNodeScript(scriptPath, label) {
  const result = spawnSync(process.execPath, [resolveRepoPath(scriptPath)], {
    cwd: rootDir,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    timeout: 240000,
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
      NPM_CONFIG_CACHE: cacheDir
    }
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.error) {
    process.stderr.write(`${label} failed: ${result.error.message}\n`);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.stderr.write(`${label} exited with status ${result.status}\n`);
    process.exit(result.status || 1);
  }
}

function assertRequiredArtifacts() {
  return REQUIRED_ARTIFACTS.map((relativePath) => ({
    path: relativePath,
    exists: fs.existsSync(resolveRepoPath(relativePath))
  }));
}

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(cacheDir, { recursive: true });

runNodeScript('scripts/capture_conditional_network_evidence.js', 'conditional network evidence capture');
runNodeScript('scripts/capture_pack_dry_run.js', 'package dry-run evidence capture');
const artifacts = assertRequiredArtifacts();
const missing = artifacts.filter((artifact) => !artifact.exists);

const summary = {
  schema: 'xtend.native-first.evidence-preflight-report.v1',
  ok: missing.length === 0,
  requiredArtifactCount: REQUIRED_ARTIFACTS.length,
  artifacts
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (missing.length > 0) {
  process.exit(1);
}
